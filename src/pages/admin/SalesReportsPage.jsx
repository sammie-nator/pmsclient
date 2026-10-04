import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import api from "../../lib/api";
import { formatKES } from "../../lib/format";
import PageHeader from "../../components/PageHeader";
import Panel from "../../components/Panel";
import StatCard from "../../components/StatCard";
import { Field, Input, Select } from "../../components/FormField";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SalesReportsPage() {
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const [buildingKey, setBuildingKey] = useState("");
  const [type, setType] = useState("all");
  const [start, setStart] = useState(monthsAgo(5));
  const [end, setEnd] = useState(currentMonth());

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/properties")
      .then((res) => setProperties(res.data))
      .catch(() => {})
      .finally(() => setLoadingProperties(false));
  }, []);

  // Same grouping as the Properties/Balances pages - one entry per
  // building, standalone units grouped by their own id.
  const buildings = useMemo(() => {
    const map = new Map();
    for (const p of properties) {
      const key = p.buildingName || p._id;
      if (!map.has(key)) map.set(key, { key, label: p.buildingName || p.name, area: p.area, count: 0 });
      map.get(key).count += 1;
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [properties]);

  function loadReport(key = buildingKey, t = type, s = start, e = end) {
    if (!key) {
      setError("Select a building or property first.");
      return;
    }
    setError("");
    setLoading(true);
    api
      .get("/dashboard/property-report", { params: { key, type: t, start: s, end: e } })
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.response?.data?.error || "Could not load this report."))
      .finally(() => setLoading(false));
  }

  function setPreset(months) {
    const s = monthsAgo(months - 1);
    const e = currentMonth();
    setStart(s);
    setEnd(e);
    if (buildingKey) loadReport(buildingKey, type, s, e);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Sales reports"
        subtitle="Pick a building, a revenue type, and a period - see what was expected vs. what actually came in."
      />

      <Panel bodyClassName="p-4" className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Building / property">
            <Select value={buildingKey} onChange={(e) => setBuildingKey(e.target.value)} disabled={loadingProperties}>
              <option value="">Select…</option>
              {buildings.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label} · {b.area} ({b.count} unit{b.count === 1 ? "" : "s"})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Revenue type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              <option value="rent">Rent</option>
              <option value="deposit">Deposits</option>
              <option value="utility">Utilities</option>
              <option value="penalty">Penalties</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="From month">
            <Input type="month" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="To month">
            <Input type="month" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <button
            onClick={() => loadReport()}
            className="h-9 rounded-lg bg-signal px-4 text-sm font-semibold text-base hover:bg-signal-deep transition-colors"
          >
            Run report
          </button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setPreset(1)} className="h-9 rounded-lg border border-border px-3 text-xs text-ink-muted hover:border-signal/50 hover:text-signal transition-colors">
              This month
            </button>
            <button onClick={() => setPreset(12)} className="h-9 rounded-lg border border-border px-3 text-xs text-ink-muted hover:border-signal/50 hover:text-signal transition-colors">
              Last 12 months
            </button>
          </div>
        </div>
      </Panel>

      {error && <p className="mb-4 text-sm text-rose">{error}</p>}
      {loading && <p className="text-sm text-ink-faint">Loading report…</p>}

      {!loading && !report && !error && (
        <p className="text-sm text-ink-faint">Select a building and run a report to see figures here.</p>
      )}

      {report && !loading && (
        <>
          <PageHeader eyebrow={report.area} title={report.buildingName} subtitle={`${report.unitCount} unit(s) in this report`} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Expected" value={formatKES(report.totals.expected)} icon={TrendingUp} accent="neutral" />
            <StatCard label="Collected" value={formatKES(report.totals.actual)} icon={TrendingUp} accent="signal" />
            <StatCard
              label="Gap"
              value={formatKES(Math.max(0, report.totals.expected - report.totals.actual))}
              icon={TrendingUp}
              accent={report.totals.expected - report.totals.actual > 0 ? "rose" : "neutral"}
            />
          </div>

          {type !== "all" && type !== "rent" && (
            <p className="mt-3 text-xs text-ink-faint">
              "Expected" is only calculated for rent, since it's the one predictable recurring figure - {type} is shown as collected only.
            </p>
          )}

          <Panel title="By month" className="mt-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.months} margin={{ left: -20 }}>
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
          </Panel>
        </>
      )}
    </div>
  );
}
