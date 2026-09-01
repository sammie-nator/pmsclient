const TONES = {
  signal: "bg-signal/10 text-signal border-signal/30",
  amber: "bg-amber/10 text-amber border-amber/30",
  rose: "bg-rose/10 text-rose border-rose/30",
  neutral: "bg-surface-raised text-ink-muted border-border",
};

// Central place mapping domain statuses to a visual tone, so "occupied",
// "paid", "resolved" etc. always read the same way across the app.
const STATUS_TONE = {
  vacant: "neutral",
  occupied: "signal",
  maintenance: "amber",
  deactivated: "rose",
  active: "signal",
  former: "neutral",
  pending: "amber",
  paid: "signal",
  partial: "amber",
  overdue: "rose",
  open: "rose",
  "in-progress": "amber",
  resolved: "signal",
  low: "neutral",
  medium: "amber",
  high: "rose",
  urgent: "rose",
};

export default function Badge({ tone, status, children, className = "" }) {
  const resolvedTone = tone || STATUS_TONE[status] || "neutral";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${TONES[resolvedTone]} ${className}`}
    >
      {children ?? status}
    </span>
  );
}
