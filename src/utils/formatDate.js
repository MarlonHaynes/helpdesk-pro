function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function formatDate(dateValue) {
  const d = toDate(dateValue);
  return d ? d.toLocaleDateString() : "N/A";
}

export function formatDateTime(dateValue) {
  const d = toDate(dateValue);
  return d ? d.toLocaleString() : "N/A";
}
