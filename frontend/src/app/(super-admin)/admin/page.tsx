"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Building2, CalendarDays, DollarSign, Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Barbershop = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  total_professionals: number;
  total_appointments: number;
  total_revenue: number;
};

type SuperAdminMetrics = {
  total_barbershops: number;
  total_appointments: number;
  total_revenue_cents: number;
};

const barbershopSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia."),
  slug: z
    .string()
    .trim()
    .min(3, "O slug deve ter pelo menos 3 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use letras minúsculas, números e hífens.",
    ),
  admin_email: z.string().trim().email("Informe um e-mail válido."),
  admin_password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres."),
});

type BarbershopFormValues = z.infer<typeof barbershopSchema>;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatPrice(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export default function SuperAdminBarbershopsPage() {
  const router = useRouter();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BarbershopFormValues>({
    resolver: zodResolver(barbershopSchema),
    defaultValues: {
      name: "",
      slug: "",
      admin_email: "",
      admin_password: "",
    },
  });

  const loadData = useCallback(
    async (showError = true) => {
      setLoading(true);
      try {
        const [barbershopsData, metricsData] = await Promise.all([
          api.get<Barbershop[]>("/api/v1/super-admin/barbershops"),
          api.get<SuperAdminMetrics>("/api/v1/super-admin/metrics"),
        ]);
        setBarbershops(barbershopsData);
        setMetrics(metricsData);
      } catch (error: unknown) {
        const errorObj = error as { status?: number; message?: string };
        if (errorObj.status === 403) {
          toast.error("Acesso restrito ao Super Admin.");
          router.replace("/dashboard");
        } else if (showError) {
          toast.error(
            errorObj.message || "Não foi possível carregar os dados globais.",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const createBarbershop = async (values: BarbershopFormValues) => {
    setIsCreating(true);
    try {
      await api.post("/api/v1/super-admin/barbershops", values);
      toast.success("Barbearia criada com sucesso.");
      setIsCreateDialogOpen(false);
      reset();
      await loadData(false);
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      toast.error(errorObj.message || "Não foi possível criar a barbearia.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!isCreating) {
      setIsCreateDialogOpen(open);
      if (!open) reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Barbearias</h1>
          <p className="text-muted-foreground">
            Métricas globais e onboarding de novos tenants.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Barbearia
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Barbearias
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics?.total_barbershops ?? "—"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agendamentos Globais
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics?.total_appointments ?? "—"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Global
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics
                  ? formatPrice(metrics.total_revenue_cents)
                  : "—"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barbearia</TableHead>
              <TableHead>Profissionais</TableHead>
              <TableHead>Agendamentos</TableHead>
              <TableHead>Faturamento Total</TableHead>
              <TableHead>Data de Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }, (_, index) => (
                <TableRow key={`barbershop-skeleton-${index}`}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : barbershops.length ? (
              barbershops.map((barbershop) => (
                <TableRow key={barbershop.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {barbershop.name}
                        </p>
                        <Link
                          href={`/${encodeURIComponent(barbershop.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          /{barbershop.slug}
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{barbershop.total_professionals}</TableCell>
                  <TableCell>{barbershop.total_appointments}</TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(barbershop.total_revenue)}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(barbershop.created_at), "dd/MM/yyyy")}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nenhuma barbearia cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Barbearia</DialogTitle>
            <DialogDescription>
              Cadastre a barbearia e as credenciais iniciais do administrador.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(createBarbershop)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="barbershop-name">Nome da Barbearia</Label>
              <Input
                id="barbershop-name"
                autoComplete="organization"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="barbershop-slug">Slug</Label>
              <Input
                id="barbershop-slug"
                placeholder="barbearia-do-leo"
                autoComplete="off"
                {...register("slug")}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="barbershop-admin-email">E-mail do Admin</Label>
              <Input
                id="barbershop-admin-email"
                type="email"
                autoComplete="email"
                {...register("admin_email")}
              />
              {errors.admin_email && (
                <p className="text-sm text-destructive">
                  {errors.admin_email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="barbershop-admin-password">Senha do Admin</Label>
              <Input
                id="barbershop-admin-password"
                type="password"
                autoComplete="new-password"
                {...register("admin_password")}
              />
              {errors.admin_password && (
                <p className="text-sm text-destructive">
                  {errors.admin_password.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Criando..." : "Criar Barbearia"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
