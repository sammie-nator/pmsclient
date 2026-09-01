import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, MapPin, Ruler, MessageSquare, Building2, Layers, Power } from "lucide-react";
import api from "../../lib/api";
import { formatKES, CATEGORY_LABELS } from "../../lib/format";
import PageHeader from "../../components/PageHeader";
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import WindowGrid from "../../components/WindowGrid";
import CommentThread from "../../components/CommentThread";
import { Field, Input, Select, Textarea } from "../../components/FormField";

const CATEGORIES = Object.keys(CATEGORY_LABELS);

const EMPTY_FORM = {
  name: "",
  category: "bedsitter",
  description: "",
  area: "",
  address: "",
  monthlyRent: "",
  deposit: "",
  status: "vacant",
  bedrooms: "",
  bathrooms: "",
  sizeSqm: "",
  amenities: "",
};

const EMPTY_FLOOR = { floorLabel: "G", floorNumber: 0, unitsCount: 3, category: "one-bedroom", bedrooms: 1, bathrooms: 1, monthlyRent: "" };
const EMPTY_BUILDING_FORM = {
  buildingName: "",
  area: "",
  address: "",
  description: "",
  deposit: "",
  amenities: "",
  floors: [{ ...EMPTY_FLOOR }],
};

function nextFloorDefaults(existingFloors) {
  const n = existingFloors.length; // 0 -> ground already used, so this is floor n
  return { ...EMPTY_FLOOR, floorLabel: String(n), floorNumber: n };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [areas, setAreas] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [buildingDetail, setBuildingDetail] = useState(null); // group whose units are being viewed

  const [buildingOpen, setBuildingOpen] = useState(false);
  const [buildingForm, setBuildingForm] = useState(EMPTY_BUILDING_FORM);
  const [buildingSaving, setBuildingSaving] = useState(false);
  const [buildingError, setBuildingError] = useState("");

  function load() {
    setLoading(true);
    api
      .get("/properties")
      .then((res) => setProperties(res.data))
      .catch(() => setError("Could not load properties. Is the backend running?"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api.get("/properties/meta").then((res) => setAreas(res.data.areas)).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (areaFilter && p.area !== areaFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.area.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [properties, categoryFilter, statusFilter, areaFilter, search]);

  // Units that share a buildingName are grouped into one building card so
  // the inventory shows the portfolio, not every single unit at once.
  // Standalone properties (no buildingName) render as their own card.
  const groups = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      const key = p.buildingName ? `b:${p.buildingName}` : `u:${p._id}`;
      if (!map.has(key)) {
        map.set(key, { key, isBuilding: !!p.buildingName, buildingName: p.buildingName, area: p.area, units: [] });
      }
      map.get(key).units.push(p);
    }
    return Array.from(map.values());
  }, [filtered]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      description: p.description,
      area: p.area,
      address: p.address || "",
      monthlyRent: p.monthlyRent,
      deposit: p.deposit || "",
      status: p.status,
      bedrooms: p.bedrooms || "",
      bathrooms: p.bathrooms || "",
      sizeSqm: p.sizeSqm || "",
      amenities: (p.amenities || []).join(", "),
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.description || !form.area || !form.monthlyRent) {
      setFormError("Name, description, area, and monthly rent are required.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      monthlyRent: Number(form.monthlyRent),
      deposit: form.deposit ? Number(form.deposit) : 0,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : 0,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : 0,
      sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : undefined,
      amenities: form.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    };
    try {
      if (editing) {
        const res = await api.patch(`/properties/${editing._id}`, payload);
        setProperties((prev) => prev.map((p) => (p._id === res.data._id ? res.data : p)));
      } else {
        const res = await api.post("/properties", payload);
        setProperties((prev) => [res.data, ...prev]);
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.error || "Something went wrong saving this property.");
    } finally {
      setSaving(false);
    }
  }

  function openBuildingCreate() {
    setBuildingForm(EMPTY_BUILDING_FORM);
    setBuildingError("");
    setBuildingOpen(true);
  }

  function updateFloor(index, patch) {
    setBuildingForm((prev) => ({
      ...prev,
      floors: prev.floors.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    }));
  }

  function addFloor() {
    setBuildingForm((prev) => ({ ...prev, floors: [...prev.floors, nextFloorDefaults(prev.floors)] }));
  }

  function removeFloor(index) {
    setBuildingForm((prev) => ({ ...prev, floors: prev.floors.filter((_, i) => i !== index) }));
  }

  async function handleBuildingSubmit(e) {
    e.preventDefault();
    setBuildingError("");
    if (!buildingForm.buildingName || !buildingForm.area) {
      setBuildingError("Building name and area are required.");
      return;
    }
    if (buildingForm.floors.some((f) => !f.unitsCount || !f.monthlyRent)) {
      setBuildingError("Every floor needs a unit count and monthly rent.");
      return;
    }
    setBuildingSaving(true);
    try {
      const payload = {
        ...buildingForm,
        deposit: buildingForm.deposit ? Number(buildingForm.deposit) : 0,
        amenities: buildingForm.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        floors: buildingForm.floors.map((f) => ({
          ...f,
          floorNumber: Number(f.floorNumber),
          unitsCount: Number(f.unitsCount),
          bedrooms: Number(f.bedrooms) || 0,
          bathrooms: Number(f.bathrooms) || 0,
          monthlyRent: Number(f.monthlyRent),
        })),
      };
      const res = await api.post("/properties/building", payload);
      setProperties((prev) => [...res.data, ...prev]);
      setBuildingOpen(false);
    } catch (err) {
      setBuildingError(err.response?.data?.error || "Something went wrong creating this building.");
    } finally {
      setBuildingSaving(false);
    }
  }

  async function toggleDeactivate(p) {
    const nextStatus = p.status === "deactivated" ? "vacant" : "deactivated";
    setError("");
    try {
      const res = await api.patch(`/properties/${p._id}`, { status: nextStatus });
      setProperties((prev) => prev.map((row) => (row._id === res.data._id ? res.data : row)));
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this unit's status.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/properties/${deleteTarget._id}`);
      setProperties((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
      if (detail?._id === deleteTarget._id) setDetail(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete this property.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddComment(text) {
    const res = await api.post(`/properties/${detail._id}/comments`, { text });
    setDetail((prev) => ({ ...prev, comments: [...prev.comments, res.data] }));
    setProperties((prev) =>
      prev.map((p) => (p._id === detail._id ? { ...p, comments: [...p.comments, res.data] } : p))
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Properties"
        subtitle="Every unit in the portfolio, its category, and where it stands."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openBuildingCreate}>
              <Layers size={15} /> Add building (floors)
            </Button>
            <Button onClick={openCreate}>
              <Plus size={15} /> Add property
            </Button>
          </div>
        }
      />

      <Panel bodyClassName="p-4" className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input placeholder="Search by name or area…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-auto">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
            <option value="">All statuses</option>
            <option value="vacant">Vacant</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="deactivated">Deactivated</option>
          </Select>
          <Select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="w-auto">
            <option value="">All areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>
      </Panel>

      {loading && <p className="text-sm text-ink-faint">Loading properties…</p>}
      {error && <p className="text-sm text-rose">{error}</p>}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title="No properties match those filters"
          subtitle="Try clearing a filter, or add a new property to the portfolio."
          action={
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus size={14} /> Add property
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) =>
          g.isBuilding ? (
            <BuildingCard key={g.key} group={g} onView={() => setBuildingDetail(g)} />
          ) : (
            <UnitCard key={g.units[0]._id} p={g.units[0]} onNotes={setDetail} onEdit={openEdit} onDelete={setDeleteTarget} onToggleDeactivate={toggleDeactivate} />
          )
        )}
      </div>

      {/* Units within a building */}
      <Modal
        open={!!buildingDetail}
        onClose={() => setBuildingDetail(null)}
        title={buildingDetail?.buildingName}
        subtitle={buildingDetail ? `${buildingDetail.area} · ${buildingDetail.units.length} unit${buildingDetail.units.length === 1 ? "" : "s"}` : ""}
        width="max-w-4xl"
      >
        {buildingDetail && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {buildingDetail.units
              .sort((a, b) => (a.unitCode || "").localeCompare(b.unitCode || ""))
              .map((p) => (
                <UnitCard
                  key={p._id}
                  p={p}
                  onNotes={setDetail}
                  onEdit={(unit) => {
                    setBuildingDetail(null);
                    openEdit(unit);
                  }}
                  onDelete={setDeleteTarget}
                  onToggleDeactivate={toggleDeactivate}
                />
              ))}
          </div>
        )}
      </Modal>

      {/* Create / edit form */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit property" : "Add property"} width="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{formError}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Property name" required className="col-span-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Riverbank Court - A3" />
            </Field>
            <Field label="Category" required>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </Select>
            </Field>
          </div>

          <Field label="Description" required hint="Required for every category - what makes this unit worth what it costs.">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the unit's finish, layout, and standout features…" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Area / neighbourhood" required>
              <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Kilimani, Nairobi" />
            </Field>
            <Field label="Street address">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. Argwings Kodhek Rd" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Monthly rent (KES)" required>
              <Input type="number" min="0" value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} />
            </Field>
            <Field label="Deposit (KES)">
              <Input type="number" min="0" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Bedrooms">
              <Input type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
            </Field>
            <Field label="Bathrooms">
              <Input type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
            </Field>
            <Field label="Size (m²)">
              <Input type="number" min="0" value={form.sizeSqm} onChange={(e) => setForm({ ...form, sizeSqm: e.target.value })} />
            </Field>
          </div>

          <Field label="Amenities" hint="Comma-separated, e.g. Parking, Backup generator, CCTV">
            <Input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add property"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail / notes */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} subtitle={detail?.area} width="max-w-lg">
        {detail && (
          <div>
            <p className="text-sm text-ink-muted leading-relaxed">{detail.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{CATEGORY_LABELS[detail.category]}</Badge>
              <Badge status={detail.status} />
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] font-mono text-ink-muted">
                {formatKES(detail.monthlyRent)}/mo
              </span>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <CommentThread comments={detail.comments || []} onAdd={handleAddComment} />
            </div>
          </div>
        )}
      </Modal>

      {/* Add building with floors/units */}
      <Modal open={buildingOpen} onClose={() => setBuildingOpen(false)} title="Add building (floors)" subtitle="Describe each floor once - units like GA, GB, 1A, 1B are generated automatically." width="max-w-2xl">
        <form onSubmit={handleBuildingSubmit} className="space-y-4">
          {buildingError && <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{buildingError}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Building name" required>
              <Input value={buildingForm.buildingName} onChange={(e) => setBuildingForm({ ...buildingForm, buildingName: e.target.value })} placeholder="e.g. Riverbank Court" />
            </Field>
            <Field label="Area / neighbourhood" required>
              <Input value={buildingForm.area} onChange={(e) => setBuildingForm({ ...buildingForm, area: e.target.value })} placeholder="e.g. Kilimani, Nairobi" />
            </Field>
            <Field label="Street address">
              <Input value={buildingForm.address} onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })} />
            </Field>
            <Field label="Deposit (KES)" hint="Applied to every unit unless edited later">
              <Input type="number" min="0" value={buildingForm.deposit} onChange={(e) => setBuildingForm({ ...buildingForm, deposit: e.target.value })} />
            </Field>
            <Field label="Shared description" className="col-span-2" hint="Optional - falls back to 'Unit GA at Riverbank Court' if left blank">
              <Textarea rows={2} value={buildingForm.description} onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })} />
            </Field>
            <Field label="Amenities" className="col-span-2" hint="Comma-separated, shared across all units">
              <Input value={buildingForm.amenities} onChange={(e) => setBuildingForm({ ...buildingForm, amenities: e.target.value })} />
            </Field>
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-ink-muted">Floors</p>
              <Button type="button" variant="ghost" size="sm" onClick={addFloor}>
                <Plus size={13} /> Add floor
              </Button>
            </div>
            <div className="space-y-3">
              {buildingForm.floors.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface-raised p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink">
                      Floor {f.floorLabel || f.floorNumber} {f.unitsCount ? `→ units ${f.floorLabel}A–${f.floorLabel}${String.fromCharCode(64 + Number(f.unitsCount))}` : ""}
                    </p>
                    {buildingForm.floors.length > 1 && (
                      <button type="button" onClick={() => removeFloor(i)} className="text-ink-faint hover:text-rose transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    <Field label="Floor label" hint="G, 1, 2...">
                      <Input value={f.floorLabel} onChange={(e) => updateFloor(i, { floorLabel: e.target.value, floorNumber: e.target.value === "G" ? 0 : Number(e.target.value) || 0 })} />
                    </Field>
                    <Field label="Units on floor">
                      <Input type="number" min="1" max="26" value={f.unitsCount} onChange={(e) => updateFloor(i, { unitsCount: e.target.value })} />
                    </Field>
                    <Field label="Category">
                      <Select value={f.category} onChange={(e) => updateFloor(i, { category: e.target.value })}>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {CATEGORY_LABELS[c]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Bedrooms">
                      <Input type="number" min="0" value={f.bedrooms} onChange={(e) => updateFloor(i, { bedrooms: e.target.value })} />
                    </Field>
                    <Field label="Bathrooms">
                      <Input type="number" min="0" value={f.bathrooms} onChange={(e) => updateFloor(i, { bathrooms: e.target.value })} />
                    </Field>
                    <Field label="Rent (KES)" required>
                      <Input type="number" min="0" value={f.monthlyRent} onChange={(e) => updateFloor(i, { monthlyRent: e.target.value })} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setBuildingOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={buildingSaving}>
              {buildingSaving ? "Creating…" : "Create building & units"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this property?"
        body={`"${deleteTarget?.name}" and its notes will be permanently removed. This can't be undone.`}
      />
    </div>
  );
}

function UnitCard({ p, onNotes, onEdit, onDelete, onToggleDeactivate }) {
  const isDeactivated = p.status === "deactivated";
  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 shadow-panel transition-colors hover:border-signal/30 ${isDeactivated ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-ink truncate">{p.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
            <MapPin size={11} /> {p.area}
          </p>
          {p.unitCode && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-signal">
              <Building2 size={11} /> Unit {p.unitCode} · Floor {p.floorLabel}
            </p>
          )}
        </div>
        <WindowGrid status={p.status} />
      </div>

      <p className="mt-3 text-xs text-ink-muted line-clamp-2 leading-relaxed">{p.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{CATEGORY_LABELS[p.category]}</Badge>
        <Badge status={p.status} />
        {p.sizeSqm && (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
            <Ruler size={11} /> {p.sizeSqm} m²
          </span>
        )}
      </div>

      {isDeactivated && (
        <p className="mt-2 text-[11px] text-rose">Kept for reference only - hidden from balances, assignment, and occupancy figures.</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-sm font-semibold text-ink">{formatKES(p.monthlyRent)}<span className="text-ink-faint font-normal">/mo</span></span>
        <div className="flex items-center gap-1">
          <button onClick={() => onNotes(p)} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-raised hover:text-signal transition-colors" aria-label="Notes">
            <MessageSquare size={14} />
          </button>
          <button onClick={() => onEdit(p)} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-raised hover:text-ink transition-colors" aria-label="Edit">
            <Pencil size={14} />
          </button>
          {p.status !== "occupied" && (
            <button
              onClick={() => onToggleDeactivate(p)}
              className={`rounded-lg p-1.5 transition-colors ${isDeactivated ? "text-ink-faint hover:bg-signal/10 hover:text-signal" : "text-ink-faint hover:bg-amber/10 hover:text-amber"}`}
              aria-label={isDeactivated ? "Reactivate" : "Deactivate"}
              title={isDeactivated ? "Reactivate this unit" : "Deactivate this unit"}
            >
              <Power size={14} />
            </button>
          )}
          <button onClick={() => onDelete(p)} className="rounded-lg p-1.5 text-ink-faint hover:bg-rose/10 hover:text-rose transition-colors" aria-label="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Summary card for a whole building - counts by status instead of listing
// every unit, so a 30-unit building doesn't flood the grid.
function BuildingCard({ group, onView }) {
  const counts = { vacant: 0, occupied: 0, maintenance: 0 };
  let minRent = Infinity;
  let maxRent = 0;
  for (const u of group.units) {
    counts[u.status] = (counts[u.status] || 0) + 1;
    minRent = Math.min(minRent, u.monthlyRent);
    maxRent = Math.max(maxRent, u.monthlyRent);
  }

  return (
    <button
      onClick={onView}
      className="text-left rounded-2xl border border-border bg-surface p-4 shadow-panel transition-colors hover:border-signal/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-ink truncate flex items-center gap-1.5">
            <Layers size={13} className="text-signal" /> {group.buildingName}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
            <MapPin size={11} /> {group.area}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 text-[11px] font-semibold text-signal">
          {group.units.length} unit{group.units.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {counts.vacant > 0 && <Badge status="vacant">{counts.vacant} vacant</Badge>}
        {counts.occupied > 0 && <Badge status="occupied">{counts.occupied} occupied</Badge>}
        {counts.maintenance > 0 && <Badge status="maintenance">{counts.maintenance} maintenance</Badge>}
        {counts.deactivated > 0 && <Badge status="deactivated">{counts.deactivated} deactivated</Badge>}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-sm font-semibold text-ink">
          {formatKES(minRent)}{maxRent !== minRent ? ` – ${formatKES(maxRent)}` : ""}
          <span className="text-ink-faint font-normal">/mo</span>
        </span>
        <span className="text-xs font-medium text-signal">View units →</span>
      </div>
    </button>
  );
}
