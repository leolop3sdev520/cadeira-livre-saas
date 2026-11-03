"use client";

import {
  Calendar,
  dateFnsLocalizer,
  type EventProps,
  type View,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./schedule-calendar.css";

const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Tipagem do agendamento que vem do backend
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

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
};

function AppointmentEvent({ title }: EventProps<CalendarEvent>) {
  return <div className="truncate">{title}</div>;
}

// Tipagem das props do componente
interface ScheduleCalendarProps {
  events: Appointment[];
  view: "day" | "week" | "month";
  date: Date;
  onView: (view: View) => void;
  onNavigate: (date: Date) => void;
  onSelectEvent: (event: { resource: Appointment }) => void; // <-- AQUI ESTAVA FALTANDO
}

export function ScheduleCalendar({
  events,
  view,
  date,
  onView,
  onNavigate,
  onSelectEvent,
}: ScheduleCalendarProps) {
  // Mapeia os dados do backend para o formato que o react-big-calendar entende
  const calendarEvents = events.map((app) => ({
    title: `${app.customer_name} - ${app.service_name}`,
    start: parseISO(app.start_time),
    end: parseISO(app.end_time),
    resource: app, // Passamos o objeto inteiro para o onSelectEvent
  }));
  const businessHoursStart = new Date(2026, 0, 1, 8, 0, 0);
  const businessHoursEnd = new Date(2026, 0, 1, 20, 0, 0);

  return (
    <Calendar
      localizer={localizer}
      events={calendarEvents}
      views={["month", "week", "day"]}
      min={businessHoursStart}
      max={businessHoursEnd}
      scrollToTime={businessHoursStart}
      components={{ event: AppointmentEvent }}
      view={view}
      date={date}
      onView={onView}
      onNavigate={onNavigate}
      onSelectEvent={onSelectEvent}
      culture="pt-BR"
      messages={{
        next: "Próximo",
        previous: "Anterior",
        today: "Hoje",
        month: "Mês",
        week: "Semana",
        day: "Dia",
        date: "Data",
        time: "Hora",
        event: "Evento",
        noEventsInRange: "Nenhum agendamento neste período.",
      }}
      style={{ height: "100%" }}
    />
  );
}
