type WorkingHours = { start_time: string; end_time: string };
type Appointment = { start_time: string; end_time: string };

export class AvailabilityService {
  generateSlots(
    dateStr: string,
    durationMin: number,
    workingHours: WorkingHours,
    appointments: Appointment[],
  ) {
    const slots: { startTime: string; endTime: string }[] = [];

    // Constrói as datas de início e fim do expediente naquele dia (ex: 2026-11-02 09:00:00)
    const [startHour, startMin] = workingHours.start_time
      .split(":")
      .map(Number);
    const [endHour, endMin] = workingHours.end_time.split(":").map(Number);

    let current = new Date(
      `${dateStr}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00-03:00`,
    );
    const end = new Date(
      `${dateStr}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00-03:00`,
    );

    const now = new Date(); // Para não retornar horários no passado se for hoje

    while (current < end) {
      const slotEnd = new Date(current.getTime() + durationMin * 60000);

      // Se o slot passar do horário de fim do expediente, encerra o loop
      if (slotEnd > end) break;

      // Verifica se este slot colide com algum agendamento existente
      const hasConflict = appointments.some((app) => {
        const appStart = new Date(app.start_time);
        const appEnd = new Date(app.end_time);
        // Lógica de sobreposição (Overlap): (InicioA < FimB) e (FimA > InicioB)
        return current < appEnd && slotEnd > appStart;
      });

      // Se não tem conflito e não é um horário no passado, adiciona à lista
      if (!hasConflict && current > now) {
        slots.push({
          startTime: current.toISOString(),
          endTime: slotEnd.toISOString(),
        });
      }

      // Avança o relógio
      current = new Date(current.getTime() + durationMin * 60000);
    }

    return slots;
  }
}
