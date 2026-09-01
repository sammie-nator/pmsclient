import { useEffect, useMemo, useState } from "react";
import { Plus, Wrench, Trash2, MessageSquare, Clock, Wallet, Printer } from "lucide-react";
import api from "../lib/api";
import { timeAgo, formatKES, formatDate } from "../lib/format";
import { useActor } from "../context/ActorContext";
import PageHeader from "../components/PageHeader";
import Panel from "../components/Panel";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import CommentThread from "../components/CommentThread";
import { Field, Input, Select, Textarea } from "../components/FormField";

const EMPTY_FORM = { property: "", title: "", description: "", category: "other", priority: "medium" };
const EMPTY_PAYMENT = { estimatedCost: "", paidAmount: "", paymentMethod: "mpesa", vendor: "", reference: "" };

export default function MaintenancePage() {
  const { actor } = useActor();
  const isAdmin = actor?.role === "admin";
  // Recording expenses/receipts for maintenance work is finance territory -
  // agents can log and track issues, but only admin/frontdesk handle money.
  const isFinance = actor?.role === "admin" || actor?.role === "frontdesk";

  const [issues, setIssues] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState(EMPTY_PAYMENT);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api.get("/maintenance"), api.get("/properties")])
      .then(([mRes, pRes]) => {
        setIssues(mRes.data);
        setProperties(pRes.data);
      })
      .catch(() => setError("Could not load maintenance issues. Is the backend running?"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    return issues.filter((i) => (statusFilter ? i.status === statusFilter : true));
  }, [issues, statusFilter]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.property || !form.title || !form.description) {
      setFormError("Property, title, and description are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/maintenance", form);
      setIssues((prev) => [res.data, ...prev]);
      setFormOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.error || "Something went wrong logging this issue.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(issue, status) {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/maintenance/${issue._id}`, { status });
      setIssues((prev) => prev.map((i) => (i._id === res.data._id ? res.data : i)));
      if (detail?._id === issue._id) setDetail(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this issue.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  function openPayment(issue) {
    setPayTarget(issue);
    setPayForm({
      estimatedCost: issue.estimatedCost || "",
      paidAmount: issue.paidAmount || issue.estimatedCost || "",
      paymentMethod: issue.paymentMethod || "mpesa",
      vendor: issue.vendor || "",
      reference: issue.paymentReference || "",
    });
    setPayError("");
  }

  async function handlePayment(e) {
    e.preventDefault();
    setPayError("");
    if (!payForm.paidAmount) {
      setPayError("Enter the amount paid.");
      return;
    }
    setPaying(true);
    try {
      const res = await api.patch(`/maintenance/${payTarget._id}/payment`, {
        estimatedCost: payForm.estimatedCost ? Number(payForm.estimatedCost) : undefined,
        paidAmount: Number(payForm.paidAmount),
        paymentMethod: payForm.paymentMethod,
        reference: payForm.reference,
        vendor: payForm.vendor,
      });
      setIssues((prev) => prev.map((i) => (i._id === res.data._id ? res.data : i)));
      if (detail?._id === res.data._id) setDetail(res.data);
      setPayTarget(null);
    } catch (err) {
      setPayError(err.response?.data?.error || "Could not record this payment.");
    } finally {
      setPaying(false);
    }
  }

  function printExpenseReceipt(issue) {
    const win = window.open("", "_blank", "width=480,height=640");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Expense receipt - ${issue.title}</title>
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
          <p class="muted">Maintenance expense receipt</p>
          <table>
            <tr><td class="label">Issue</td><td>${issue.title}</td></tr>
            <tr><td class="label">Property</td><td>${issue.property?.name || "—"}</td></tr>
            <tr><td class="label">Category</td><td style="text-transform:capitalize">${issue.category}</td></tr>
            <tr><td class="label">Vendor / contractor</td><td>${issue.vendor || "—"}</td></tr>
            <tr><td class="label">Paid date</td><td>${issue.paidDate ? formatDate(issue.paidDate) : "—"}</td></tr>
            <tr><td class="label">Payment method</td><td style="text-transform:capitalize">${issue.paymentMethod || "—"}</td></tr>
            <tr><td class="label">Reference</td><td>${issue.paymentReference || "—"}</td></tr>
          </table>
          <div class="total">Amount paid: ${formatKES(issue.paidAmount || 0)}</div>
          <p class="muted" style="margin-top:4px;">Estimated cost: ${formatKES(issue.estimatedCost || 0)}</p>
          <p class="footer">Printed ${formatDate(new Date())} · NYUMBANI property management system.</p>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/maintenance/${deleteTarget._id}`);
      setIssues((prev) => prev.filter((i) => i._id !== deleteTarget._id));
      setDeleteTarget(null);
      if (detail?._id === deleteTarget._id) setDetail(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete this issue.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddComment(text) {
    const res = await api.post(`/maintenance/${detail._id}/comments`, { text });
    setDetail((prev) => ({ ...prev, comments: [...prev.comments, res.data] }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Upkeep"
        title="Maintenance"
        subtitle="Every open and resolved issue across the portfolio."
        action={
          <Button onClick={openCreate}>
            <Plus size={15} /> Log an issue
          </Button>
        }
      />

      <Panel bodyClassName="p-4" className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {["", "open", "in-progress", "resolved"].map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "border-signal/40 bg-signal/10 text-signal"
                  : "border-border bg-surface-raised text-ink-muted hover:text-ink"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </Panel>

      {loading && <p className="text-sm text-ink-faint">Loading maintenance issues…</p>}
      {error && <p className="text-sm text-rose">{error}</p>}
      {!loading && filtered.length === 0 && (
        <EmptyState icon={Wrench} title="No maintenance issues here" subtitle="Log an issue when something needs attention." />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((issue) => (
          <div key={issue._id} className="rounded-2xl border border-border bg-surface p-4 shadow-panel">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-ink truncate">{issue.title}</p>
                <p className="mt-0.5 text-xs text-ink-faint truncate">{issue.property?.name} · {issue.property?.area}</p>
              </div>
              <Badge status={issue.priority} />
            </div>

            <p className="mt-3 text-xs text-ink-muted line-clamp-2 leading-relaxed">{issue.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge tone="neutral">{issue.category}</Badge>
              <Badge status={issue.status}>{issue.status}</Badge>
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
                <Clock size={11} /> {timeAgo(issue.createdAt)}
              </span>
            </div>

            {(issue.estimatedCost > 0 || issue.paidAmount > 0) && (
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <Wallet size={12} className="text-ink-faint" />
                <span className={issue.paidAmount >= issue.estimatedCost && issue.paidAmount > 0 ? "text-signal" : "text-amber"}>
                  {formatKES(issue.paidAmount || 0)} paid{issue.estimatedCost ? ` of ${formatKES(issue.estimatedCost)}` : ""}
                </span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <Select
                value={issue.status}
                disabled={updatingStatus}
                onChange={(e) => updateStatus(issue, e.target.value)}
                className="w-auto text-xs py-1.5"
              >
                <option value="open">Open</option>
                <option value="in-progress">In progress</option>
                <option value="resolved">Resolved</option>
              </Select>
              <div className="flex items-center gap-1">
                {isFinance && (
                  <button onClick={() => openPayment(issue)} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-raised hover:text-signal transition-colors" aria-label="Record expense">
                    <Wallet size={14} />
                  </button>
                )}
                {isFinance && issue.paidAmount > 0 && (
                  <button onClick={() => printExpenseReceipt(issue)} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-raised hover:text-signal transition-colors" aria-label="Print receipt">
                    <Printer size={14} />
                  </button>
                )}
                <button onClick={() => setDetail(issue)} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-raised hover:text-signal transition-colors" aria-label="Notes">
                  <MessageSquare size={14} />
                </button>
                {isAdmin && (
                  <button onClick={() => setDeleteTarget(issue)} className="rounded-lg p-1.5 text-ink-faint hover:bg-rose/10 hover:text-rose transition-colors" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Log issue */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Log a maintenance issue" width="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{formError}</p>}
          <Field label="Property" required>
            <Select value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
              <option value="">Select a property…</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} · {p.area}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Kitchen tap leaking" />
          </Field>
          <Field label="Description" required>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's wrong, and anything the repair team should know…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="structural">Structural</option>
                <option value="appliance">Appliance</option>
                <option value="pest">Pest control</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Log issue"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail / notes */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title} subtitle={detail?.property?.name} width="max-w-lg">
        {detail && (
          <div>
            <p className="text-sm text-ink-muted leading-relaxed">{detail.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{detail.category}</Badge>
              <Badge status={detail.priority} />
              <Badge status={detail.status}>{detail.status}</Badge>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <CommentThread comments={detail.comments || []} onAdd={handleAddComment} />
            </div>
          </div>
        )}
      </Modal>

      {/* Record expense / receipt - finance only */}
      {isFinance && (
        <Modal open={!!payTarget} onClose={() => setPayTarget(null)} title="Record expense" subtitle={payTarget?.title} width="max-w-sm">
          <form onSubmit={handlePayment} className="space-y-4">
            {payError && <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{payError}</p>}
            <Field label="Estimated / billed cost (KES)">
              <Input type="number" min="0" value={payForm.estimatedCost} onChange={(e) => setPayForm({ ...payForm, estimatedCost: e.target.value })} />
            </Field>
            <Field label="Amount paid (KES)" required>
              <Input type="number" min="0" value={payForm.paidAmount} onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })} />
            </Field>
            <Field label="Vendor / contractor">
              <Input value={payForm.vendor} onChange={(e) => setPayForm({ ...payForm, vendor: e.target.value })} placeholder="e.g. Kamau Plumbing Services" />
            </Field>
            <Field label="Payment method">
              <Select value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Reference" hint="e.g. M-Pesa code">
              <Input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
            </Field>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setPayTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={paying}>
                {paying ? "Saving…" : "Save expense"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this issue?"
        body={`"${deleteTarget?.title}" and its notes will be permanently removed.`}
      />
    </div>
  );
}
