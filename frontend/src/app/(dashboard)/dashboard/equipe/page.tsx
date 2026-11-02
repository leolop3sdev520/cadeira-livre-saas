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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, User, Mail, Phone } from "lucide-react"; //
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner"; // <-- Importando o toast

type Professional = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
};

const professionalSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras."),
  email: z.string().email("Insira um e-mail válido."),
  phone: z.string().min(10, "Insira um telefone válido com DDD."),
});

type ProfessionalForm = z.infer<typeof professionalSchema>;

export default function EquipePage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfessionalForm>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  async function loadProfessionals() {
    try {
      const data = await api.get<Professional[]>("/api/v1/professionals");
      setProfessionals(data);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };

      if (errorObj.status !== 401) {
        toast.error(
          errorObj.message || "Erro ao carregar a lista de profissionais.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfessionals();
  }, []);

  const onSubmit = async (data: ProfessionalForm) => {
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/professionals", {
        name: data.name,
        email: data.email,
        phone: data.phone,
      });

      // NOTIFICAÇÃO DE SUCESSO
      toast.success("Profissional adicionado com sucesso!");

      setIsModalOpen(false);
      reset();
      loadProfessionals();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      // NOTIFICAÇÃO DE ERRO
      toast.error(errorObj?.message || "Erro ao criar profissional.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie os profissionais da sua barbearia.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="mr-2 h-4 w-4" /> Novo Profissional
          </DialogTrigger>

          <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
              <DialogTitle>Novo Profissional</DialogTitle>
              <DialogDescription>
                Adicione um barbeiro ou especialista à sua equipe.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Profissional"
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-24">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Buscando equipe...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : professionals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-24">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <User className="h-10 w-10 mb-4 opacity-20" />
                    <p className="text-lg font-medium text-foreground">
                      Nenhum profissional cadastrado
                    </p>
                    <p className="text-sm mt-1 mb-4">
                      Adicione barbeiros à sua equipe para começarem a receber
                      agendamentos.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Adicionar o primeiro
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              professionals.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-brass-500 text-ink flex items-center justify-center font-bold">
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-bg text-success-fg">
                      Ativo
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
