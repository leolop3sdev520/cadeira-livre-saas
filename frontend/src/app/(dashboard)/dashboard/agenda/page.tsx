"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  format,
  startOfToday,
  parseISO,
  isValid,
} from "date-fns";
import {
  Loader2,
  User,
  Scissors,
  Clock,
  CalendarX,
  Pencil,
  ArrowLeft,
} from "lucide-react";
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
import { toast } from "sonner";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { Skeleton } from "@/components/ui/skeleton";

type Appointment = {
  id: string;
  professional_id: string;
  professional_name: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  start_time: string;
  end_time: string;
  status: string;
};

type CalendarView = "day" | "week" | "month";

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<CalendarView>("day");
  const [date, setDate] = useState(startOfToday());

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
      setAppointments(data.filter((app) => app.status === "confirmed"));
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

  const handleSelectEvent = (event: { resource: Appointment }) => {
    setSelectedAppointment(event.resource);
    setIsEditing(false);
    setIsModalOpen(true);
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

  if (loading) {
    return (
      <div className="space-y-3 h-[calc(100vh-8rem)] flex flex-col">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="flex-1 min-h-0 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-125 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 h-[calc(100vh-8rem)] flex flex-col">
      <div className="shrink-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground">
          Gerencie os horários da sua barbearia.
        </p>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden p-4">
        <ScheduleCalendar
          events={appointments}
          view={view}
          date={date}
          onView={(v) => setView(v as CalendarView)}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
        />
      </div>

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

                  <div className="pt-4 border-t border-border mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleEditAppointment}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setIsCancelConfirmOpen(true)} // Abre o modal de confirmação
                    >
                      <CalendarX className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
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
