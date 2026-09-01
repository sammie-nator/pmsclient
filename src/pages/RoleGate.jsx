import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, MapPinned, ClipboardList, Building2, ChevronRight, KeyRound } from "lucide-react";
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
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!role) return;
    setLoadingStaff(true);
    setSelectedStaff(null);
    setName("");
    setPin("");
    setError("");
    api
      .get("/staff", { params: { role: role.key } })
      .then((res) => setStaff(res.data))
      .catch(() => setStaff([]))
      .finally(() => setLoadingStaff(false));
  }, [role]);

  async function submitPin(e) {
    e?.preventDefault();
    setError("");
    const finalName = (selectedStaff?.name || name).trim();
    if (!role || !finalName) {
      setError("Select or enter your name.");
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setError("Enter your 4–6 digit PIN.");
      return;
    }

    setVerifying(true);
    try {
      const body = selectedStaff?._id
        ? { staffId: selectedStaff._id, pin }
        : { name: finalName, role: role.key, pin };
      const res = await api.post("/staff/verify", body);
      const s = res.data.staff;
      setActor({ role: s.role, name: s.name, staffId: s._id });
      navigate(role.home);
    } catch (err) {
      setError(err.response?.data?.error || "Could not verify PIN.");
    } finally {
      setVerifying(false);
    }
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
            <p className="pt-4 text-center text-[11px] text-ink-faint">
              Tenant paying rent?{" "}
              <a href="/pay" className="text-signal hover:underline">
                Pay with M-Pesa
              </a>
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-surface p-5 shadow-panel"
          >
            <button
              onClick={() => {
                setRole(null);
                setSelectedStaff(null);
                setPin("");
                setError("");
              }}
              className="mb-4 text-xs text-ink-faint hover:text-ink"
            >
              ← Change role
            </button>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-signal">{role.label}</p>
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Who are you?</h2>

            {loadingStaff ? (
              <p className="text-sm text-ink-faint">Loading team…</p>
            ) : (
              <>
                {staff.length > 0 && (
                  <div className="mb-4 space-y-1.5 max-h-40 overflow-y-auto">
                    {staff.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => {
                          setSelectedStaff(s);
                          setName(s.name);
                          setError("");
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          selectedStaff?._id === s._id
                            ? "border-signal bg-signal/10 text-ink"
                            : "border-border bg-surface-raised text-ink-muted hover:border-signal/40"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}

                {!selectedStaff && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (name.trim()) setSelectedStaff({ name: name.trim() });
                    }}
                    className="mb-4 flex gap-2"
                  >
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Or type your name"
                      className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-signal/60 focus:ring-1 focus:ring-signal/30"
                    />
                    <Button type="submit" variant="outline" disabled={!name.trim()}>
                      Next
                    </Button>
                  </form>
                )}

                {(selectedStaff || name.trim()) && (
                  <form onSubmit={submitPin} className="space-y-3">
                    <p className="text-xs text-ink-muted">
                      Enter your PIN for <span className="font-medium text-ink">{selectedStaff?.name || name}</span>
                    </p>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                      <input
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="••••"
                        className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-3 text-center font-mono text-lg tracking-[0.4em] text-ink outline-none focus:border-signal/60 focus:ring-1 focus:ring-signal/30"
                      />
                    </div>
                    {error && <p className="text-xs text-rose">{error}</p>}
                    <Button type="submit" className="w-full" disabled={verifying || pin.length < 4}>
                      {verifying ? "Checking…" : "Enter"}
                    </Button>
                  </form>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
