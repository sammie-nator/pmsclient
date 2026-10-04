export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-5 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-signal">{eyebrow}</p>
        )}
        <h1 className="font-display text-xl sm:text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">{action}</div>}
    </div>
  );
}
