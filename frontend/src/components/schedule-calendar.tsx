"use client";

import {
  Calendar,
  dateFnsLocalizer,
  type EventProps,
  type HeaderProps,
  type SlotInfo,
  type View,
} from "react-big-calendar";
import {
  format,
  isSameDay,
  parse,
  startOfWeek,
  getDay,
  parseISO,
} from "date-fns";
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

export type Appointment = {
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

function CustomEvent({ event }: EventProps<CalendarEvent>) {
  const durationMinutes =
    (event.end.getTime() - event.start.getTime()) / 60_000;
  const compact = durationMinutes <= 60;
  const eventDescription = `${format(event.start, "HH:mm")} · ${event.resource.customer_name} · ${event.resource.service_name} - ${event.resource.professional_name}`;

  return (
    <div
      className={`schedule-event flex h-auto min-w-0 gap-1 rounded-md px-2 py-1 font-sans text-sm leading-tight ${
        compact ? "min-h-6 flex-col items-start" : "min-h-10 flex-col"
      }`}
      title={eventDescription}
      aria-label={eventDescription}
    >
      {compact ? (
        <>
          <p className="schedule-event__customer line-clamp-1 block min-w-0 text-[11px] font-medium text-foreground">
            {event.resource.customer_name}
          </p>
          <p className="schedule-event__details line-clamp-1 block min-w-0 text-[11px] text-muted-foreground">
            {event.resource.service_name}
          </p>
        </>
      ) : (
        <>
          <span className="schedule-event__time block whitespace-nowrap text-xs font-medium text-foreground">
            {format(parseISO(event.resource.start_time), "HH:mm")}
          </span>
          <p className="schedule-event__customer block min-w-0 truncate text-sm font-medium text-foreground">
            {event.resource.customer_name}
          </p>
          <p className="schedule-event__details block min-w-0 truncate text-xs text-muted-foreground">
            {event.resource.service_name} - {event.resource.professional_name}
          </p>
        </>
      )}
    </div>
  );
}

function CalendarHeader({
  date,
  localizer,
  selectedDate,
}: HeaderProps & { selectedDate: Date }) {
  const isToday = isSameDay(date, new Date());
  const isSelected = isSameDay(date, selectedDate);
  const label = localizer.format(date, "dd EEEE", "pt-BR");

  return (
    <span
      className={`font-sans text-sm font-semibold ${
        isToday || isSelected
          ? "schedule-calendar__selected-day text-primary"
          : "text-foreground"
      }`}
    >
      {label}
    </span>
  );
}

interface ScheduleCalendarProps {
  events: Appointment[];
  view: "day" | "week";
  date: Date;
  onView: (view: View) => void;
  onNavigate: (date: Date) => void;
  onSelectEvent: (event: { resource: Appointment }) => void;
  onSelectSlot: (slot: SlotInfo) => void;
}

export function ScheduleCalendar({
  events,
  view,
  date,
  onView,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
}: ScheduleCalendarProps) {
  const calendarEvents = events.map((appointment) => ({
    title: "",
    start: parseISO(appointment.start_time),
    end: parseISO(appointment.end_time),
    resource: appointment,
  }));
  const businessHoursStart = new Date(2026, 0, 1, 8, 0, 0);
  const businessHoursEnd = new Date(2026, 0, 1, 20, 0, 0);

  return (
    <Calendar
      localizer={localizer}
      events={calendarEvents}
      views={["week", "day"]}
      min={businessHoursStart}
      max={businessHoursEnd}
      scrollToTime={businessHoursStart}
      components={{
        event: CustomEvent,
        header: (props) => <CalendarHeader {...props} selectedDate={date} />,
      }}
      dayLayoutAlgorithm="no-overlap"
      view={view}
      date={date}
      onView={onView}
      onNavigate={onNavigate}
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      selectable
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
