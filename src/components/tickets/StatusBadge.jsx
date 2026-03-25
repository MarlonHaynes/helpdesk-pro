export default function StatusBadge({ status }) {
  const normalizedStatus = status || "Open";

  return (
    <span className={`status-badge status-${normalizedStatus.toLowerCase().replace(/\s+/g, "-")}`}>
      {normalizedStatus}
    </span>
  );
}