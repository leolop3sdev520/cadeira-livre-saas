"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Clock, Scissors, UserRound } from "lucide-react";
import { Toaster, toast } from "sonner";
import { api } from "@/lib/api";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Barbershop = { id: string; name: string; slug: string };
type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  service_name: string;
  professional_name: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  const apiError = error as { message?: string };
  return apiError.message || fallback;
}

export default function MyAppointmentsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [barbershopId, setBarbershopId] = useState<string | null>(null);
  const [barbershopName, setBarbershopName] = useState("");
  const [loadingBarbershop, setLoadingBarbershop] = useState(true);
  const [barbershopNotFound, setBarbershopNotFound] = useState(false);
  const [barbershopLoadError, setBarbershopLoadError] = useState<string | null>(
    null,
  );
  const [email, setEmail] = useState("");
  const [managementToken, setManagementToken] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    void api
      .get<Barbershop>(`/api/v1/barbershops/${encodeURIComponent(slug)}`)
      .then((barbershop) => {
        if (!active) return;
        setBarbershopId(barbershop.id);
        setBarbershopName(barbershop.name);
      })
      .catch((error: unknown) => {
        const apiError = error as { status?: number; message?: string };
        if (!active) return;
        setBarbershopNotFound(apiError.status === 404);
        if (apiError.status !== 404) {
          setBarbershopLoadError(
            apiError.message || "Erro ao carregar a barbearia.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingBarbershop(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const searchAppointments = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!barbershopId) return;

    setIsSearching(true);
    setHasSearched(true);
    setAppointments([]);
    try {
      const query = new URLSearchParams({
        email: email.trim(),
        management_token: managementToken.trim(),
      });
      const result = await api.get<Appointment[]>(
        `/api/v1/appointments/public?${query.toString()}`,
        { headers: { "x-barbershop-id": barbershopId } },
      );
      setAppointments(result);
    } catch (error: unknown) {
      const apiError = error as { status?: number; message?: string };
      if (apiError.status !== 404) {
        toast.error(
          getErrorMessage(error, "Não foi possível buscar os agendamentos."),
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  const cancelAppointment = async () => {
    if (!selectedAppointment || !barbershopId) return;

    setIsCancelling(true);
    try {
      await api.patch(
        `/api/v1/appointments/${selectedAppointment.id}/cancel`,
        {
          reason: "Cancelado pelo cliente",
          managementToken: managementToken.trim(),
        },
        { headers: { "x-barbershop-id": barbershopId } },
      );
      setAppointments((current) =>
        current.filter(
          (appointment) => appointment.id !== selectedAppointment.id,
        ),
      );
      setSelectedAppointment(null);
      toast.success("Agendamento cancelado.");
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Não foi possível cancelar o agendamento."),
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (loadingBarbershop) {
    return (
      <main className="min-h-screen animate-pulse bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="mx-auto h-64 max-w-xl rounded-xl bg-muted" />
        </div>
      </main>
    );
  }

  if (barbershopNotFound || !barbershopId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            {barbershopLoadError
              ? "Não foi possível carregar os agendamentos"
              : "Barbearia não encontrada"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {barbershopLoadError ||
              "Confira o endereço e tente novamente."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex text-primary hover:underline"
          >
            Ir para Cadeira Livre
          </Link>
        </div>
        <Toaster richColors position="top-right" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
        <header className="mb-12 flex items-center justify-between">
          <Link
            href={`/${encodeURIComponent(slug)}`}
            className="text-sm font-semibold text-primary"
          >
            {barbershopName}
          </Link>
          <Link
            href={`/${encodeURIComponent(slug)}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar à vitrine
          </Link>
        </header>

        <section className="mx-auto w-full max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Meus agendamentos
            </h1>
            <p className="mt-2 text-muted-foreground">
              Informe o e-mail e o código de acesso recebido ao agendar.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Buscar agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={searchAppointments} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-email">E-mail</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="management-token">
                    Código de Acesso (Token)
                  </Label>
                  <Input
                    id="management-token"
                    autoComplete="off"
                    required
                    value={managementToken}
                    onChange={(event) => setManagementToken(event.target.value)}
                    placeholder="UUID exibido ao confirmar o agendamento"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isSearching || !email.trim() || !managementToken.trim()
                  }
                >
                  {isSearching ? "Buscando..." : "Buscar Agendamentos"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {hasSearched && !isSearching && appointments.length === 0 && (
            <p
              role="status"
              className="mt-6 rounded-lg border border-border bg-card p-5 text-center text-muted-foreground"
            >
              Nenhum agendamento encontrado para este e-mail e código de acesso.
            </p>
          )}

          {appointments.length > 0 && (
            <div className="mt-6 space-y-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <Scissors className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Serviço
                          </p>
                          <p className="font-medium">
                            {appointment.service_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <UserRound className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Profissional
                          </p>
                          <p className="font-medium">
                            {appointment.professional_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Data</p>
                          <p className="font-medium">
                            {format(
                              parseISO(appointment.start_time),
                              "EEEE, dd/MM/yyyy",
                              { locale: ptBR },
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Horário
                          </p>
                          <p className="font-medium">
                            {format(parseISO(appointment.start_time), "HH:mm")}{" "}
                            às {format(parseISO(appointment.end_time), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end border-t border-border pt-3">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        Cancelar Agendamento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <AlertDialog
        open={Boolean(selectedAppointment)}
        onOpenChange={(open) => {
          if (!open && !isCancelling) setSelectedAppointment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar este agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O agendamento de {selectedAppointment?.service_name} será
              cancelado. Cancelamentos feitos com menos de duas horas de
              antecedência não são permitidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Manter agendamento
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelAppointment}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelando..." : "Confirmar cancelamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster richColors position="top-right" />
    </main>
  );
}
