import { differenceInCalendarDays, format, isSameDay, setYear } from "date-fns";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy · h:mm a");
}

export function daysSince(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  return differenceInCalendarDays(new Date(), new Date(date));
}

/** Next occurrence of a birthday (this year or next). */
export function nextBirthday(birthday: Date, from: Date = new Date()): Date {
  let next = setYear(new Date(birthday), from.getFullYear());
  if (next < from && !isSameDay(next, from)) {
    next = setYear(next, from.getFullYear() + 1);
  }
  return next;
}

export function isBirthdayToday(birthday: Date | null, today: Date = new Date()): boolean {
  if (!birthday) return false;
  const b = new Date(birthday);
  return b.getMonth() === today.getMonth() && b.getDate() === today.getDate();
}
