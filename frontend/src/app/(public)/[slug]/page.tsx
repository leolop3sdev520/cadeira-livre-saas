"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Scissors,
  Clock,
  Calendar,
  Check,
  Copy,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format, addDays, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Service = {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
};
type Professional = { id: string; name: string; email?: string };
type Slot = { startTime: string; endTime: string };
type Barbershop = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  logo_url: string | null;
};
const ANY_PROFESSIONAL: Professional = {
  id: "any",
  name: "Qualquer Profissional",
};

export default function BarbershopPublicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [barbershopNotFound, setBarbershopNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<
    "professional" | "datetime" | "confirm" | "success"
  >("professional");

  const today = startOfToday();
  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(today, i));
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<string>(
    format(next7Days[0], "yyyy-MM-dd"),
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [managementToken, setManagementToken] = useState<string | null>(null);
  const [allocatedProfessionalName, setAllocatedProfessionalName] = useState<
    string | null
  >(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const barbershop = await api.get<Barbershop>(
          `/api/v1/barbershops/${encodeURIComponent(slug)}`,
        );
        setBarbershop(barbershop);
        setBarbershopId(barbershop.id);

        const [servicesData, professionalsData] = await Promise.all([
          api.get<Service[]>("/api/v1/services", {
            headers: {
              "x-barbershop-id": barbershop.id,
            },
          }),
          api.get<Professional[]>("/api/v1/professionals", {
            headers: {
              "x-barbershop-id": barbershop.id,
            },
          }),
        ]);
        setServices(servicesData.sort((a, b) => a.name.localeCompare(b.name)));
        setProfessionals(professionalsData);
      } catch (err) {
        const errorObj = err as { status?: number };
        if (errorObj.status === 404) {
          setBarbershopNotFound(true);
        } else {
          console.error("Erro ao buscar dados da barbearia", err);
          setLoadError("Não foi possível carregar os dados da barbearia.");
        }
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [slug]);

  useEffect(() => {
    if (
      !barbershopId ||
      bookingStep !== "datetime" ||
      !selectedService ||
      !selectedProfessional
    )
      return;

    const currentBarbershopId = barbershopId;
    async function fetchAvailability() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const data = await api.get<{ slots: Slot[] }>(
          `/api/v1/availability?professionalId=${selectedProfessional!.id}&serviceId=${selectedService!.id}&date=${selectedDate}`,
          {
            headers: {
              "x-barbershop-id": currentBarbershopId,
            },
          },
        );
        setSlots(data.slots || []);
      } catch (err) {
        console.error("Erro ao buscar horários", err);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchAvailability();
  }, [
    barbershopId,
    bookingStep,
    selectedDate,
    selectedService,
    selectedProfessional,
  ]);

  const formatPrice = (cents: number) =>
    `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  const handleOpenModal = (open: boolean) => {
    setIsBookingModalOpen(open);
    if (open) {
      setBookingStep("professional");
      setSubmitError(null);
      setManagementToken(null);
      setAllocatedProfessionalName(null);
      setCopied(false);
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success("Código copiado!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  };

  const handleSubmitBooking = async () => {
    if (
      !barbershopId ||
      !selectedService ||
      !selectedProfessional ||
      !selectedSlot
    )
      return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const appointment = await api.post<{
        management_token: string;
        professional_name: string;
      }>(
        "/api/v1/appointments",
        {
          professionalId: selectedProfessional.id,
          serviceId: selectedService.id,
          customerName,
          customerEmail,
          startTime: selectedSlot.startTime,
        },
        {
          headers: {
            "x-barbershop-id": barbershopId,
          },
        },
      );

      setManagementToken(appointment.management_token);
      setAllocatedProfessionalName(appointment.professional_name);
      setBookingStep("success");
      setCustomerName("");
      setCustomerEmail("");
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setSubmitError(errorObj?.message || "Erro ao confirmar agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loading && barbershopNotFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Barbearia não encontrada</h1>
          <p className="mt-2 text-muted-foreground">
            Confira o endereço ou volte para a página inicial.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex text-primary hover:underline"
          >
            Ir para Cadeira Livre
          </Link>
        </div>
      </main>
    );
  }

  if (!loading && loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Não foi possível carregar a vitrine</h1>
          <p className="mt-2 text-muted-foreground">{loadError}</p>
          <Link
            href="/"
            className="mt-6 inline-flex text-primary hover:underline"
          >
            Ir para Cadeira Livre
          </Link>
        </div>
      </main>
    );
  }

  if (loading || !barbershopId) {
    return (
      <main className="min-h-screen bg-background px-4 py-16 text-foreground">
        <div className="mx-auto max-w-4xl animate-pulse space-y-8">
          <div className="h-24 w-full rounded-xl bg-card" />
          <div className="h-10 w-64 rounded bg-card" />
          <div className="h-28 w-full rounded-xl bg-card" />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="relative h-48 w-full bg-card">
        <div className="absolute inset-0 pole opacity-20" />
        <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
      </div>

      <main className="mx-auto max-w-4xl px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground font-display text-3xl font-bold border-4 border-background">
              {barbershop?.logo_url ? (
                <img
                  src={barbershop.logo_url}
                  className="h-full w-full rounded-full object-cover"
                  alt="Logo"
                />
              ) : (
                barbershop?.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {barbershop?.name}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                {barbershop?.address || "Endereço não cadastrado"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-3">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Nossos Serviços
            </h2>
            {loading && (
              <p className="text-muted-foreground animate-pulse">
                Carregando...
              </p>
            )}
            {services.map((service) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={cn(
                    "w-full text-left group flex items-center justify-between p-4 rounded-xl bg-card border transition-all",
                    isSelected
                      ? "border-primary ring-1 ring-primary bg-muted"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted border-border",
                      )}
                    >
                      <Scissors className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{service.duration_min} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-semibold text-foreground">
                      {formatPrice(service.price_cents)}
                    </span>
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full border flex items-center justify-center",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border text-transparent",
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="md:col-span-1">
            <div className="sticky top-6 rounded-2xl bg-card border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Seu agendamento</h3>
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Serviço</span>
                  <span className="font-medium text-foreground text-right max-w-30">
                    {selectedService ? selectedService.name : "Nenhum"}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Profissional</span>
                  <span className="font-medium text-foreground text-right max-w-30">
                    {selectedProfessional
                      ? selectedProfessional.id === "any"
                        ? "Qualquer Profissional"
                        : selectedProfessional.name
                      : "Qualquer um"}
                  </span>
                </div>
                {selectedService && (
                  <div className="flex justify-between border-t border-border pt-4 mt-4">
                    <span className="text-foreground font-semibold">Total</span>
                    <span className="font-bold text-primary text-lg">
                      {formatPrice(selectedService.price_cents)}
                    </span>
                  </div>
                )}
              </div>

              <Dialog open={isBookingModalOpen} onOpenChange={handleOpenModal}>
                <DialogTrigger
                  disabled={!selectedService}
                  className="w-full inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors disabled:opacity-50 bg-primary hover:bg-primary/85 text-primary-foreground h-12"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedService
                    ? "Escolher horário"
                    : "Selecione um serviço"}
                </DialogTrigger>

                <DialogContent className="w-[95vw] sm:max-w-125 bg-popover border-border text-popover-foreground">
                  {bookingStep !== "success" && (
                    <DialogHeader>
                      <DialogTitle>
                        {bookingStep === "professional" &&
                          "Escolha o Profissional"}
                        {bookingStep === "datetime" && "Escolha o Horário"}
                        {bookingStep === "confirm" && "Confirme seus dados"}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        {bookingStep === "professional" &&
                          `Quem vai realizar o serviço: ${selectedService?.name}?`}
                        {bookingStep === "datetime" &&
                          `Selecione a melhor data e horário com ${selectedProfessional?.name}`}
                        {bookingStep === "confirm" &&
                          "Quase tudo pronto! Só precisamos do seu nome e e-mail."}
                      </DialogDescription>
                    </DialogHeader>
                  )}

                  {bookingStep === "professional" && (
                    <div className="py-4 space-y-3">
                      {[ANY_PROFESSIONAL, ...professionals].map((prof) => {
                        const isAny = prof.id === "any";
                        const isSelected =
                          selectedProfessional?.id === prof.id;
                        const ProfessionalIcon = isAny ? Users : User;
                        return (
                          <button
                            key={prof.id}
                            onClick={() => setSelectedProfessional(prof)}
                            className={cn(
                              "w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all",
                              isSelected
                                ? "border-primary ring-1 ring-primary bg-muted"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-full",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card border border-border",
                                )}
                              >
                                <ProfessionalIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">
                                  {prof.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {isAny ? "O primeiro disponível" : "Barbeiro"}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </button>
                        );
                      })}
                      <div className="pt-4 border-t border-border flex justify-end">
                        <button
                          disabled={!selectedProfessional}
                          onClick={() => setBookingStep("datetime")}
                          className="inline-flex items-center justify-center rounded-md text-sm font-bold disabled:opacity-50 bg-primary hover:bg-primary/85 text-primary-foreground h-10 px-6"
                        >
                          Continuar <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {bookingStep === "datetime" && (
                    <div className="py-2 space-y-6 w-full min-w-0">
                      <div className="flex gap-2 overflow-x-auto pb-2 w-full scrollbar-hide">
                        {next7Days.map((day) => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const isSelected = selectedDate === dateStr;
                          const weekday = format(day, "eee", {
                            locale: ptBR,
                          }).replace(".", "");
                          const dayNumber = format(day, "dd");

                          return (
                            <button
                              key={dateStr}
                              onClick={() => setSelectedDate(dateStr)}
                              className={cn(
                                "shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border transition-all",
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "bg-card border-border text-foreground hover:border-primary/50",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-xs capitalize mb-1",
                                  isSelected
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground",
                                )}
                              >
                                {weekday}
                              </span>
                              <span className="text-xl font-bold">
                                {dayNumber}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="w-full">
                        <h4 className="text-sm font-semibold text-foreground mb-3">
                          Horários disponíveis
                        </h4>
                        {loadingSlots ? (
                          <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />{" "}
                            Buscando...
                          </div>
                        ) : slots.length === 0 ? (
                          <p className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                            Nenhum horário livre para este dia.
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full">
                            {slots.map((slot) => {
                              const isSelected =
                                selectedSlot?.startTime === slot.startTime;
                              const timeStr = format(
                                new Date(slot.startTime),
                                "HH:mm",
                              );

                              return (
                                <button
                                  key={slot.startTime}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={cn(
                                    "h-10 rounded-md text-sm font-semibold transition-all border",
                                    isSelected
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "bg-card border-border text-foreground hover:bg-muted hover:border-primary/50",
                                  )}
                                >
                                  {timeStr}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-border flex justify-between items-center w-full">
                        <button
                          onClick={() => setBookingStep("professional")}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          Voltar
                        </button>
                        <button
                          disabled={!selectedSlot}
                          onClick={() => setBookingStep("confirm")}
                          className="inline-flex items-center justify-center rounded-md text-sm font-bold disabled:opacity-50 bg-primary hover:bg-primary/85 text-primary-foreground h-10 px-6"
                        >
                          Continuar <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {bookingStep === "confirm" && (
                    <div className="py-2 space-y-5">
                      <div className="bg-muted p-4 rounded-xl border border-border space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Serviço:
                          </span>{" "}
                          <span className="text-foreground font-medium">
                            {selectedService?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Profissional:
                          </span>{" "}
                          <span className="text-foreground font-medium">
                            {selectedProfessional?.id === "any"
                              ? "Qualquer Profissional"
                              : selectedProfessional?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Data/Hora:
                          </span>{" "}
                          <span className="text-primary font-medium">
                            {selectedSlot &&
                              format(
                                new Date(selectedSlot.startTime),
                                "dd/MM 'às' HH:mm",
                              )}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 mt-2">
                          <span className="text-foreground font-bold">Total:</span>{" "}
                          <span className="text-foreground font-bold">
                            {formatPrice(selectedService?.price_cents || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                            Seu nome
                          </label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Ex: João Silva"
                            className="w-full bg-muted border border-border rounded-md h-10 px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                            Seu e-mail
                          </label>
                          <input
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="Ex: joao@email.com"
                            className="w-full bg-muted border border-border rounded-md h-10 px-3 text-sm text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      {submitError && (
                        <div className="p-3 bg-danger-bg text-danger-fg text-sm rounded-md border border-danger">
                          {submitError}
                        </div>
                      )}

                      <div className="pt-4 border-t border-border flex justify-between items-center w-full">
                        <button
                          disabled={isSubmitting}
                          onClick={() => setBookingStep("datetime")}
                          className="text-sm text-muted-foreground hover:text-foreground flex items-center"
                        >
                          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                        </button>
                        <button
                          disabled={
                            !customerName || !customerEmail || isSubmitting
                          }
                          onClick={handleSubmitBooking}
                          className="inline-flex items-center justify-center rounded-md text-sm font-bold disabled:opacity-50 bg-primary hover:bg-primary/85 text-primary-foreground h-10 px-6"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                              Agendando...
                            </>
                          ) : (
                            "Confirmar Agendamento"
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {bookingStep === "success" && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                      <div className="h-20 w-20 bg-success-bg rounded-full flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-10 w-10 text-success" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Tudo Certo!
                      </h2>
                      <p className="text-muted-foreground text-sm max-w-70">
                        {allocatedProfessionalName
                          ? `Seu horário foi reservado com ${allocatedProfessionalName}.`
                          : "Seu horário foi reservado com sucesso."}
                      </p>
                      {managementToken && (
                        <div className="w-full rounded-lg border border-border bg-muted p-4">
                          <p className="text-left text-sm text-muted-foreground">
                            Guarde este código para gerenciar ou cancelar seu
                            agendamento. Código:
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="break-all font-mono text-lg font-bold tracking-wider text-primary">
                              {managementToken}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={
                                copied ? "Código copiado" : "Copiar código"
                              }
                              title={copied ? "Código copiado" : "Copiar código"}
                              onClick={() => void handleCopyToken(managementToken)}
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="w-full pt-6">
                        <Link
                          href={`/${encodeURIComponent(slug)}/meus-agendamentos`}
                          className="mb-3 w-full inline-flex items-center justify-center rounded-md border border-border text-sm font-semibold text-foreground hover:bg-muted h-11"
                        >
                          Gerenciar meus agendamentos
                        </Link>
                        <button
                          onClick={() => setIsBookingModalOpen(false)}
                          className="w-full inline-flex items-center justify-center rounded-md text-sm font-bold bg-primary hover:bg-primary/85 text-primary-foreground h-12"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
