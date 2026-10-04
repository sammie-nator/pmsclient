const VARIANTS = {
  primary: "bg-signal text-base font-semibold hover:bg-signal-deep shadow-glow border border-signal/40",
  outline: "bg-surface-raised text-ink border border-border hover:border-signal/50 hover:text-signal",
  ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-raised border border-transparent",
  danger: "bg-rose/10 text-rose border border-rose/30 hover:bg-rose/20",
  amber: "bg-amber/10 text-amber border border-amber/30 hover:bg-amber/20",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-sm px-5 py-2.5 gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
