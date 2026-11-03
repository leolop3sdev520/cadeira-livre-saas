"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Customer = {
  customer_name: string;
  customer_email: string;
  total_appointments: number;
  total_spent_cents: number;
  average_ticket_cents: number;
  last_visit_date: string;
};

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      try {
        const data = await api.get<Customer[]>("/api/v1/customers");
        if (active) setCustomers(data);
      } catch {
        if (active) toast.error("Não foi possível carregar os clientes.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCustomers();
    return () => {
      active = false;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedSearch) return customers;
    return customers.filter(
      (customer) =>
        customer.customer_name
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        customer.customer_email
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch),
    );
  }, [customers, search]);

  const formatPrice = (cents: number) =>
    `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Consulte o histórico de visitas e os valores dos seus clientes.
          </p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar clientes por nome ou e-mail"
            className="border-border pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Visitas</TableHead>
              <TableHead>Ticket Médio</TableHead>
              <TableHead>Total Gasto</TableHead>
              <TableHead>Última Visita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }, (_, index) => (
                <TableRow key={`customer-skeleton-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : filteredCustomers.length ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.customer_email.toLowerCase()}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">
                        {customer.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {customer.customer_name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {customer.customer_email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.total_appointments}</TableCell>
                  <TableCell>
                    {formatPrice(customer.average_ticket_cents)}
                  </TableCell>
                  <TableCell>
                    {formatPrice(customer.total_spent_cents)}
                  </TableCell>
                  <TableCell>
                    {format(
                      parseISO(customer.last_visit_date),
                      "dd/MM/yyyy",
                      { locale: ptBR },
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p>
                      {customers.length
                        ? "Nenhum cliente encontrado para essa busca."
                        : "Ainda não há clientes. Eles aparecerão aqui após o primeiro agendamento."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
