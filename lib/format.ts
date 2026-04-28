import { format, parseISO } from "date-fns";

export function formatDate(date: string): string {
  return format(parseISO(date), "EEE, MMM d, yyyy");
}

export function formatDateShort(date: string): string {
  return format(parseISO(date), "MMM d");
}

export function formatTime(time: string): string {
  // time comes as "HH:MM:SS" or "HH:MM"
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, "h:mm a");
}

export function formatRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}
