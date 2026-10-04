export default function Panel({ title, subtitle, action, className = "", children, bodyClassName = "" }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface shadow-panel ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            {title && <h2 className="font-display text-base font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
