export type IncidentInput = {
  category: string;
  severity: string;
  description: string;
  immediateActions: string;
};

export function validateIncident(input: IncidentInput) {
  const errors: string[] = [];
  if (!input.category) errors.push("Category is required.");
  if (!input.severity) errors.push("Severity is required.");
  if (!input.description) errors.push("Description is required.");
  if (!input.immediateActions) errors.push("Immediate actions are required.");

  if (input.severity.toLowerCase() === "high" && input.description.length < 30) {
    errors.push("High severity incidents need detailed descriptions.");
  }

  return errors;
}

export function calculateDueDates(
  severity: string,
  baseDate = new Date(),
  highSeverityHours = 24,
  standardHours = 72
) {
  const hours = severity.toLowerCase() === "high" ? highSeverityHours : standardHours;
  const followUp = new Date(baseDate.getTime() + hours * 3600 * 1000);
  return { followUp: followUp.toISOString() };
}
