export function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute, total: hour * 60 + minute };
}

export function addMinutes(hour: number, minute: number, durationMinutes: number) {
  const total = (hour * 60 + minute + durationMinutes) % (24 * 60);
  return formatTime(Math.floor(total / 60), total % 60);
}

export function durationWithinDay(start: string, end: string) {
  const parsedStart = parseTime(start);
  const parsedEnd = parseTime(end);
  if (!parsedStart || !parsedEnd) return null;
  const duration = (parsedEnd.total - parsedStart.total + 24 * 60) % (24 * 60);
  return duration === 0 ? null : duration;
}
