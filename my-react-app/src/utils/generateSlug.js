function toSlugPart(str) {
  return str
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function generateSlug(homeName, awayName, date) {
  const dateStr =
    date instanceof Date
      ? date.toISOString().split("T")[0]
      : new Date(date).toISOString().split("T")[0];

  return `${toSlugPart(homeName)}-vs-${toSlugPart(awayName)}-${dateStr}`;
}
