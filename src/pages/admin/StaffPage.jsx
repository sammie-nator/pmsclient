import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Pencil, UserCog, ShieldCheck } from "lucide-react";
import api from "../../lib/api";
import PageHeader from "../../components/PageHeader";
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import { Field, Input, Select } from "../../components/FormField";

const EMPTY_FORM = { name: "", role: "agent", phone: "", email: "", assignedAreas: "" };
const ROLE_LABEL = { admin: "Admin", agent: "Agent", frontdesk: "Front Desk" };

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/staff")
      .then((res) => setStaff(res.data))
      .catch(() => setError("Could not load staff. Is the backend running?"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(s) {
    setEditing(s);
    setForm({ name: s.name, role: s.role, phone: s.phone || "", email: s.email || "", assignedAreas: (s.assignedAreas || []).join(", ") });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.name) {
      setFormError("Name is required.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      assignedAreas: form.assignedAreas.split(",").map((a) => a.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        const res = await api.patch(`/staff/${editing._id}`, payload);
        setStaff((prev) => prev.map((s) => (s._id === res.data._id ? res.data : s)));
      } else {
        const res = await api.post("/staff", payload);
        setStaff((prev) => [...prev, res.data]);
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.error || "Something went wrong saving this staff member.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/staff/${deleteTarget._id}`);
      setStaff((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not remove this staff member.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Team"
        title="Staff"
        subtitle="Everyone who can act as Admin, Agent, or Front Desk. This is the directory the role picker draws from."
        action={
          <Button onClick={openCreate}>
            <Plus size={15} /> Add staff
          </Button>
        }
      />

      {loading && <p className="text-sm text-ink-faint">Loading staff…</p>}
      {error && <p className="text-sm text-rose">{error}</p>}
      {!loading && staff.length === 0 && (
        <EmptyState icon={UserCog} title="No staff yet" subtitle="Add your team so they can pick their name at sign-in." />
      )}

      <Panel bodyClassName="p-0">
        <div className="divide-y divide-border">
          {staff.map((s) => (
            <div key={s._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-semibold text-ink">
                  {s.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                  <p className="text-xs text-ink-faint">{s.phone || "—"} {s.email && `· ${s.email}`}</p>
                </div>
              </div>
              {s.assignedAreas?.length > 0 && (
                <p className="text-xs text-ink-faint hidden sm:block">{s.assignedAreas.join(", ")}</p>
              )}
              <Badge tone={s.role === "admin" ? "signal" : s.role === "agent" ? "amber" : "neutral"}>{ROLE_LABEL[s.role]}</Badge>
              <div className="flex items-center gap-1">
                <Link
                  to={`/admin/audit?actor=${encodeURIComponent(s.name)}`}
                  className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-raised hover:text-signal transition-colors"
                  aria-label="View activity"
                  title="View activity"
                >
                  <ShieldCheck size={14} />
                </Link>
                <button onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-raised hover:text-ink transition-colors" aria-label="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(s)} className="rounded-lg p-1.5 text-ink-faint hover:bg-rose/10 hover:text-rose transition-colors" aria-label="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit staff member" : "Add staff member"} width="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{formError}</p>}
          <Field label="Full name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Role" required>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="frontdesk">Front Desk</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          {form.role === "agent" && (
            <Field label="Assigned areas" hint="Comma-separated, e.g. Kilimani, Lavington">
              <Input value={form.assignedAreas} onChange={(e) => setForm({ ...form, assignedAreas: e.target.value })} />
            </Field>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add staff"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove this staff member?"
        body={`"${deleteTarget?.name}" will no longer appear in the sign-in list.`}
      />
    </div>
  );
}
