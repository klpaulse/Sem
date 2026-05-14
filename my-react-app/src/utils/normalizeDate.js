export function normalizeDate(d) {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (d.toDate) return d.toDate();
  const parsed = new Date(d);
  return isNaN(parsed) ? null : parsed;
}
