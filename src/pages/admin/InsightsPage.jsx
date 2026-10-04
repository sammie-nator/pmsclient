import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Building2, AlertTriangle } from "lucide-react";
import api from "../../lib/api";
import { formatKES } from "../../lib/format";
import PageHeader from "../../components/PageHeader";
import Panel from "../../components/Panel";
import StatCard from "../../components/StatCard";
import EmptyState from "../../components/EmptyState";

export default function InsightsPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/building-insights")
      .then((res) => setBuildings(res.data.buildings))
      .catch(() => setError("Could not load portfolio insights. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-faint">Loading insights…</p>;
  if (error) return <p className="text-sm text-rose">{error}</p>;
  if (buildings.length === 0) return <EmptyState icon={Building2} title="No buildings yet" />;

  const topEarner = [...buildings].sort((a, b) => b.netAllTime - a.netAllTime)[0];
  const lowestOccupancy = [...buildings].sort((a, b) => a.occupancyRate - b.occupancyRate)[0];
  const highestMaintenance = [...buildings].sort((a, b) => b.allTimeMaintenanceCost - a.allTimeMaintenanceCost)[0];

  return (
    <div>
      <PageHeader
        eyebrow="Business insight"
        title="Portfolio insights"
        subtitle="All-time figures per building - where the money's coming from, and where it's going."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Best net performer" value={topEarner.buildingName} sub={formatKES(topEarner.netAllTime) + " net"} icon={TrendingUp} accent="signal" />
        <StatCard label="Lowest occupancy" value={lowestOccupancy.buildingName} sub={`${lowestOccupancy.occupancyRate}% occupied`} icon={TrendingDown} accent={lowestOccupancy.occupancyRate < 50 ? "rose" : "amber"} />
        <StatCard label="Highest maintenance spend" value={highestMaintenance.buildingName} sub={formatKES(highestMaintenance.allTimeMaintenanceCost)} icon={AlertTriangle} accent="amber" />
      </div>

      <Panel title="All buildings" subtitle="Sorted by all-time rent collected" className="mt-5" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-3 font-medium">Building</th>
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Occupancy</th>
                <th className="px-4 py-3 font-medium">Rent potential/mo</th>
                <th className="px-4 py-3 font-medium">Collected (all time)</th>
                <th className="px-4 py-3 font-medium">Maintenance (all time)</th>
                <th className="px-4 py-3 font-medium">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {buildings.map((b) => (
                <tr key={b.buildingName}>
                  <td className="px-4 py-3 text-ink">{b.buildingName}</td>
                  <td className="px-4 py-3 text-ink-faint">{b.area}</td>
                  <td className="px-4 py-3">
                    <span className={b.occupancyRate >= 80 ? "text-signal" : b.occupancyRate >= 40 ? "text-amber" : "text-rose"}>
                      {b.occupancyRate}%
                    </span>
                    <span className="ml-1 text-ink-faint">({b.occupiedUnits}/{b.totalUnits})</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-muted">{formatKES(b.monthlyRentPotential)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatKES(b.allTimeCollected)}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">{formatKES(b.allTimeMaintenanceCost)}</td>
                  <td className={`px-4 py-3 font-mono font-semibold ${b.netAllTime >= 0 ? "text-signal" : "text-rose"}`}>{formatKES(b.netAllTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
