"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { format, startOfToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Appointment = {
  id: string;
  professional_id: string;
  professional_name: string;
  service_name: string;
  customer_name: string;
  start_time: string;
  end_time: string;
  status: string;
};

type Professional = { id: string; name: string };

// Configurações da Grade
const START_HOUR = 8; // 08:00
const END_HOUR = 19; // 19:00
const PIXELS_PER_MINUTE = 1.5; // 1h = 90px

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState(startOfToday()); // Simplificado para "Hoje"

  useEffect(() => {
    async function loadData() {
      try {
        const [apptsData, profsData] = await Promise.all([
          api.get<Appointment[]>("/api/v1/appointments"),
          api.get<Professional[]>("/api/v1/professionals"),
        ]);
        setAppointments(apptsData);
        setProfessionals(profsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Gera os horários da coluna esquerda (08:00, 09:00...)
  const hours = useMemo(() => {
    const h = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) {
      h.push(`${String(i).padStart(2, "0")}:00`);
    }
    return h;
  }, []);

  // Filtra apenas os agendamentos do dia selecionado
  const todayAppointments = appointments.filter((app) => {
    const appDate = format(parseISO(app.start_time), "yyyy-MM-dd");
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return appDate === selectedDateStr && app.status === "confirmed";
  });

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 animate-in fade-in">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">
            Buscando agenda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground capitalize">
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2 text-sm font-medium">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          Hoje
        </div>
      </div>

      {/* Grid da Agenda */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col relative">
        {/* Cabeçalho das Colunas (Profissionais) */}
        <div className="flex border-b border-border bg-muted/30 shrink-0">
          <div className="w-16 shrink-0 border-r border-border" />{" "}
          {/* Espaço da hora */}
          {professionals.map((prof) => (
            <div
              key={prof.id}
              className="flex-1 py-3 text-center border-r border-border last:border-0 font-semibold text-sm"
            >
              {prof.name}
            </div>
          ))}
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto relative flex">
          {/* Coluna de Horários */}
          <div className="w-16 shrink-0 border-r border-border bg-muted/10 relative">
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-xs text-muted-foreground -mt-2"
                style={{ top: i * 60 * PIXELS_PER_MINUTE }}
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Colunas dos Profissionais */}
          <div className="flex-1 flex relative">
            {/* Linhas horizontais de fundo */}
            <div className="absolute inset-0 pointer-events-none">
              {hours.map((_, i) => (
                <div
                  key={i}
                  className="w-full border-t border-border/50"
                  style={{
                    height: 60 * PIXELS_PER_MINUTE,
                    top: i * 60 * PIXELS_PER_MINUTE,
                  }}
                />
              ))}
            </div>

            {/* Renderizando os agendamentos */}
            {professionals.map((prof) => {
              const profAppointments = todayAppointments.filter(
                (a) => a.professional_id === prof.id,
              );

              return (
                <div
                  key={prof.id}
                  className="flex-1 border-r border-border last:border-0 relative"
                >
                  {profAppointments.map((app) => {
                    const startDate = parseISO(app.start_time);
                    const endDate = parseISO(app.end_time);

                    // Cálculo da posição (Baseado em minutos desde as 08:00)
                    const startHour = startDate.getHours();
                    const startMin = startDate.getMinutes();
                    const totalMinutesFromStart =
                      (startHour - START_HOUR) * 60 + startMin;

                    const durationMin =
                      (endDate.getTime() - startDate.getTime()) / (1000 * 60);

                    // Estilos dinâmicos
                    const top = totalMinutesFromStart * PIXELS_PER_MINUTE;
                    const height = durationMin * PIXELS_PER_MINUTE;

                    return (
                      <div
                        key={app.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-md p-2 text-xs border shadow-sm transition-all hover:z-10 hover:shadow-md cursor-pointer",
                          // Cores baseadas no status (usando as variáveis do nosso CSS)
                          app.status === "confirmed"
                            ? "bg-success-bg text-success-fg border-success/30"
                            : app.status === "pending"
                              ? "bg-warning-bg text-warning-fg border-warning/30"
                              : "bg-muted text-muted-foreground border-border",
                        )}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="font-bold truncate">
                          {format(startDate, "HH:mm")} -{" "}
                          {format(endDate, "HH:mm")}
                        </div>
                        <div className="font-semibold truncate mt-0.5">
                          {app.customer_name}
                        </div>
                        <div className="truncate opacity-80">
                          {app.service_name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
