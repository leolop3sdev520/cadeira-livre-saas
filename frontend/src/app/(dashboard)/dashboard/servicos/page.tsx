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
  Scissors,
  Loader2,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

type Service = {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  is_active: boolean;
};

const serviceSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras."),
  duration_min: z.number().min(5, "A duração mínima é de 5 minutos."),
  price: z.number().min(0, "O preço não pode ser negativo."),
});

type ServiceForm = z.infer<typeof serviceSchema>;

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para o Alert Dialog de confirmação
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [serviceToToggle, setServiceToToggle] = useState<Service | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
  });

  async function loadServices() {
    try {
      const data = await api.get<Service[]>("/api/v1/services");
      setServices(data);
    } catch {
      toast.error("Erro ao carregar os serviços.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadServices();
  }, []);

  const onSubmit = async (data: ServiceForm) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        duration_min: data.duration_min,
        price_cents: Math.round(data.price * 100),
      };

      if (editingService) {
        await api.patch(`/api/v1/services/${editingService.id}`, payload);
        toast.success("Serviço atualizado com sucesso!");
      } else {
        await api.post("/api/v1/services", payload);
        toast.success("Serviço criado com sucesso!");
      }

      setIsModalOpen(false);
      reset();
      loadServices();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      toast.error(errorObj?.message || "Erro ao salvar serviço.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abre o modal de confirmação
  const openToggleConfirm = (service: Service) => {
    setServiceToToggle(service);
    setIsConfirmOpen(true);
  };

  // Executa a ação após confirmar
  const confirmToggleStatus = async () => {
    if (!serviceToToggle) return;

    try {
      await api.patch(
        `/api/v1/services/${serviceToToggle.id}/toggle-status`,
        {},
      );
      toast.success(
        `Serviço ${serviceToToggle.is_active ? "desativado" : "reativado"}!`,
      );
      loadServices();
    } catch {
      toast.error(
        `Erro ao ${serviceToToggle.is_active ? "desativar" : "reativar"} serviço.`,
      );
    } finally {
      setIsConfirmOpen(false);
      setServiceToToggle(null);
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      duration_min: service.duration_min,
      price: service.price_cents / 100,
    });
    setIsModalOpen(true);
  };

  const formatPrice = (cents: number) =>
    `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
            <p className="text-muted-foreground">
              Gerencie os serviços da sua barbearia.
            </p>
          </div>

          <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) {
                setEditingService(null);
                reset();
              }
            }}
          >
            <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              <Plus className="mr-2 h-4 w-4" /> Novo Serviço
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Serviço</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Corte Degradê"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration_min">Duração (min)</Label>
                    <Input
                      id="duration_min"
                      type="number"
                      {...register("duration_min", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...register("price", { valueAsNumber: true })}
                    />
                  </div>
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
                <TableHead>Serviço</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={`service-skeleton-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-5 w-40" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-9 w-9 rounded-md" />
                          <Skeleton className="h-9 w-9 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : services.map((service) => (
                <TableRow
                  key={service.id}
                  className={!service.is_active ? "opacity-60 bg-muted/20" : ""}
                >
                  <TableCell className="font-medium flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <Scissors className="h-4 w-4 text-primary" />
                    </div>
                    {service.name}
                  </TableCell>
                  <TableCell>{service.duration_min} min</TableCell>
                  <TableCell>{formatPrice(service.price_cents)}</TableCell>
                  <TableCell>
                    <StatusBadge isActive={service.is_active} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => openEditModal(service)}
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
                        onClick={() => openToggleConfirm(service)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-destructive"
                      >
                        {service.is_active ? (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        ) : (
                          <RotateCcw className="h-4 w-4 text-success" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{service.is_active ? "Desativar" : "Reativar"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Confirmação (Alert Dialog) */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá {serviceToToggle?.is_active ? "desativar" : "reativar"} o
              serviço <strong>{serviceToToggle?.name}</strong>.
              {serviceToToggle?.is_active
                ? " Ele não aparecerá mais na vitrine para os clientes."
                : " Ele voltará a aparecer na vitrine para os clientes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>
              Sim, {serviceToToggle?.is_active ? "desativar" : "reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
