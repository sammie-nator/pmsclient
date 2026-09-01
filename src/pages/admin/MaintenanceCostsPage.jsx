import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Wrench } from "lucide-react";
import api from "../../lib/api";
import { formatKES } from "../../lib/format";
import PageHeader from "../../components/PageHeader";
import Panel from "../../components/Panel";
import StatCard from "../../components/StatCard";
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

export default function MaintenanceCostsPage() {
  const [start, setStart] = useState(monthsAgo(11));
  const [end, setEnd] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api
      .get("/dashboard/maintenance-costs", { params: { start, end } })
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load maintenance costs."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  function setPreset(months) {
    setStart(monthsAgo(months - 1));
    setEnd(currentMonth());
  }

  return (
    <div>
      <PageHeader
        eyebrow="Expenses"
        title="Maintenance costs"
        subtitle="Monthly and yearly spend, rolled up per building - no individual issue or tenant detail."
      />

      <Panel bodyClassName="p-4" className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="From month">
            <Input type="month" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="To month">
            <Input type="month" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <button onClick={load} className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-base hover:bg-signal-deep transition-colors">
            Apply
          </button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setPreset(1)} className="rounded-lg border border-border px-3 py-2 text-xs text-ink-muted hover:border-signal/50 hover:text-signal transition-colors">
              This month
            </button>
            <button onClick={() => setPreset(12)} className="rounded-lg border border-border px-3 py-2 text-xs text-ink-muted hover:border-signal/50 hover:text-signal transition-colors">
              Last 12 months
            </button>
          </div>
        </div>
      </Panel>

      {loading && <p className="text-sm text-ink-faint">Loading…</p>}
      {error && <p className="text-sm text-rose">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard label="Total spend in range" value={formatKES(data.totalCost)} icon={Wrench} accent="amber" />
            <StatCard
              label="Buildings with recorded costs"
              value={data.byBuilding.length}
              sub={data.byBuilding[0] ? `Highest: ${data.byBuilding[0].buildingName}` : undefined}
              icon={Wrench}
              accent="neutral"
            />
          </div>

          <Panel title="Spend by month" className="mt-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.months} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#212B39" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#8FA1B3", fontSize: 11 }} axisLine={{ stroke: "#212B39" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8FA1B3", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => formatKES(v)}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{ background: "#161D28", border: "1px solid #2E3A4C", borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: "#EAF1F8" }}
                  />
                  <Bar dataKey="total" fill="#FFB020" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Spend by building" subtitle="Aggregated only - no individual maintenance requests shown" className="mt-5">
            {data.byBuilding.length === 0 ? (
              <p className="text-xs text-ink-faint">No maintenance costs recorded in this range.</p>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border">
                {data.byBuilding.map((b) => (
                  <div key={b.buildingName} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                    <span className="text-ink">{b.buildingName}</span>
                    <span className="text-xs text-ink-faint">{b.issueCount} issue(s)</span>
                    <span className="font-mono font-semibold text-ink">{formatKES(b.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
