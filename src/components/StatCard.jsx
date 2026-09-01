const ACCENTS = {
  signal: "text-signal bg-signal/10 border-signal/25",
  amber: "text-amber bg-amber/10 border-amber/25",
  rose: "text-rose bg-rose/10 border-rose/25",
  neutral: "text-ink bg-surface-raised border-border",
};

export default function StatCard({ label, value, sub, icon: Icon, accent = "neutral" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-panel">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${ACCENTS[accent]}`}>
            <Icon size={15} strokeWidth={2.25} />
          </div>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}
