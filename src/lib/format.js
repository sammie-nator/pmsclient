export function formatKES(amount) {
  const n = Number(amount) || 0;
  return `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(value) {
  if (!value) return "";
  const d = new Date(value);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export const CATEGORY_LABELS = {
  "single-room": "Single Room",
  bedsitter: "Bedsitter",
  "executive-bedsitter": "Executive Bedsitter",
  "one-bedroom": "One Bedroom",
  "two-bedroom": "Two Bedroom",
  "three-bedroom": "Three Bedroom",
  "four-bedroom": "Four Bedroom",
  apartment: "Apartment",
  other: "Other",
};
