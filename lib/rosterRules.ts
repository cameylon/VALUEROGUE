import type { Shift } from "@prisma/client";

export type StaffAvailability = {
  userId: string;
  skills: string[];
  assignedShifts: Shift[];
  maxHoursPerWeek: number;
  minRestHours: number;
};

export type ShiftSuggestion = {
  shiftId: string;
  userId: string;
  explanation: string;
  riskFlags: string[];
};

export function suggestAssignments(shifts: Shift[], staff: StaffAvailability[]): ShiftSuggestion[] {
  const suggestions: ShiftSuggestion[] = [];

  for (const shift of shifts) {
    for (const person of staff) {
      const overlaps = person.assignedShifts.some((assigned) =>
        new Date(assigned.start) < new Date(shift.end) && new Date(shift.start) < new Date(assigned.end)
      );
      if (overlaps) continue;

      const totalHours = person.assignedShifts.reduce((sum, assigned) => {
        const duration = (new Date(assigned.end).getTime() - new Date(assigned.start).getTime()) / 3600000;
        return sum + duration;
      }, 0);

      const shiftHours = (new Date(shift.end).getTime() - new Date(shift.start).getTime()) / 3600000;
      const wouldExceed = totalHours + shiftHours > person.maxHoursPerWeek;

      const lastShift = [...person.assignedShifts]
        .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
      const restHours = lastShift
        ? (new Date(shift.start).getTime() - new Date(lastShift.end).getTime()) / 3600000
        : Infinity;

      const riskFlags: string[] = [];
      if (wouldExceed) riskFlags.push("Exceeds max weekly hours");
      if (restHours < person.minRestHours) riskFlags.push("Fatigue risk (< minimum rest)");

      suggestions.push({
        shiftId: shift.id,
        userId: person.userId,
        explanation: "Matches availability, no overlap detected.",
        riskFlags
      });

      break;
    }
  }

  return suggestions;
}
