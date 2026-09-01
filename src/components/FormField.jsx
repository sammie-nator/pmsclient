export function Field({ label, hint, required, children, className = "" }) {
  return (
    <div className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-muted">
          {label}
          {required && <span className="text-rose">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-faint">{hint}</span>}
    </div>
  );
}

const baseInput =
  "w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-signal/60 focus:ring-1 focus:ring-signal/30";

export function Input(props) {
  return <input {...props} className={`${baseInput} ${props.className || ""}`} />;
}

export function Textarea(props) {
  return <textarea {...props} className={`${baseInput} resize-none ${props.className || ""}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${baseInput} ${props.className || ""}`}>
      {children}
    </select>
  );
}
