import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, MapPinned, ClipboardList, Building2, ChevronRight } from "lucide-react";
import api from "../lib/api";
import { useActor } from "../context/ActorContext";
import Button from "../components/Button";

const ROLES = [
  {
    key: "admin",
    label: "Admin",
    desc: "Full access - properties, tenants, billing, maintenance, staff, reports.",
    icon: ShieldCheck,
    home: "/admin",
  },
  {
    key: "agent",
    label: "Agent",
    desc: "Houses by area, vacant units, and maintenance issues. No tenant history.",
    icon: MapPinned,
    home: "/agent",
  },
  {
    key: "frontdesk",
    label: "Front Desk",
    desc: "Create and update tenants and billing. No deletions, no new properties.",
    icon: ClipboardList,
    home: "/frontdesk",
  },
];

export default function RoleGate() {
  const navigate = useNavigate();
  const { setActor } = useActor();
  const [role, setRole] = useState(null);
  const [staff, setStaff] = useState([]);
  const [name, setName] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    if (!role) return;
    setLoadingStaff(true);
    api
      .get("/staff", { params: { role: role.key } })
      .then((res) => setStaff(res.data))
      .catch(() => setStaff([]))
      .finally(() => setLoadingStaff(false));
  }, [role]);

  function enter(chosenName) {
    const finalName = (chosenName || name).trim();
    if (!role || !finalName) return;
    setActor({ role: role.key, name: finalName });
    navigate(role.home);
  }

  return (
    <div className="min-h-screen bg-base bg-grid flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-signal/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-signal/30 bg-signal/10 text-signal shadow-glow">
            <Building2 size={22} strokeWidth={2.25} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Nyumbani OS</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Sign in to the panel that matches your role.</p>
        </div>

        {!role ? (
          <div className="space-y-3">
            {ROLES.map((r, i) => (
              <motion.button
                key={r.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                onClick={() => setRole(r)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-4 text-left shadow-panel transition-colors hover:border-signal/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-raised text-ink-muted group-hover:text-signal group-hover:border-signal/30 transition-colors">
                  <r.icon size={19} strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-semibold text-ink">{r.label}</p>
                  <p className="mt-0.5 text-xs text-ink-faint leading-snug">{r.desc}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-ink-faint group-hover:text-signal transition-colors" />
              </motion.button>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-surface p-5 shadow-panel"
          >
            <button onClick={() => setRole(null)} className="mb-4 text-xs text-ink-faint hover:text-ink">
              ← Choose a different role
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-signal/30 bg-signal/10 text-signal">
                <role.icon size={16} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-ink">{role.label}</p>
                <p className="text-xs text-ink-faint">Who's this?</p>
              </div>
            </div>

            {loadingStaff && <p className="text-xs text-ink-faint">Loading staff…</p>}

            {!loadingStaff && staff.length > 0 && (
              <div className="mb-4 space-y-1.5">
                {staff.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => enter(s.name)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-left text-sm text-ink hover:border-signal/40 transition-colors"
                  >
                    <span>{s.name}</span>
                    {s.assignedAreas?.length > 0 && (
                      <span className="text-[10px] text-ink-faint">{s.assignedAreas.join(", ")}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-ink-faint mb-2">
              <div className="h-px flex-1 bg-border" />
              or enter your name
              <div className="h-px flex-1 bg-border" />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enter();
              }}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-signal/60 focus:ring-1 focus:ring-signal/30"
              />
              <Button type="submit" disabled={!name.trim()}>
                Enter
              </Button>
            </form>
          </motion.div>
        )}

        <p className="mt-6 text-center text-[11px] text-ink-faint">
          No password needed yet - this identifies who's making changes for the activity log.
        </p>
      </div>
    </div>
  );
}
