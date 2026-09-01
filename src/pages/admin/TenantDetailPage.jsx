import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Home, Phone, Mail, IdCard, Briefcase, Users2, Pencil, Trash2, ArrowRightLeft, Printer, UserX } from "lucide-react";
import api from "../../lib/api";
import { formatDate, formatKES } from "../../lib/format";
import { useActor } from "../../context/ActorContext";
import Panel from "../../components/Panel";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import CommentThread from "../../components/CommentThread";
import { Field, Input, Select } from "../../components/FormField";

export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { actor } = useActor();
  const isAdmin = actor?.role === "admin";
  const basePath = `/${actor?.role || "admin"}/tenants`;
  const [tenant, setTenant] = useState(null);
  const [bills, setBills] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTo, setMoveTo] = useState("");
  const [moveDate, setMoveDate] = useState("");
  const [moving, setMoving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.get(`/tenants/${id}`), api.get("/billing", { params: { tenant: id } }), api.get("/properties")])
      .then(([tRes, bRes, pRes]) => {
        setTenant(tRes.data);
        setBills(bRes.data);
        setProperties(pRes.data);
      })
      .catch(() => setError("Could not load this tenant."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  function openEdit() {
    setEditForm({
      fullName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email || "",
      idNumber: tenant.idNumber || "",
      occupation: tenant.occupation || "",
      emergencyContactName: tenant.emergencyContactName || "",
      emergencyContactPhone: tenant.emergencyContactPhone || "",
      occupants: tenant.occupants || 1,
      leaseEndDate: tenant.leaseEndDate ? tenant.leaseEndDate.slice(0, 10) : "",
      status: tenant.status,
    });
    setEditOpen(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch(`/tenants/${id}`, { ...editForm, occupants: Number(editForm.occupants) || 1 });
      setTenant(res.data);
      setEditOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(e) {
    e.preventDefault();
    setMoving(true);
    try {
      const res = await api.patch(`/tenants/${id}`, {
        property: moveTo || null,
        moveInDate: moveDate || new Date().toISOString(),
      });
      setTenant(res.data);
      setMoveOpen(false);
      setMoveTo("");
      setMoveDate("");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not reassign this tenant.");
    } finally {
      setMoving(false);
    }
  }

  function printReceipt(bill) {
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) return;

    const unitLabel = tenant.property
      ? tenant.property.unitCode
        ? `${tenant.property.unitCode} · ${tenant.property.buildingName}`
        : tenant.property.name
      : "—";

    win.document.write(`
      <html>
        <head>
          <title>Receipt - ${tenant.fullName}</title>
          <style>
            body { font-family: -apple-system, Segoe UI, Arial, sans-serif; color: #111; padding: 28px; }
            h1 { font-size: 18px; margin: 0 0 2px; }
            .muted { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td { padding: 6px 0; font-size: 13px; vertical-align: top; }
            td.label { color: #666; width: 42%; }
            .total { margin-top: 18px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 16px; font-weight: 700; }
            .footer { margin-top: 28px; font-size: 11px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <h1>NYUMBANI Property Management</h1>
          <p class="muted">Payment receipt${bill.invoiceNumber ? ` · ${bill.invoiceNumber}` : ""}</p>
          <table>
            <tr><td class="label">Tenant</td><td>${tenant.fullName}</td></tr>
            <tr><td class="label">Phone</td><td>${tenant.phone}</td></tr>
            <tr><td class="label">Unit</td><td>${unitLabel}</td></tr>
            <tr><td class="label">Payment type</td><td style="text-transform:capitalize">${bill.type}${bill.billingPeriod ? " · " + bill.billingPeriod : ""}</td></tr>
            <tr><td class="label">Due date</td><td>${formatDate(bill.dueDate)}</td></tr>
            <tr><td class="label">Paid date</td><td>${bill.paidDate ? formatDate(bill.paidDate) : "—"}</td></tr>
            <tr><td class="label">Payment method</td><td style="text-transform:capitalize">${bill.paymentMethod || "—"}</td></tr>
            <tr><td class="label">Reference</td><td>${bill.reference || "—"}</td></tr>
            <tr><td class="label">Status</td><td style="text-transform:capitalize">${bill.status}</td></tr>
          </table>
          <div class="total">Amount paid: ${formatKES(bill.paidAmount || 0)}</div>
          <p class="muted" style="margin-top:4px;">Billed amount: ${formatKES(bill.amount)}</p>
          <p class="footer">Printed ${formatDate(new Date())} · This receipt was generated by the NYUMBANI property management system.</p>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  async function handleAddComment(text) {
    const res = await api.post(`/tenants/${id}/comments`, { text });
    setTenant((prev) => ({ ...prev, comments: [...prev.comments, res.data] }));
  }

  async function handleDeactivate(e) {
    e.preventDefault();
    setDeactivating(true);
    try {
      const res = await api.patch(`/tenants/${id}/deactivate`, { reason: deactivateReason });
      setTenant(res.data);
      setDeactivateOpen(false);
      setDeactivateReason("");
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not deactivate this tenant.");
    } finally {
      setDeactivating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/tenants/${id}`);
      navigate(basePath);
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete this tenant.");
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-faint">Loading tenant…</p>;
  if (error && !tenant) return <p className="text-sm text-rose">{error}</p>;
  if (!tenant) return null;

  const vacantProperties = properties.filter((p) => p.status === "vacant" || p._id === tenant.property?._id);

  return (
    <div>
      <Link to={basePath} className="mb-5 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink transition-colors">
        <ArrowLeft size={13} /> Back to tenants
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised border border-border text-lg font-display font-bold text-ink">
            {tenant.fullName[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{tenant.fullName}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge status={tenant.status} />
              <span className="text-xs text-ink-faint">Tenant since {tenant.history?.[0]?.startDate ? formatDate(tenant.history[0].startDate) : "—"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMoveOpen(true)}>
            <ArrowRightLeft size={13} /> Reassign
          </Button>
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil size={13} /> Edit
          </Button>
          {isAdmin && tenant.status !== "former" && (
            <Button variant="amber" size="sm" onClick={() => setDeactivateOpen(true)}>
              <UserX size={13} /> Deactivate
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      </div>

      {tenant.status === "former" && (
        <div className="mb-5 rounded-xl border border-amber/25 bg-amber/10 px-4 py-2.5 text-xs text-amber">
          This tenant has vacated and is no longer assigned to a unit. This record is only visible to admins.
        </div>
      )}

      {error && <p className="mb-4 text-sm text-rose">{error}</p>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Panel title="Contact & personal details">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailRow icon={Phone} label="Phone" value={tenant.phone} />
              <DetailRow icon={Mail} label="Email" value={tenant.email || "—"} />
              <DetailRow icon={IdCard} label="ID / passport" value={tenant.idNumber || "—"} />
              <DetailRow icon={Briefcase} label="Occupation" value={tenant.occupation || "—"} />
              <DetailRow icon={Users2} label="Occupants" value={tenant.occupants} />
              <DetailRow
                icon={Home}
                label="Current unit"
                value={
                  tenant.property
                    ? tenant.property.unitCode
                      ? `${tenant.property.unitCode} · ${tenant.property.buildingName}`
                      : tenant.property.name
                    : "Unassigned"
                }
              />
              <DetailRow label="Emergency contact" value={tenant.emergencyContactName || "—"} />
              <DetailRow label="Emergency phone" value={tenant.emergencyContactPhone || "—"} />
              <DetailRow label="Lease ends" value={tenant.leaseEndDate ? formatDate(tenant.leaseEndDate) : "—"} />
            </div>
          </Panel>

          <Panel title="Tenancy history" subtitle="Every property this tenant has occupied">
            {tenant.history.length === 0 && <p className="text-xs text-ink-faint">No history recorded yet.</p>}
            <div className="space-y-3">
              {[...tenant.history].reverse().map((h, i) => (
                <div key={h._id || i} className="relative rounded-xl border border-border bg-surface-raised px-4 py-3 pl-6">
                  <span className={`absolute left-2.5 top-4 h-2 w-2 rounded-full ${h.endDate ? "bg-ink-faint" : "bg-signal shadow-[0_0_6px_rgba(34,230,197,0.7)]"}`} />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{h.propertyName || h.property?.name || "Unknown unit"}</p>
                    {!h.endDate && <Badge tone="signal">Current</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {formatDate(h.startDate)} — {h.endDate ? formatDate(h.endDate) : "present"}
                    {h.monthlyRentAtTime ? ` · ${formatKES(h.monthlyRentAtTime)}/mo` : ""}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Billing history">
            {bills.length === 0 && <p className="text-xs text-ink-faint">No invoices for this tenant yet.</p>}
            <div className="space-y-2">
              {bills.map((b) => (
                <div key={b._id} className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-ink capitalize">{b.type} {b.billingPeriod && `· ${b.billingPeriod}`}</p>
                      {b.invoiceNumber && <span className="font-mono text-[11px] text-ink-faint">{b.invoiceNumber}</span>}
                    </div>
                    <p className="text-xs text-ink-faint">Due {formatDate(b.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-ink">{formatKES(b.amount)}</p>
                      <Badge status={b.status} className="mt-1" />
                    </div>
                    {b.paidAmount > 0 && (
                      <button
                        onClick={() => printReceipt(b)}
                        className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-raised hover:text-signal transition-colors"
                        aria-label="Print receipt"
                        title="Print receipt"
                      >
                        <Printer size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Notes & comments">
          <CommentThread comments={tenant.comments || []} onAdd={handleAddComment} />
        </Panel>
      </div>

      {/* Edit modal */}
      {editForm && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit tenant" width="max-w-xl">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" required>
                <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
              </Field>
              <Field label="Phone" required>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </Field>
              <Field label="ID / passport number">
                <Input value={editForm.idNumber} onChange={(e) => setEditForm({ ...editForm, idNumber: e.target.value })} />
              </Field>
              <Field label="Occupation">
                <Input value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} />
              </Field>
              <Field label="Occupants">
                <Input type="number" min="1" value={editForm.occupants} onChange={(e) => setEditForm({ ...editForm, occupants: e.target.value })} />
              </Field>
              <Field label="Emergency contact name">
                <Input value={editForm.emergencyContactName} onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })} />
              </Field>
              <Field label="Emergency contact phone">
                <Input value={editForm.emergencyContactPhone} onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })} />
              </Field>
              <Field label="Lease end date">
                <Input type="date" value={editForm.leaseEndDate} onChange={(e) => setEditForm({ ...editForm, leaseEndDate: e.target.value })} />
              </Field>
              <Field label="Status" hint="Use the Deactivate button above to mark a tenant as vacated.">
                <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} disabled={editForm.status === "former"}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  {editForm.status === "former" && <option value="former">Former (vacated)</option>}
                </Select>
              </Field>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reassign modal */}
      <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title="Reassign property" subtitle="Closes out the current unit and opens a new history entry." width="max-w-sm">
        <form onSubmit={handleMove} className="space-y-4">
          <Field label="New property">
            <Select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
              <option value="">— Move out (no property) —</option>
              {vacantProperties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.unitCode ? `${p.unitCode} · ${p.buildingName}` : p.name} · {p.area}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Effective date">
            <Input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
          </Field>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={moving}>
              {moving ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate (vacate) modal */}
      <Modal open={deactivateOpen} onClose={() => setDeactivateOpen(false)} title="Deactivate tenant" subtitle="Frees up their unit as vacant. Their record is kept, but only admins can view it afterwards." width="max-w-sm">
        <form onSubmit={handleDeactivate} className="space-y-4">
          <Field label="Reason for leaving (optional)">
            <Input value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} placeholder="e.g. Lease ended, relocated…" />
          </Field>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDeactivateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="amber" disabled={deactivating}>
              {deactivating ? "Deactivating…" : "Deactivate"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this tenant?"
        body="This removes their profile, history, and notes permanently."
      />
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-faint">
        {Icon && <Icon size={11} />} {label}
      </p>
      <p className="mt-0.5 text-ink">{value}</p>
    </div>
  );
}
