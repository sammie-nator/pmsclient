import { useEffect, useMemo, useState } from "react";
import { NotebookPen, MapPin, Trash2 } from "lucide-react";
import api from "../lib/api";
import { formatDate, timeAgo } from "../lib/format";
import { useActor } from "../context/ActorContext";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import Button from "../components/Button";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { Field, Input, Textarea } from "../components/FormField";

const EMPTY_FORM = { locationsVisited: "", notes: "" };

export default function FieldUpdatesPage() {
  const { actor } = useActor();
  const isAdmin = actor?.role === "admin";

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  function load() {
    setLoading(true);
    api
      .get("/field-updates")
      .then((res) => setUpdates(res.data))
      .catch(() => setError("Could not load field updates. Is the backend running?"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handlePost(e) {
    e.preventDefault();
    setPostError("");
    if (!form.notes.trim()) {
      setPostError("Add a note before posting.");
      return;
    }
    setPosting(true);
    try {
      const res = await api.post("/field-updates", form);
      setUpdates((prev) => [res.data, ...prev]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setPostError(err.response?.data?.error || "Could not post this update.");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/field-updates/${id}`);
      setUpdates((prev) => prev.filter((u) => u._id !== id));
    } catch {
      setError("Could not delete that update.");
    }
  }

  const groupedByDate = useMemo(() => {
    const map = new Map();
    for (const u of updates) {
      if (!map.has(u.date)) map.set(u.date, []);
      map.get(u.date).push(u);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [updates]);

  return (
    <div>
      <PageHeader
        eyebrow="Field team"
        title="Field updates"
        subtitle="Short daily reports from agents on the ground - visible to fellow agents and management."
      />

      <Panel title="Post today's update" className="mb-5">
        <form onSubmit={handlePost} className="space-y-3">
          {postError && <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{postError}</p>}
          <Field label="Places visited" hint="Optional - e.g. Riverbank Court, Kilimani; Greenview Apartments, Lavington">
            <Input value={form.locationsVisited} onChange={(e) => setForm({ ...form, locationsVisited: e.target.value })} placeholder="Where you went today…" />
          </Field>
          <Field label="Notes" required>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What you observed, comments, follow-ups needed…" />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={posting}>
              {posting ? "Posting…" : "Post update"}
            </Button>
          </div>
        </form>
      </Panel>

      {loading && <p className="text-sm text-ink-faint">Loading updates…</p>}
      {error && <p className="text-sm text-rose">{error}</p>}
      {!loading && updates.length === 0 && (
        <EmptyState icon={NotebookPen} title="No field updates yet" subtitle="Once agents post daily reports, they'll show up here by date." />
      )}

      <div className="space-y-5">
        {groupedByDate.map(([date, items]) => (
          <div key={date}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{formatDate(date)}</p>
            <div className="space-y-2.5">
              {items.map((u) => (
                <Panel key={u._id} bodyClassName="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{u.authorName}</span>
                        <Badge tone="neutral">{u.authorRole}</Badge>
                        <span className="text-[11px] text-ink-faint">{timeAgo(u.createdAt)}</span>
                      </div>
                      {u.locationsVisited && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-signal">
                          <MapPin size={11} /> {u.locationsVisited}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{u.notes}</p>
                    </div>
                    {(isAdmin || u.authorName === actor?.name) && (
                      <button onClick={() => handleDelete(u._id)} className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-rose/10 hover:text-rose transition-colors" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
