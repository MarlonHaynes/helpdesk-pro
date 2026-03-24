export default function formatDate(dateValue) {
  if (!dateValue) return "N/A";

  try {
    if (dateValue?.toDate) {
      return dateValue.toDate().toLocaleString();
    }

    return new Date(dateValue).toLocaleString();
  } catch {
    return "N/A";
  }
}