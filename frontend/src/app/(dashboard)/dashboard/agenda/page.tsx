"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  startOfWeek,
  startOfToday,
  parseISO,
  isValid,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2,
  User,
  Scissors,
  Clock,
  CalendarX,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Mail,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import type { View } from "react-big-calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@/components/schedule-calendar";

type CalendarView = "day" | "week";
type AppointmentService = {
  id: string;
  name: string;
  is_active: boolean;
};
type AppointmentProfessional = {
  id: string;
  name: string;
  is_active: boolean;
};

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<CalendarView>("week");
  const [date, setDate] = useState(startOfToday());
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [newAppointmentStart, setNewAppointmentStart] = useState("");
  const [appointmentServices, setAppointmentServices] = useState<
    AppointmentService[]
  >([]);
  const [appointmentProfessionals, setAppointmentProfessionals] = useState<
    AppointmentProfessional[]
  >([]);
  const [appointmentOptionsLoaded, setAppointmentOptionsLoaded] =
    useState(false);
  const [loadingAppointmentOptions, setLoadingAppointmentOptions] =
    useState(false);
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newProfessionalId, setNewProfessionalId] = useState("");
  const selectedService = appointmentServices.find(
    (service) => service.id === newServiceId,
  );
  const selectedProfessional = appointmentProfessionals.find(
    (professional) => professional.id === newProfessionalId,
  );

  // Estados do Modal de Detalhes/Edição
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editStartTime, setEditStartTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Estados do Modal de Cancelamento e Loading
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  async function loadAppointments() {
    try {
      const data = await api.get<Appointment[]>("/api/v1/appointments");
      setAppointments(data);
    } catch (err: unknown) {
      console.error(err);
      toast.error("Erro ao carregar a agenda.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAppointments();
  }, []);

  useEffect(() => {
    if (!isNewAppointmentOpen || appointmentOptionsLoaded) return;

    let cancelled = false;
    async function loadAppointmentOptions() {
      setLoadingAppointmentOptions(true);
      try {
        const [services, professionals] = await Promise.all([
          api.get<AppointmentService[]>("/api/v1/services"),
          api.get<AppointmentProfessional[]>("/api/v1/professionals"),
        ]);
        if (cancelled) return;
        setAppointmentServices(services.filter((service) => service.is_active));
        setAppointmentProfessionals(
          professionals.filter((professional) => professional.is_active),
        );
        setAppointmentOptionsLoaded(true);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        toast.error("Não foi possível carregar serviços e profissionais.");
      } finally {
        if (!cancelled) setLoadingAppointmentOptions(false);
      }
    }

    void loadAppointmentOptions();
    return () => {
      cancelled = true;
    };
  }, [appointmentOptionsLoaded, isNewAppointmentOpen]);

  const handleSelectEvent = (event: { resource: Appointment }) => {
    setSelectedAppointment(event.resource);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleViewChange = (nextView: View) => {
    if (nextView === "day" || nextView === "week") {
      setView(nextView);
    }
  };

  const changeDate = (direction: -1 | 1) => {
    if (view === "day") {
      setDate((currentDate) => addDays(currentDate, direction));
    } else {
      setDate((currentDate) => addWeeks(currentDate, direction));
    }
  };

  const getPeriodLabel = () => {
    if (view === "day") {
      return format(date, "dd MMM yyyy", { locale: ptBR })
        .replace(/\./g, "")
        .toLocaleUpperCase("pt-BR");
    }

    const periodStart = startOfWeek(date, { weekStartsOn: 1 });
    const periodEnd = endOfWeek(date, { weekStartsOn: 1 });

    return `${format(periodStart, "dd MMM", { locale: ptBR })} A ${format(
      periodEnd,
      "dd MMM yyyy",
      { locale: ptBR },
    )}`
      .replace(/\./g, "")
      .toLocaleUpperCase("pt-BR");
  };

  const handleCreateAppointment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!newServiceId || !newProfessionalId) {
      toast.error("Selecione um serviço e um profissional.");
      return;
    }
    if (newCustomerName.trim().length < 3) {
      toast.error("O nome do cliente deve ter pelo menos 3 caracteres.");
      return;
    }
    const startTime = new Date(newAppointmentStart);
    if (!isValid(startTime)) {
      toast.error("Informe uma data e horário válidos.");
      return;
    }

    setIsCreatingAppointment(true);
    try {
      await api.post("/api/v1/appointments", {
        professionalId: newProfessionalId,
        serviceId: newServiceId,
        customerName: newCustomerName.trim(),
        customerEmail: newCustomerEmail.trim(),
        startTime: startTime.toISOString(),
      });

      toast.success("Agendamento criado com sucesso.");
      setIsNewAppointmentOpen(false);
      setNewAppointmentStart("");
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewServiceId("");
      setNewProfessionalId("");
      await loadAppointments();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(errorObj.message || "Erro ao criar agendamento.");
    } finally {
      setIsCreatingAppointment(false);
    }
  };

  const confirmCancelAppointment = async () => {
    if (!selectedAppointment) return;

    setIsCancelling(true);
    try {
      await api.patch(`/api/v1/appointments/${selectedAppointment.id}/cancel`, {
        reason: "Cancelado pelo painel do barbeiro",
      });

      toast.success("Agendamento cancelado com sucesso!");
      setIsCancelConfirmOpen(false);
      setIsModalOpen(false);
      await loadAppointments();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(errorObj.message || "Erro ao cancelar agendamento.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleEditAppointment = () => {
    if (!selectedAppointment) return;
    setEditStartTime(
      format(parseISO(selectedAppointment.start_time), "yyyy-MM-dd'T'HH:mm"),
    );
    setIsEditing(true);
  };

  const handleRescheduleAppointment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!selectedAppointment || !editStartTime) return;

    const newStartTime = new Date(editStartTime);
    if (!isValid(newStartTime)) {
      toast.error("Informe uma data e horário válidos.");
      return;
    }

    setIsRescheduling(true);
    try {
      await api.patch(`/api/v1/appointments/${selectedAppointment.id}`, {
        startTime: newStartTime.toISOString(),
      });

      toast.success("Agendamento reagendado com sucesso!");
      setIsModalOpen(false);
      setIsEditing(false);
      await loadAppointments();
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      if (errorObj.status === 409) {
        toast.error("Esse horário já está ocupado. Escolha outro horário.");
      } else {
        toast.error(errorObj.message || "Erro ao reagendar agendamento.");
      }
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="-m-6 flex min-h-[calc(100vh-4rem)] flex-col gap-6 bg-background p-6 text-foreground">
      <div className="flex shrink-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minha Agenda</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Clique em um horário vazio para marcar direto nele.
          </p>
        </div>
        <Button
          type="button"
          className="h-9 gap-2 self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 xl:self-auto"
          onClick={() => {
            setNewAppointmentStart("");
            setIsNewAppointmentOpen(true);
          }}
        >
          <CalendarPlus className="size-4" />
          Novo agendamento
        </Button>
      </div>

      <div className="shrink-0 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <ToggleGroup
            value={[view]}
            spacing={0}
            aria-label="Visualização da agenda"
            className="h-10 w-fit rounded-lg border border-border bg-background p-1"
            onValueChange={(values) => {
              const nextView = values[0];
              if (nextView === "day" || nextView === "week") {
                setView(nextView);
              }
            }}
          >
            <ToggleGroupItem
              value="day"
              aria-label="Visualização por dia"
              className="h-8 px-3 text-xs text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground data-pressed:bg-primary/10 data-pressed:text-primary"
            >
              Dia
            </ToggleGroupItem>
            <ToggleGroupItem
              value="week"
              aria-label="Visualização por semana"
              className="h-8 px-3 text-xs text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground data-pressed:bg-primary/10 data-pressed:text-primary"
            >
              Semana
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex flex-wrap items-center gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 border-border bg-background transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
              aria-label="Período anterior"
              onClick={() => changeDate(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-44 text-center text-xs font-semibold tracking-[0.08em] sm:min-w-52">
              {getPeriodLabel()}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 border-border bg-background transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
              aria-label="Próximo período"
              onClick={() => changeDate(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 border-border bg-background px-3 text-xs transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
              onClick={() => setDate(startOfToday())}
            >
              Hoje
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-112 flex-1 overflow-hidden rounded-xl border border-border bg-background p-3 shadow-sm sm:p-5">
        {loading ? (
          <Skeleton className="h-full min-h-112 w-full rounded-lg" />
        ) : (
          <ScheduleCalendar
            events={appointments}
            view={view}
            date={date}
            onView={handleViewChange}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={(slot) => {
              setNewAppointmentStart(format(slot.start, "yyyy-MM-dd'T'HH:mm"));
              setIsNewAppointmentOpen(true);
            }}
          />
        )}
      </div>

      <Dialog
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para reservar um horário na agenda.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-appointment-customer">Nome do cliente</Label>
              <Input
                id="new-appointment-customer"
                autoComplete="name"
                placeholder="Ex.: Leonardo Lopes"
                value={newCustomerName}
                onChange={(event) => setNewCustomerName(event.target.value)}
                required
                minLength={3}
                className="h-10 bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-appointment-email">E-mail do cliente</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-appointment-email"
                  type="email"
                  autoComplete="email"
                  placeholder="cliente@exemplo.com"
                  value={newCustomerEmail}
                  onChange={(event) => setNewCustomerEmail(event.target.value)}
                  required
                  className="h-10 bg-background pl-9"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-appointment-service">Serviço</Label>
                <Select
                  value={newServiceId || null}
                  onValueChange={(value) => setNewServiceId(value ?? "")}
                  disabled={loadingAppointmentOptions}
                >
                  <SelectTrigger
                    id="new-appointment-service"
                    className="h-10 w-full bg-background"
                  >
                    <SelectValue placeholder="Selecione um serviço">
                      {selectedService?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingAppointmentOptions &&
                  appointmentOptionsLoaded &&
                  appointmentServices.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum serviço ativo disponível.
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-appointment-professional">
                  Profissional
                </Label>
                <Select
                  value={newProfessionalId || null}
                  onValueChange={(value) => setNewProfessionalId(value ?? "")}
                  disabled={loadingAppointmentOptions}
                >
                  <SelectTrigger
                    id="new-appointment-professional"
                    className="h-10 w-full bg-background"
                  >
                    <SelectValue placeholder="Selecione um profissional">
                      {newProfessionalId === "any"
                        ? "Qualquer profissional"
                        : selectedProfessional?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer profissional</SelectItem>
                    {appointmentProfessionals.map((professional) => (
                      <SelectItem key={professional.id} value={professional.id}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!loadingAppointmentOptions &&
                  appointmentOptionsLoaded &&
                  appointmentProfessionals.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum profissional ativo cadastrado.
                    </p>
                  )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-appointment-start">Data e horário</Label>
              <Input
                id="new-appointment-start"
                type="datetime-local"
                value={newAppointmentStart}
                onChange={(event) => setNewAppointmentStart(event.target.value)}
                required
                className="h-10 bg-background"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewAppointmentOpen(false)}
                disabled={isCreatingAppointment}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingAppointment || loadingAppointmentOptions}
              >
                {isCreatingAppointment && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Criar agendamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DETALHES / EDIÇÃO */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setIsEditing(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Reagendar Agendamento" : "Detalhes do Agendamento"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Escolha a nova data e horário para este agendamento."
                : "Informações do cliente e do serviço."}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 py-4">
              {isEditing ? (
                <form
                  onSubmit={handleRescheduleAppointment}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="reschedule-start-time">
                      Nova data e horário
                    </Label>
                    <Input
                      id="reschedule-start-time"
                      type="datetime-local"
                      value={editStartTime}
                      onChange={(event) => setEditStartTime(event.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Atual:{" "}
                      {format(
                        parseISO(selectedAppointment.start_time),
                        "dd/MM/yyyy 'às' HH:mm",
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsEditing(false)}
                      disabled={isRescheduling}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isRescheduling || !editStartTime}
                    >
                      {isRescheduling && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar horário
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Cliente
                    </span>
                    <p className="font-medium">
                      {selectedAppointment.customer_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.customer_email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Scissors className="h-4 w-4" /> Serviço
                      </span>
                      <p className="font-medium">
                        {selectedAppointment.service_name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" /> Profissional
                      </span>
                      <p className="font-medium">
                        {selectedAppointment.professional_name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Horário
                    </span>
                    <p className="font-medium">
                      {format(
                        parseISO(selectedAppointment.start_time),
                        "dd/MM/yyyy 'às' HH:mm",
                      )}{" "}
                      -{" "}
                      {format(parseISO(selectedAppointment.end_time), "HH:mm")}
                    </p>
                  </div>

                  {selectedAppointment.status !== "cancelled" &&
                    selectedAppointment.status !== "completed" && (
                      <div className="mt-4 flex gap-2 border-t border-border pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleEditAppointment}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => setIsCancelConfirmOpen(true)}
                        >
                          <CalendarX className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  {selectedAppointment.status === "cancelled" && (
                    <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                      Este agendamento foi cancelado.
                    </p>
                  )}
                  {selectedAppointment.status === "completed" && (
                    <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                      Este agendamento foi concluído.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO */}
      <AlertDialog
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja cancelar o agendamento de{" "}
              <strong>{selectedAppointment?.customer_name}</strong>? Esta ação
              não pode ser desfeita e o horário ficará livre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Evita que o modal feche antes da requisição terminar
                confirmCancelAppointment();
              }}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Sim, cancelar agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
