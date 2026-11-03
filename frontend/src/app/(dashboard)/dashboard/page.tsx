"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, DollarSign, Users, TrendingUp } from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { api } from "@/lib/api";
import { toast } from "sonner";

type DashboardMetrics = {
  appointments_today: number;
  revenue_today: number;
  clients_count: number;
  no_show_rate: number;
};

type DashboardChartPoint = {
  month: string;
  appointments: number;
  revenue: number;
};

const chartConfig = {
  primary: {
    label: "Faturamento",
    color: "var(--primary)",
  },
  revenue: {
    label: "Faturamento",
    color: "var(--color-primary)",
  },
  appointments: {
    label: "Agendamentos",
    color: "#10B981",
  },
} satisfies ChartConfig;

function DateRangePicker() {
  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2026, 5, 1),
    to: new Date(2026, 5, 25),
  });

  const rangeLabel =
    dateRange?.from && dateRange.to
      ? `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(
          dateRange.to,
          "dd/MM/yyyy",
          { locale: ptBR },
        )}`
      : "Selecione o período";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 border-border bg-card px-3 font-medium shadow-sm"
          >
            <CalendarDays className="size-4 text-primary" />
            <span>{rangeLabel}</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={(nextRange) => {
            setDateRange(nextRange);
            if (nextRange?.from && nextRange.to) setOpen(false);
          }}
          defaultMonth={dateRange?.from}
          numberOfMonths={1}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}

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
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe os números da sua barbearia.
          </p>
        </div>
        <DateRangePicker />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <Card
                key={`kpi-skeleton-${index}`}
                className="border-border/70 bg-card shadow-sm"
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="size-12 rounded-2xl" />
                </CardContent>
              </Card>
            ))
          : [
              {
                title: "Clientes",
                value: metrics?.clients_count.toLocaleString("pt-BR") ?? "—",
                badge: "Total",
                icon: Users,
              },
              {
                title: "Faturamento",
                value: metrics
                  ? currencyFormatter.format(metrics.revenue_today / 100)
                  : "—",
                badge: "Hoje",
                icon: DollarSign,
              },
              {
                title: "Taxa de faltas",
                value: metrics
                  ? `${percentageFormatter.format(metrics.no_show_rate)}%`
                  : "—",
                badge: "Acumulado",
                icon: TrendingUp,
              },
              {
                title: "Agendamentos",
                value:
                  metrics?.appointments_today.toLocaleString("pt-BR") ?? "—",
                badge: "Hoje",
                icon: CalendarDays,
              },
            ].map((metric) => (
              <Card
                key={metric.title}
                className="border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="flex min-h-36 items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <p className="text-2xl font-semibold tracking-tight">
                        {metric.value}
                      </p>
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/10 text-primary"
                      >
                        {metric.badge}
                      </Badge>
                    </div>
                  </div>
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <metric.icon className="size-6" />
                  </span>
                </CardContent>
              </Card>
            ))}
      </div>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              Faturamento e agendamentos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Desempenho dos últimos 12 meses
            </p>
          </div>
        </CardHeader>
        <CardContent className="h-90 pt-4 sm:px-5">
          {chartLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ComposedChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 12, right: 12, top: 24 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tickFormatter={(value: number) =>
                    currencyFormatter.format(value / 100)
                  }
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  width={72}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  width={42}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => label}
                      formatter={(value, name) => {
                        const numericValue = Number(value);
                        return (
                          <span className="font-medium">
                            {name === "revenue"
                              ? currencyFormatter.format(numericValue / 100)
                              : `${numericValue} agendamentos`}
                          </span>
                        );
                      }}
                    />
                  }
                />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="appointments"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#10B981" }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList
                    dataKey="appointments"
                    position="top"
                    fill="#10B981"
                    fontSize={12}
                  />
                </Line>
              </ComposedChart>
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
