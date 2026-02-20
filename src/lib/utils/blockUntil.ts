/**
 * Returns the next 6:00 AM in the server's local timezone.
 * Used to block technician login until next day 6am after disconnect.
 */
export function getNext6AM(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(6, 0, 0, 0);
  return next;
}

export const STALE_SESSION_MINUTES = 15;
