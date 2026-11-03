"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Loader2,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
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

type Professional = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
};

type WorkingHour = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
};

const professionalSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras."),
  email: z.string().email("Insira um e-mail válido."),
  phone: z.string().min(10, "Insira um telefone válido com DDD."),
});

type ProfessionalForm = z.infer<typeof professionalSchema>;

const workingHourSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido."),
    end_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido."),
  })
  .refine((data) => data.start_time < data.end_time, {
    message: "O horário de término deve ser posterior ao início.",
    path: ["end_time"],
  });

type WorkingHourForm = z.infer<typeof workingHourSchema>;

const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export default function EquipePage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] =
    useState<Professional | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [profToToggle, setProfToToggle] = useState<Professional | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedProfForSchedule, setSelectedProfForSchedule] =
    useState<Professional | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);
  const [isAddingHour, setIsAddingHour] = useState(false);
  const [deletingHourId, setDeletingHourId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfessionalForm>({
    resolver: zodResolver(professionalSchema),
  });

  const workingHourForm = useForm<WorkingHourForm>({
    resolver: zodResolver(workingHourSchema),
    defaultValues: {
      weekday: 1,
      start_time: "09:00",
      end_time: "18:00",
    },
  });

  async function loadProfessionals() {
    try {
      const data = await api.get<Professional[]>("/api/v1/professionals");
      setProfessionals(data);
    } catch {
      toast.error("Erro ao carregar a lista de profissionais.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfessionals();
  }, []);

  useEffect(() => {
    if (!isScheduleModalOpen || !selectedProfForSchedule) return;

    let active = true;
    async function loadWorkingHours() {
      setLoadingHours(true);
      try {
        const data = await api.get<WorkingHour[]>(
          `/api/v1/professionals/${selectedProfForSchedule!.id}/working-hours`,
        );
        if (active) setWorkingHours(data);
      } catch (error: unknown) {
        const errorObj = error as { message?: string };
        if (active) {
          toast.error(
            errorObj.message || "Erro ao carregar a jornada de trabalho.",
          );
        }
      } finally {
        if (active) setLoadingHours(false);
      }
    }

    void loadWorkingHours();
    return () => {
      active = false;
    };
  }, [isScheduleModalOpen, selectedProfForSchedule]);

  const onSubmit = async (data: ProfessionalForm) => {
    setIsSubmitting(true);
    try {
      if (editingProfessional) {
        // REQUISIÇÃO DE EDIÇÃO (PATCH)
        await api.patch(
          `/api/v1/professionals/${editingProfessional.id}`,
          data,
        );
        toast.success("Profissional atualizado com sucesso!");
      } else {
        // REQUISIÇÃO DE CRIAÇÃO (POST)
        await api.post("/api/v1/professionals", data);
        toast.success("Profissional adicionado com sucesso!");
      }

      setIsModalOpen(false);
      reset();
      loadProfessionals();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(errorObj?.message || "Erro ao salvar profissional.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openToggleConfirm = (prof: Professional) => {
    setProfToToggle(prof);
    setIsConfirmOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!profToToggle) return;
    try {
      await api.patch(
        `/api/v1/professionals/${profToToggle.id}/toggle-status`,
        {},
      );
      toast.success(
        `Profissional ${profToToggle.is_active ? "desativado" : "reativado"}!`,
      );
      loadProfessionals();
    } catch {
      toast.error(
        `Erro ao ${profToToggle.is_active ? "desativar" : "reativar"} profissional.`,
      );
    } finally {
      setIsConfirmOpen(false);
      setProfToToggle(null);
    }
  };

  // 👇 AQUI ESTÁ A FUNÇÃO OPENEDITMODAL 👇
  const openEditModal = (prof: Professional) => {
    setEditingProfessional(prof); // Define qual item está sendo editado
    reset({
      name: prof.name,
      email: prof.email,
      phone: prof.phone || "", // Se for null, vira vazio
    });
    setIsModalOpen(true); // Abre o modal
  };

  const openScheduleModal = (prof: Professional) => {
    setWorkingHours([]);
    workingHourForm.reset({
      weekday: 1,
      start_time: "09:00",
      end_time: "18:00",
    });
    setSelectedProfForSchedule(prof);
    setIsScheduleModalOpen(true);
  };

  const submitWorkingHour = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!selectedProfForSchedule) return;

    await workingHourForm.handleSubmit(async (data) => {
      setIsAddingHour(true);
      try {
        const createdHour = await api.post<WorkingHour>(
          `/api/v1/professionals/${selectedProfForSchedule.id}/working-hours`,
          data,
        );
        setWorkingHours((current) =>
          [...current, createdHour].sort(
            (a, b) =>
              a.weekday - b.weekday ||
              a.start_time.localeCompare(b.start_time),
          ),
        );
        toast.success("Turno adicionado à jornada.");
        workingHourForm.reset({
          weekday: data.weekday,
          start_time: "09:00",
          end_time: "18:00",
        });
      } catch (error: unknown) {
        const errorObj = error as { message?: string };
        toast.error(errorObj.message || "Erro ao adicionar o turno.");
      } finally {
        setIsAddingHour(false);
      }
    })(event);
  };

  const removeWorkingHour = async (hour: WorkingHour) => {
    if (!selectedProfForSchedule) return;

    setDeletingHourId(hour.id);
    try {
      await api.delete<void>(
        `/api/v1/professionals/${selectedProfForSchedule.id}/working-hours/${hour.id}`,
      );
      setWorkingHours((current) =>
        current.filter((workingHour) => workingHour.id !== hour.id),
      );
      toast.success("Turno removido da jornada.");
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      toast.error(errorObj.message || "Erro ao remover o turno.");
    } finally {
      setDeletingHourId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
            <p className="text-muted-foreground">
              Gerencie os profissionais da sua barbearia.
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                setEditingProfessional(null);
                reset();
              } // Limpa o form ao fechar
            }}
          >
            <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              <Plus className="mr-2 h-4 w-4" /> Novo Profissional
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
              <DialogHeader>
                <DialogTitle>
                  {editingProfessional
                    ? "Editar Profissional"
                    : "Novo Profissional"}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Rafael Almeida"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: rafael@barbearia.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="Ex: 11999999999"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="mr-2"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-35"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border border-border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={`professional-skeleton-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <Skeleton className="h-5 w-36" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-44" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-9 w-9 rounded-md" />
                          <Skeleton className="h-9 w-9 rounded-md" />
                          <Skeleton className="h-9 w-9 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : professionals.map((prof) => (
                <TableRow
                  key={prof.id}
                  className={!prof.is_active ? "opacity-60 bg-muted/20" : ""}
                >
                  <TableCell className="font-medium flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                      {prof.name.charAt(0).toUpperCase()}
                    </div>
                    {prof.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {prof.email}
                      </span>
                      {prof.phone && (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {prof.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={prof.is_active} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => openScheduleModal(prof)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Jornada de Trabalho</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      {/* 👇 O BOTÃO QUE CHAMA A EDIÇÃO 👇 */}
                      <TooltipTrigger
                        onClick={() => openEditModal(prof)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => openToggleConfirm(prof)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-destructive"
                      >
                        {prof.is_active ? (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        ) : (
                          <RotateCcw className="h-4 w-4 text-success" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{prof.is_active ? "Desativar" : "Reativar"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá {profToToggle?.is_active ? "desativar" : "reativar"} o
              profissional <strong>{profToToggle?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>
              Sim, {profToToggle?.is_active ? "desativar" : "reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isScheduleModalOpen}
        onOpenChange={(open) => {
          setIsScheduleModalOpen(open);
          if (!open) {
            setSelectedProfForSchedule(null);
            setWorkingHours([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Jornada de Trabalho</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Gerencie os turnos de {selectedProfForSchedule?.name}.
            </p>

            <form
              onSubmit={submitWorkingHour}
              className="space-y-4 rounded-lg border border-border p-4"
            >
              <div className="space-y-2">
                <Label htmlFor="working-weekday">Dia da semana</Label>
                <select
                  id="working-weekday"
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...workingHourForm.register("weekday", {
                    valueAsNumber: true,
                  })}
                >
                  {weekdays.map((weekday, index) => (
                    <option key={weekday} value={index}>
                      {weekday}
                    </option>
                  ))}
                </select>
                {workingHourForm.formState.errors.weekday && (
                  <p className="text-sm text-destructive">
                    {workingHourForm.formState.errors.weekday.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="working-start">Início</Label>
                  <Input
                    id="working-start"
                    type="time"
                    className="border-border"
                    {...workingHourForm.register("start_time")}
                  />
                  {workingHourForm.formState.errors.start_time && (
                    <p className="text-sm text-destructive">
                      {workingHourForm.formState.errors.start_time.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="working-end">Fim</Label>
                  <Input
                    id="working-end"
                    type="time"
                    className="border-border"
                    {...workingHourForm.register("end_time")}
                  />
                  {workingHourForm.formState.errors.end_time && (
                    <p className="text-sm text-destructive">
                      {workingHourForm.formState.errors.end_time.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isAddingHour || !selectedProfForSchedule}
                >
                  {isAddingHour ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Adicionar turno
                </Button>
              </div>
            </form>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Turnos cadastrados</h3>
              {loadingHours ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando horários...
                </div>
              ) : workingHours.length === 0 ? (
                <p className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                  Nenhum turno cadastrado.
                </p>
              ) : (
                <ul className="max-h-56 space-y-2 overflow-y-auto">
                  {workingHours.map((hour) => (
                    <li
                      key={hour.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-sm">
                        <span className="font-medium">
                          {weekdays[hour.weekday] ?? "Dia inválido"}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {hour.start_time.slice(0, 5)} às{" "}
                          {hour.end_time.slice(0, 5)}
                        </span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover turno de ${weekdays[hour.weekday]}`}
                        disabled={deletingHourId === hour.id}
                        onClick={() => removeWorkingHour(hour)}
                      >
                        {deletingHourId === hour.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
