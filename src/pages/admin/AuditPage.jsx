import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, Search, CalendarClock } from "lucide-react";
import api from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import PageHeader from "../../components/PageHeader";
import Panel from "../../components/Panel";
import Badge from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import { Input, Select } from "../../components/FormField";

const ROLE_LABEL = { admin: "Admin", agent: "Agent", frontdesk: "Front Desk" };
const METHOD_TONE = { POST: "signal", PATCH: "amber", DELETE: "rose", PUT: "amber" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [actors, setActors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingActors, setLoadingActors] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const roleFilter = searchParams.get("role") || "";
  const actorFilter = searchParams.get("actor") || "";
  const [date, setDate] = useState(searchParams.get("date") || today());

  useEffect(() => {
    api
      .get("/audit/actors")
      .then((res) => setActors(res.data))
      .catch(() => setError("Could not load staff activity. Is the backend running?"))
      .finally(() => setLoadingActors(false));
  }, []);

  function runSearch(nextDate = date, nextRole = roleFilter, nextActor = actorFilter) {
    if (!nextDate) {
      setError("Pick a date to view the audit trail for.");
      return;
    }
    setError("");
    setLoadingLogs(true);
    setHasSearched(true);
    const params = { date: nextDate };
    if (nextRole) params.role = nextRole;
    if (nextActor) params.actor = nextActor;
    api
      .get("/audit", { params })
      .then((res) => setLogs(res.data))
      .catch(() => setError("Could not load the audit trail."))
      .finally(() => setLoadingLogs(false));
  }

  // Load today's activity once on first render, then only refetch when the
  // person explicitly changes date/role/actor - never dump full history.
  useEffect(() => {
    runSearch(date, roleFilter, actorFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectActor(name) {
    const next = new URLSearchParams(searchParams);
    if (name) next.set("actor", name);
    else next.delete("actor");
    setSearchParams(next);
    runSearch(date, roleFilter, name);
  }

  function selectRole(role) {
    const next = new URLSearchParams(searchParams);
    if (role) next.set("role", role);
    else next.delete("role");
    setSearchParams(next);
    runSearch(date, role, actorFilter);
  }

  function handleDateChange(e) {
    const value = e.target.value;
    setDate(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("date", value);
    setSearchParams(next);
    runSearch(value, roleFilter, actorFilter);
  }

  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter((l) => l.action.toLowerCase().includes(q) || l.path.toLowerCase().includes(q));
  }, [logs, search]);

  return (
    <div>
      <PageHeader
        eyebrow="Accountability"
        title="Audit trail"
        subtitle="Pick a date to see exactly what happened that day, logged with the time it occurred."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <Panel title="Staff" bodyClassName="p-3">
          <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-signal/30 bg-signal/10 px-2.5 py-2">
            <CalendarClock size={14} className="shrink-0 text-signal" />
            <input
              type="date"
              value={date}
              max={today()}
              onChange={handleDateChange}
              className="w-full bg-transparent text-xs text-ink outline-none"
            />
          </div>
          <div className="mb-2">
            <Select value={roleFilter} onChange={(e) => selectRole(e.target.value)}>
              <option value="">All roles</option>
              {Object.entries(ROLE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          {loadingActors && <p className="px-1 py-2 text-xs text-ink-faint">Loading…</p>}
          <div className="space-y-1">
            <button
              onClick={() => selectActor("")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                !actorFilter ? "bg-signal/10 text-signal" : "text-ink-muted hover:bg-surface-raised"
              }`}
            >
              Everyone
            </button>
            {actors
              .filter((a) => !roleFilter || a.role === roleFilter)
              .map((a) => (
                <button
                  key={a.name}
                  onClick={() => selectActor(a.name)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    actorFilter === a.name ? "bg-signal/10 text-signal" : "text-ink-muted hover:bg-surface-raised"
                  }`}
                >
                  <span className="truncate">
                    {a.name} <span className="text-ink-faint">· {ROLE_LABEL[a.role]}</span>
                  </span>
                  <span className="shrink-0 text-ink-faint">{a.count}</span>
                </button>
              ))}
          </div>
        </Panel>

        <div>
          <Panel bodyClassName="p-4" className="mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <Input placeholder="Filter this day's activity by action or path…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>
          </Panel>

          {error && <p className="mb-3 text-sm text-rose">{error}</p>}
          {loadingLogs && <p className="text-sm text-ink-faint">Loading activity…</p>}

          {hasSearched && !loadingLogs && filteredLogs.length === 0 && !error && (
            <EmptyState icon={ShieldCheck} title="No activity on this day" subtitle="Try a different date or clear the role/staff filter." />
          )}

          {!loadingLogs && filteredLogs.length > 0 && (
            <Panel bodyClassName="p-0">
              <div className="divide-y divide-border">
                {filteredLogs.map((l) => (
                  <div key={l._id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{l.action}</p>
                      <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                        {l.actorName} · {ROLE_LABEL[l.actorRole]} · {l.path}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={METHOD_TONE[l.method] || "neutral"}>{l.method}</Badge>
                      <span className="text-[11px] text-ink-faint">{formatDateTime(l.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
