import { useEffect, useMemo, useState } from "react";
import { Search, Phone, Mail, Wallet } from "lucide-react";
import api from "../lib/api";
import { formatKES, CATEGORY_LABELS } from "../lib/format";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { Input } from "../components/FormField";

export default function BalancesPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/balances")
      .then((res) => setBuildings(res.data.buildings))
      .catch(() => setError("Could not load balances. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      buildings.filter(
        (b) => !search || b.buildingName.toLowerCase().includes(search.toLowerCase()) || b.area.toLowerCase().includes(search.toLowerCase())
      ),
    [buildings, search]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Ground view"
        title="Balances"
        subtitle="Who's in each unit, what they owe, and what a vacant unit rents for - by building."
      />

      <Panel bodyClassName="p-4" className="mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input placeholder="Filter by building or area…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
      </Panel>

      {loading && <p className="text-sm text-ink-faint">Loading balances…</p>}
      {error && <p className="text-sm text-rose">{error}</p>}

      {!loading && filtered.length === 0 && (
        <EmptyState icon={Search} title="No buildings found" subtitle="Try a different search." />
      )}

      <div className="space-y-4">
        {filtered.map((b) => (
          <Panel
            key={b.buildingName}
            title={b.buildingName}
            subtitle={`${b.area} · ${b.occupiedUnits}/${b.totalUnits} occupied`}
            action={
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  b.occupancyRate >= 80
                    ? "border-signal/30 bg-signal/10 text-signal"
                    : b.occupancyRate >= 40
                    ? "border-amber/30 bg-amber/10 text-amber"
                    : "border-rose/30 bg-rose/10 text-rose"
                }`}
              >
                {b.occupancyRate}% occupied
              </span>
            }
          >
            <div className="divide-y divide-border rounded-xl border border-border">
              {b.units
                .slice()
                .sort((a, u) => (a.code || "").localeCompare(u.code || ""))
                .map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-4 px-3.5 py-2.5">
                    <div className="flex items-center gap-2 w-24 shrink-0">
                      <span className="font-mono text-sm font-semibold text-ink">{u.code}</span>
                    </div>

                    {u.status === "occupied" && u.tenant ? (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-ink">{u.tenant.fullName}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-faint">
                            <span className="flex items-center gap-1">
                              <Phone size={10} /> {u.tenant.phone}
                            </span>
                            {u.tenant.email && (
                              <span className="flex items-center gap-1">
                                <Mail size={10} /> {u.tenant.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {u.tenant.balance > 0 ? (
                            <span className="flex items-center gap-1 text-sm font-semibold text-rose">
                              <Wallet size={12} /> {formatKES(u.tenant.balance)} due
                            </span>
                          ) : (
                            <span className="text-xs text-ink-faint">Up to date</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <Badge status={u.status} />
                          <span className="ml-2 text-xs text-ink-faint">{CATEGORY_LABELS[u.category]}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-sm font-semibold text-ink">{formatKES(u.monthlyRent)}</span>
                          <span className="text-ink-faint text-xs">/mo to occupy</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
