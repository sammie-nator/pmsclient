import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Receipt, AlertCircle, Plus } from "lucide-react";
import api from "../../lib/api";
import { formatKES } from "../../lib/format";
import { useActor } from "../../context/ActorContext";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Panel from "../../components/Panel";
import Button from "../../components/Button";

export default function FrontDeskDashboard() {
  const { actor } = useActor();
  const [stats, setStats] = useState({ active: 0, pending: 0 });
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/tenants/stats"), api.get("/billing", { params: { status: "pending" } })])
      .then(([sRes, bRes]) => {
        setStats(sRes.data);
        setBills(bRes.data);
      })
      .catch(() => setError("Could not load the dashboard. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-faint">Loading dashboard…</p>;
  if (error) return <p className="text-sm text-rose">{error}</p>;

  const active = stats.active;
  const pending = stats.pending;
  const pendingTotal = bills.reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Front desk"
        title={`Welcome, ${actor?.name?.split(" ")[0] || "there"}`}
        subtitle="Create and update tenants and billing. Deletions stay with an admin."
        action={
          <div className="flex gap-2">
            <Link to="/frontdesk/tenants">
              <Button variant="outline">
                <Plus size={15} /> New tenant
              </Button>
            </Link>
            <Link to="/frontdesk/billing">
              <Button>
                <Plus size={15} /> New invoice
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active tenants" value={active} icon={Users} accent="signal" />
        <StatCard label="Pending move-ins" value={pending} icon={Users} accent="neutral" />
        <StatCard label="Pending balance" value={formatKES(pendingTotal)} sub={`${bills.length} pending (unreceipted) invoice(s)`} icon={Receipt} accent={bills.length > 0 ? "rose" : "neutral"} />
      </div>

      {bills.length > 0 && (
        <div className="mt-5">
          <Panel title="Pending invoices" subtitle="Not yet receipted - worth a follow-up call">
            <div className="space-y-2">
              {bills.map((b) => (
                <div key={b._id} className="flex items-center justify-between rounded-lg border border-rose/25 bg-rose/5 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={13} className="text-rose" />
                    <span className="text-sm text-ink">{b.tenant?.fullName || "Unknown tenant"}</span>
                  </div>
                  <span className="font-mono text-sm text-rose">{formatKES(b.amount - b.paidAmount)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
