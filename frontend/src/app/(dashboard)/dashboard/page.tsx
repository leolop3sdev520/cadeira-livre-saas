"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, DollarSign, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

type DashboardMetrics = {
  appointments_today: number;
  revenue_today: number;
  clients_count: number;
  no_show_rate: number;
};

type DashboardChartPoint = {
  date: string;
  appointments: number;
  revenue: number;
};

const chartConfig = {
  appointments: {
    label: "Agendamentos",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export default function DashboardHome() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<DashboardChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMetrics = async () => {
      try {
        const data = await api.get<DashboardMetrics>(
          "/api/v1/dashboard/metrics",
        );
        if (active) setMetrics(data);
      } catch {
        if (active) {
          toast.error("Não foi possível carregar as métricas do dashboard.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadChartData = async () => {
      try {
        const data = await api.get<DashboardChartPoint[]>(
          "/api/v1/dashboard/chart-data",
        );
        if (active) setChartData(data);
      } catch {
        if (active) {
          toast.error("Não foi possível carregar o gráfico de agendamentos.");
        }
      } finally {
        if (active) setChartLoading(false);
      }
    };

    void loadMetrics();
    void loadChartData();
    return () => {
      active = false;
    };
  }, []);

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const percentageFormatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">
          Acompanhe os números da sua barbearia hoje.
        </p>
      </div>

      {/* Grid de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Card key={`kpi-skeleton-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-36" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agendamentos Hoje
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.appointments_today ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento (Hoje)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics
                ? currencyFormatter.format(metrics.revenue_today / 100)
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              Hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Faltas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {metrics
                ? `${percentageFormatter.format(metrics.no_show_rate)}%`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.clients_count ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">Total acumulado</p>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      <Card className="col-span-4">
        <CardHeader>
          {chartLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            <CardTitle>Agendamentos nos últimos 7 dias</CardTitle>
          )}
        </CardHeader>
        <CardContent className="h-75 flex items-center justify-center border-t border-border mt-4 bg-muted/20">
          {chartLoading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : chartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="h-full w-full aspect-auto"
            >
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 8, right: 12, top: 12 }}
              >
                <defs>
                  <linearGradient
                    id="appointmentsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-appointments)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-appointments)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} horizontal={false} />
                <XAxis
                  dataKey="date"
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => label}
                      formatter={(value, _name, item) => {
                        const point = item.payload as DashboardChartPoint;
                        return (
                          <div className="grid gap-1">
                            <span>{value} agendamentos</span>
                            <span>
                              {currencyFormatter.format(point.revenue)}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Area
                  dataKey="appointments"
                  type="monotone"
                  stroke="var(--color-appointments)"
                  strokeWidth={2}
                  fill="url(#appointmentsGradient)"
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-sm">
              Não há dados de agendamentos para exibir.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
