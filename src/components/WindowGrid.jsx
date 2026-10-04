// The app's signature visual motif: a little building facade of nine
// "windows" that light up teal when a unit is occupied, sit dim when
// vacant, and flicker amber when there's a maintenance issue open. It's a
// stylized status read at a glance, not a literal room count.
const PATTERNS = {
  occupied: [1, 1, 0, 1, 1, 1, 0, 1, 1],
  vacant: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  maintenance: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  deactivated: [0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export default function WindowGrid({ status = "vacant", size = 7 }) {
  const pattern = PATTERNS[status] || PATTERNS.vacant;
  const colorFor = (lit) => {
    if (!lit) return "bg-white/10";
    if (status === "maintenance") return "bg-amber shadow-[0_0_6px_rgba(255,176,32,0.7)]";
    return "bg-signal shadow-[0_0_6px_rgba(34,230,197,0.7)]";
  };

  return (
    <div
      className="grid grid-cols-3 gap-[3px]"
      style={{ width: size * 3 + 6 }}
      aria-hidden="true"
    >
      {pattern.map((lit, i) => (
        <span
          key={i}
          className={`window-dot rounded-[2px] ${colorFor(lit)} ${lit && status === "maintenance" ? "animate-pulse-signal" : ""}`}
          style={{ width: size, height: size, animationDelay: `${(i % 3) * 0.3}s` }}
        />
      ))}
    </div>
  );
}
