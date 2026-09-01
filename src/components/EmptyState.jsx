export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-14 text-center">
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface-raised text-ink-faint">
          <Icon size={18} />
        </div>
      )}
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-xs text-ink-faint">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
