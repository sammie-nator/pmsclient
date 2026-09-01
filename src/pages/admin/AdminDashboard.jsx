import { useEffect, useState } from "react";
import { Building2, Users, Wallet, Wrench, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import api from "../../lib/api";
import { formatKES, CATEGORY_LABELS } from "../../lib/format";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Panel from "../../components/Panel";
import WindowGrid from "../../components/WindowGrid";
import { Field, Input } from "../../components/FormField";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [start, setStart] = useState(monthsAgo(5));
  const [end, setEnd] = useState(currentMonth());
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load the dashboard. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  function loadRevenue() {
    setRevenueLoading(true);
    api
      .get("/dashboard/revenue", { params: { start, end } })
      .then((res) => setRevenue(res.data))
      .catch(() => {})
      .finally(() => setRevenueLoading(false));
  }

  useEffect(loadRevenue, []); // eslint-disable-line react-hooks/exhaustive-deps

  function setPreset(months) {
    const s = monthsAgo(months - 1);
    const e = currentMonth();
    setStart(s);
    setEnd(e);
    setRevenueLoading(true);
    api
      .get("/dashboard/revenue", { params: { start: s, end: e } })
      .then((res) => setRevenue(res.data))
      .catch(() => {})
      .finally(() => setRevenueLoading(false));
  }

  if (loading) return <p className="text-sm text-ink-faint">Loading dashboard…</p>;
  if (error) return <p className="text-sm text-rose">{error}</p>;
  if (!summary) return null;

  const categoryData = summary.properties.byCategory.map((c) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    units: c.count,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Portfolio dashboard"
        subtitle="A live snapshot of every property, tenant, and shilling moving through the system."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Occupancy rate"
          value={`${summary.properties.occupancyRate}%`}
          sub={`${summary.properties.occupied} of ${summary.properties.total} units occupied`}
          icon={Building2}
          accent="signal"
        />
        <StatCard label="Active tenants" value={summary.tenants.active} icon={Users} accent="neutral" />
        <StatCard
          label="Outstanding balance"
          value={formatKES(summary.billing.outstanding)}
          sub={`${summary.billing.pendingCount} pending (unreceipted) invoice(s)`}
          icon={Wallet}
          accent={summary.billing.pendingCount > 0 ? "rose" : "neutral"}
        />
        <StatCard
          label="Open maintenance"
          value={summary.maintenance.open}
          sub={`${summary.maintenance.urgent} urgent`}
          icon={Wrench}
          accent={summary.maintenance.urgent > 0 ? "amber" : "neutral"}
        />
      </div>

      <Panel
        title="Revenue: expected vs. collected"
        subtitle="Expected assumes every unit is occupied at its current rent for the whole period."
        className="mt-6"
        action={
          <div className="flex flex-wrap items-end gap-2">
            <Field label="From">
              <Input type="month" value={start} onChange={(e) => setStart(e.target.value)} className="text-xs" />
            </Field>
            <Field label="To">
              <Input type="month" value={end} onChange={(e) => setEnd(e.target.value)} className="text-xs" />
            </Field>
            <button onClick={loadRevenue} className="h-9 rounded-lg bg-signal px-3 text-xs font-semibold text-base hover:bg-signal-deep transition-colors">
              Apply
            </button>
            <button onClick={() => setPreset(1)} className="h-9 rounded-lg border border-border px-3 text-xs text-ink-muted hover:border-signal/50 hover:text-signal transition-colors">
              This month
            </button>
            <button onClick={() => setPreset(12)} className="h-9 rounded-lg border border-border px-3 text-xs text-ink-muted hover:border-signal/50 hover:text-signal transition-colors">
              12 months
            </button>
          </div>
        }
      >
        {revenueLoading && <p className="text-sm text-ink-faint">Loading…</p>}
        {revenue && !revenueLoading && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface-raised p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Expected</p>
                <p className="mt-1 font-display text-xl font-bold text-ink">{formatKES(revenue.totals.expected)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Collected</p>
                <p className="mt-1 font-display text-xl font-bold text-signal">{formatKES(revenue.totals.actual)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-raised p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-ink-faint">Gap</p>
                <p className="mt-1 font-display text-xl font-bold text-rose">{formatKES(Math.max(0, revenue.totals.expected - revenue.totals.actual))}</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue.months} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#212B39" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#8FA1B3", fontSize: 11 }} axisLine={{ stroke: "#212B39" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8FA1B3", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => formatKES(v)}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{ background: "#161D28", border: "1px solid #2E3A4C", borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: "#EAF1F8" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="expected" name="Expected" fill="#3A4A5E" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="actual" name="Collected" fill="#22E6C5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Panel>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Units by category" subtitle="Where the portfolio's inventory sits" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#212B39" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#8FA1B3", fontSize: 11 }} axisLine={{ stroke: "#212B39" }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "#8FA1B3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{ background: "#161D28", border: "1px solid #2E3A4C", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "#EAF1F8" }}
                />
                <Bar dataKey="units" fill="#22E6C5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Outstanding balance" subtitle="Every invoice that hasn't been receipted counts as pending">
          <div className="flex h-full flex-col items-center justify-center py-6 text-center">
            <Wallet size={22} className="mb-2 text-rose" />
            <p className="font-display text-3xl font-bold text-ink">{formatKES(summary.billing.outstanding)}</p>
            <p className="mt-1 text-xs text-ink-faint">{summary.billing.pendingCount} pending invoice(s)</p>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Units by area">
          <div className="space-y-2.5">
            {summary.properties.byArea.map((a) => (
              <div key={a.area} className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3.5 py-2.5">
                <span className="text-sm text-ink">{a.area}</span>
                <span className="text-xs font-mono text-ink-faint">{a.count} unit(s)</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Status legend" subtitle="How the window indicator reads across the app">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <WindowGrid status="occupied" />
              <span className="text-sm text-ink-muted">Occupied - tenant in place</span>
            </div>
            <div className="flex items-center gap-3">
              <WindowGrid status="vacant" />
              <span className="text-sm text-ink-muted">Vacant - ready to list</span>
            </div>
            <div className="flex items-center gap-3">
              <WindowGrid status="maintenance" />
              <span className="text-sm text-ink-muted">Maintenance - work in progress</span>
            </div>
            {summary.maintenance.urgent > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose/25 bg-rose/10 px-3 py-2 text-xs text-rose">
                <AlertTriangle size={13} /> {summary.maintenance.urgent} urgent maintenance issue(s) need attention.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
