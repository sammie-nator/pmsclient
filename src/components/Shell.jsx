import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Building2 } from "lucide-react";
import { useActor } from "../context/ActorContext";

const ROLE_META = {
  admin: { label: "Admin", tone: "text-signal" },
  agent: { label: "Agent", tone: "text-amber" },
  frontdesk: { label: "Front Desk", tone: "text-ink" },
};

export default function Shell({ navItems, children }) {
  const { actor, signOut } = useActor();
  const navigate = useNavigate();
  const meta = ROLE_META[actor?.role] || ROLE_META.admin;

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-base bg-grid text-ink flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface/60 backdrop-blur">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-signal/30 bg-signal/10 text-signal">
            <Building2 size={17} strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-display text-sm font-bold leading-none text-ink">Nyumbani OS</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-ink-faint">Property Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-signal/10 text-signal border border-signal/25"
                    : "text-ink-muted hover:bg-surface-raised hover:text-ink border border-transparent"
                }`
              }
            >
              <item.icon size={16} strokeWidth={2.25} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-base text-xs font-semibold text-ink">
              {actor?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{actor?.name}</p>
              <p className={`text-[10px] font-medium uppercase tracking-wide ${meta.tone}`}>{meta.label}</p>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Switch user"
              className="rounded-lg p-1.5 text-ink-faint hover:bg-base hover:text-rose transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between border-b border-border bg-surface/90 backdrop-blur px-3 sm:px-4 py-3 safe-top">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-signal">
            <Building2 size={14} />
          </div>
          <span className="font-display text-sm font-bold truncate">Nyumbani OS</span>
        </div>
        <button onClick={handleSignOut} className="shrink-0 rounded-lg p-1.5 text-ink-faint" aria-label="Sign out">
          <LogOut size={16} />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <main className="flex-1 w-full min-w-0 px-3 py-5 sm:px-4 sm:py-6 md:px-8 md:py-8 mt-14 md:mt-0 pb-28 md:pb-8">{children}</main>
        {/* Mobile bottom nav — scrollable when many items */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom">
          <div className="flex items-stretch gap-0.5 overflow-x-auto px-1 py-1.5 scrollbar-none">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium shrink-0 min-w-[3.25rem] ${
                    isActive ? "text-signal" : "text-ink-faint"
                  }`
                }
              >
                <item.icon size={17} />
                <span className="max-w-[4.5rem] truncate text-center leading-tight">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
