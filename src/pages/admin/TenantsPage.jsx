import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2, ArrowRight, Home, UserSearch } from "lucide-react";
import api from "../../lib/api";
import { formatDate } from "../../lib/format";
import { useActor } from "../../context/ActorContext";
import PageHeader from "../../components/PageHeader";
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import { Field, Input, Select } from "../../components/FormField";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  email: "",
  idNumber: "",
  occupation: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  occupants: 1,
  property: "",
  moveInDate: "",
  leaseEndDate: "",
};

export default function TenantsPage() {
  const { actor } = useActor();
  const isAdmin = actor?.role === "admin";
  const basePath = `/${actor?.role || "admin"}/tenants`;

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Only the property list is fetched up front - it's needed for the
  // "assign to property" dropdown when adding a tenant. The tenant list
  // itself is never dumped in full; it only loads once someone searches.
  useEffect(() => {
    api.get("/properties").then((res) => setProperties(res.data)).catch(() => {});
  }, []);

  async function runSearch(e) {
    e?.preventDefault();
    if (!query.trim() && !statusFilter) {
      setError("Enter a name, phone number, or email to search - or pick a status.");
      return;
    }
    setError("");
    setSearching(true);
    setHasSearched(true);
    try {
      const params = {};
      if (query.trim()) params.search = query.trim();
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/tenants", { params });
      setTenants(res.data);
    } catch {
      setError("Could not search tenants. Is the backend running?");
    } finally {
      setSearching(false);
    }
  }

  function refreshCurrentSearch() {
    if (hasSearched) runSearch();
  }

  const availableProperties = properties.filter((p) => p.status === "vacant");

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.fullName || !form.phone) {
      setFormError("Full name and phone are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/tenants", { ...form, occupants: Number(form.occupants) || 1 });
      setFormOpen(false);
      api.get("/properties").then((res) => setProperties(res.data)).catch(() => {});
      refreshCurrentSearch();
    } catch (err) {
      setFormError(err.response?.data?.error || "Something went wrong saving this tenant.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/tenants/${deleteTarget._id}`);
      setTenants((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete this tenant.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Tenants"
        subtitle="Search by name, phone, or email to pull up a tenant's record."
        action={
          <Button onClick={openCreate}>
            <Plus size={15} /> Add tenant
          </Button>
        }
      />

      <Panel bodyClassName="p-4" className="mb-5">
        <form onSubmit={runSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input
              placeholder="Search by name, phone number, or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            {isAdmin && <option value="former">Vacated (admin only)</option>}
          </Select>
          <Button type="submit" disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </Button>
        </form>
      </Panel>

      {error && <p className="mb-4 text-sm text-rose">{error}</p>}

      {!hasSearched && (
        <EmptyState
          icon={UserSearch}
          title="Search to find a tenant"
          subtitle="Type a name, phone number, or email above - the full tenant list isn't shown by default."
        />
      )}

      {hasSearched && !searching && tenants.length === 0 && !error && (
        <EmptyState icon={Search} title="No tenants matched that search" subtitle="Try a different name, phone number, or email." />
      )}

      {hasSearched && tenants.length > 0 && (
        <Panel bodyClassName="p-0">
          <div className="divide-y divide-border">
            {tenants.map((t) => (
              <Link
                key={t._id}
                to={`${basePath}/${t._id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-raised/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-semibold text-ink">
                    {t.fullName[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{t.fullName}</p>
                    <p className="text-xs text-ink-faint">{t.phone}{t.email ? ` · ${t.email}` : ""}</p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-ink-muted">
                  <Home size={12} />
                  {t.property ? (t.property.unitCode ? `${t.property.unitCode} · ${t.property.buildingName}` : t.property.name) : "Unassigned"}
                </div>

                <div className="hidden md:block text-xs text-ink-faint">
                  Since {t.moveInDate ? formatDate(t.moveInDate) : "—"}
                </div>

                <div className="flex items-center gap-3">
                  <Badge status={t.status} />
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteTarget(t);
                      }}
                      className="rounded-lg p-1.5 text-ink-faint hover:bg-rose/10 hover:text-rose transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <ArrowRight size={14} className="text-ink-faint" />
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add tenant" width="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{formError}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name" required>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Phone" required>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XX XXX XXX" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="ID / passport number">
              <Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />
            </Field>
            <Field label="Occupation">
              <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
            </Field>
            <Field label="Occupants">
              <Input type="number" min="1" value={form.occupants} onChange={(e) => setForm({ ...form, occupants: e.target.value })} />
            </Field>
            <Field label="Emergency contact name">
              <Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
            </Field>
            <Field label="Emergency contact phone">
              <Input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
            </Field>
          </div>

          <div className="border-t border-border pt-4">
            <Field label="Assign to property" hint="Only vacant units are listed. Leave blank to add without assigning yet.">
              <Select value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
                <option value="">— Unassigned —</option>
                {availableProperties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.unitCode ? `${p.unitCode} · ${p.buildingName}` : p.name} · {p.area}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Move-in date">
                <Input type="date" value={form.moveInDate} onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} />
              </Field>
              <Field label="Lease end date">
                <Input type="date" value={form.leaseEndDate} onChange={(e) => setForm({ ...form, leaseEndDate: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add tenant"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this tenant?"
        body={`"${deleteTarget?.fullName}"'s record, including history and notes, will be permanently removed.`}
      />
    </div>
  );
}
