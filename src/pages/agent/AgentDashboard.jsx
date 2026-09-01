import { useEffect, useState } from "react";
import { Building2, Home, Wrench, MapPinned } from "lucide-react";
import api from "../../lib/api";
import { useActor } from "../../context/ActorContext";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Panel from "../../components/Panel";

export default function AgentDashboard() {
  const { actor } = useActor();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/agent-summary")
      .then((res) => setSummary(res.data))
      .catch(() => setError("Could not load the dashboard. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-faint">Loading dashboard…</p>;
  if (error) return <p className="text-sm text-rose">{error}</p>;
  if (!summary) return null;

  return (
    <div>
      <PageHeader
        eyebrow="Field view"
        title={`Welcome back, ${actor?.name?.split(" ")[0] || "there"}`}
        subtitle="Houses by area, what's vacant, and what needs attention."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total units" value={summary.properties.total} icon={Building2} accent="neutral" />
        <StatCard label="Vacant" value={summary.properties.vacant} icon={Home} accent="signal" />
        <StatCard label="Occupied" value={summary.properties.occupied} icon={Building2} accent="neutral" />
        <StatCard label="Open maintenance" value={summary.maintenance.open} icon={Wrench} accent={summary.maintenance.open > 0 ? "amber" : "neutral"} />
      </div>

      <div className="mt-5">
        <Panel title="Units by area" subtitle="Where the portfolio sits, at a glance">
          <div className="space-y-2.5">
            {summary.properties.byArea.map((a) => (
              <div key={a.area} className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-sm text-ink">
                  <MapPinned size={13} className="text-ink-faint" /> {a.area}
                </span>
                <span className="text-xs font-mono text-ink-faint">{a.count} unit(s)</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
