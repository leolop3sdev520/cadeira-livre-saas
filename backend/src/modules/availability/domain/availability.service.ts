type WorkingHours = { start_time: string; end_time: string };
type Appointment = { start_time: string; end_time: string };

export class AvailabilityService {
  generateSlots(
    dateStr: string,
    durationMin: number,
    workingHours: WorkingHours[],
    appointments: Appointment[],
  ) {
    const slots = new Map<string, { startTime: string; endTime: string }>();

    for (const workingHour of workingHours) {
      const [startHour, startMin] = workingHour.start_time
        .split(":")
        .map(Number);
      const [endHour, endMin] = workingHour.end_time.split(":").map(Number);

      let current = new Date(
        `${dateStr}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00-03:00`,
      );
      const end = new Date(
        `${dateStr}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00-03:00`,
      );

      const now = new Date();

      while (current < end) {
        const slotEnd = new Date(current.getTime() + durationMin * 60000);

        if (slotEnd > end) break;

        const hasConflict = appointments.some((app) => {
          const appStart = new Date(app.start_time);
          const appEnd = new Date(app.end_time);
          return current < appEnd && slotEnd > appStart;
        });

        if (!hasConflict && current > now) {
          const startTime = current.toISOString();
          slots.set(startTime, {
            startTime,
            endTime: slotEnd.toISOString(),
          });
        }

        current = new Date(current.getTime() + durationMin * 60000);
      }
    }

    return [...slots.values()].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  }
}
