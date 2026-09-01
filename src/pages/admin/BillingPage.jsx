import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Wallet, MessageSquare } from "lucide-react";
import api from "../../lib/api";
import { formatDate, formatKES } from "../../lib/format";
import { useActor } from "../../context/ActorContext";
import PageHeader from "../../components/PageHeader";
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import EmptyState from "../../components/EmptyState";
import CommentThread from "../../components/CommentThread";
import { Field, Input, Select } from "../../components/FormField";

const EMPTY_FORM = { tenant: "", type: "rent", billingPeriod: "", amount: "", dueDate: "", paymentMethod: "", reference: "" };

export default function BillingPage() {
  const { actor } = useActor();
  const isAdmin = actor?.role === "admin";
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantQuery, setTenantQuery] = useState("");
  const [tenantResults, setTenantResults] = useState([]);
  const [tenantSearching, setTenantSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("mpesa");
  const [payRef, setPayRef] = useState("");
  const [paying, setPaying] = useState(false);

  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/billing")
      .then((res) => setBills(res.data))
      .catch(() => setError("Could not load billing records. Is the backend running?"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  // Debounced tenant typeahead - only fires once someone's actually typed
  // something, so we never pull the full tenant list just to fill a dropdown.
  useEffect(() => {
    if (!tenantQuery.trim()) {
      setTenantResults([]);
      return;
    }
    setTenantSearching(true);
    const handle = setTimeout(() => {
      api
        .get("/tenants", { params: { search: tenantQuery.trim(), limit: 10 } })
        .then((res) => setTenantResults(res.data))
        .catch(() => setTenantResults([]))
        .finally(() => setTenantSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [tenantQuery]);

  function pickTenant(t) {
    setSelectedTenant(t);
    setForm({ ...form, tenant: t._id });
    setTenantQuery("");
    setTenantResults([]);
  }

  const filtered = useMemo(() => {
    return bills.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.tenant?.fullName?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [bills, statusFilter, search]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setSelectedTenant(null);
    setTenantQuery("");
    setTenantResults([]);
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.tenant || !form.amount || !form.dueDate) {
      setFormError("Tenant, amount, and due date are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/billing", { ...form, amount: Number(form.amount) });
      setBills((prev) => [res.data, ...prev]);
      setFormOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.error || "Something went wrong creating this invoice.");
    } finally {
      setSaving(false);
    }
  }

  function openPay(bill) {
    setPayTarget(bill);
    setPayAmount(String(bill.amount - bill.paidAmount));
    setPayMethod(bill.paymentMethod || "mpesa");
    setPayRef("");
  }

  async function handlePay(e) {
    e.preventDefault();
    setPaying(true);
    try {
      const newPaid = (payTarget.paidAmount || 0) + Number(payAmount || 0);
      const res = await api.patch(`/billing/${payTarget._id}`, {
        paidAmount: newPaid,
        paymentMethod: payMethod,
        reference: payRef || payTarget.reference,
      });
      setBills((prev) => prev.map((b) => (b._id === res.data._id ? res.data : b)));
      setPayTarget(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not record this payment.");
    } finally {
      setPaying(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/billing/${deleteTarget._id}`);
      setBills((prev) => prev.filter((b) => b._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete this record.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddComment(text) {
    const res = await api.post(`/billing/${detail._id}/comments`, { text });
    setDetail((prev) => ({ ...prev, comments: [...prev.comments, res.data] }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Money"
        title="Billing"
        subtitle="Rent, deposits, and utility invoices, in Kenyan Shillings."
        action={
          <Button onClick={openCreate}>
            <Plus size={15} /> New invoice
          </Button>
        }
      />

      <Panel bodyClassName="p-4" className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input placeholder="Search by tenant name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>
      </Panel>

      {loading && <p className="text-sm text-ink-faint">Loading billing records…</p>}
      {error && <p className="text-sm text-rose">{error}</p>}
      {!loading && filtered.length === 0 && <EmptyState icon={Wallet} title="No invoices match those filters" />}

      <Panel bodyClassName="p-0">
        <div className="divide-y divide-border">
          {filtered.map((b) => (
            <div key={b._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">{b.tenant?.fullName || "Unknown tenant"}</p>
                  {b.invoiceNumber && <span className="font-mono text-[11px] text-ink-faint">{b.invoiceNumber}</span>}
                </div>
                <p className="text-xs text-ink-faint">
                  {b.property?.name} · <span className="capitalize">{b.type}</span> {b.billingPeriod && `· ${b.billingPeriod}`}
                </p>
              </div>
              <div className="text-xs text-ink-faint">Due {formatDate(b.dueDate)}</div>
              <div className="text-right">
                <p className="font-mono text-sm text-ink">{formatKES(b.amount)}</p>
                {b.paidAmount > 0 && b.status !== "paid" && (
                  <p className="text-[11px] text-ink-faint">{formatKES(b.paidAmount)} paid</p>
                )}
              </div>
              <Badge status={b.status} />
              <div className="flex items-center gap-1">
                {b.status !== "paid" && (
                  <Button variant="outline" size="sm" onClick={() => openPay(b)}>
                    Record payment
                  </Button>
                )}
                <button onClick={() => setDetail(b)} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-raised hover:text-signal transition-colors" aria-label="Notes">
                  <MessageSquare size={14} />
                </button>
                {isAdmin && (
                  <button onClick={() => setDeleteTarget(b)} className="rounded-lg p-1.5 text-ink-faint hover:bg-rose/10 hover:text-rose transition-colors" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Create invoice */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="New invoice" width="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{formError}</p>}
          <Field label="Tenant" required hint="Search by name, phone, or email">
            {selectedTenant ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm">
                <div>
                  <p className="text-ink">{selectedTenant.fullName}</p>
                  <p className="text-xs text-ink-faint">
                    {selectedTenant.phone} {selectedTenant.property ? `· ${selectedTenant.property.name}` : "· No unit assigned"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTenant(null);
                    setForm({ ...form, tenant: "" });
                  }}
                  className="text-xs font-medium text-signal hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  value={tenantQuery}
                  onChange={(e) => setTenantQuery(e.target.value)}
                  placeholder="Type a name, phone, or email…"
                  autoComplete="off"
                />
                {(tenantSearching || tenantResults.length > 0) && tenantQuery && (
                  <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-border bg-surface shadow-panel">
                    {tenantSearching && <p className="px-3 py-2 text-xs text-ink-faint">Searching…</p>}
                    {!tenantSearching &&
                      tenantResults.map((t) => (
                        <button
                          type="button"
                          key={t._id}
                          onClick={() => pickTenant(t)}
                          className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-surface-raised transition-colors"
                        >
                          <span className="text-ink">{t.fullName}</span>
                          <span className="text-xs text-ink-faint">
                            {t.phone} {t.property ? `· ${t.property.name}` : "· No unit assigned"}
                          </span>
                        </button>
                      ))}
                    {!tenantSearching && tenantResults.length === 0 && (
                      <p className="px-3 py-2 text-xs text-ink-faint">No tenants matched.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="rent">Rent</option>
                <option value="deposit">Deposit</option>
                <option value="utility">Utility</option>
                <option value="penalty">Penalty</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Billing period" hint="e.g. 2026-07">
              <Input value={form.billingPeriod} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })} placeholder="2026-07" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (KES)" required>
              <Input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="Due date" required>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create invoice"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record payment */}
      <Modal open={!!payTarget} onClose={() => setPayTarget(null)} title="Record payment" subtitle={payTarget?.tenant?.fullName} width="max-w-sm">
        <form onSubmit={handlePay} className="space-y-4">
          <Field label="Amount received (KES)" required>
            <Input type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          </Field>
          <Field label="Payment method">
            <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="mpesa">M-Pesa</option>
              <option value="bank">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Reference" hint="e.g. M-Pesa code">
            <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder={payTarget?.reference} />
          </Field>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setPayTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={paying}>
              {paying ? "Saving…" : "Record payment"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Notes */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Invoice notes" subtitle={detail?.tenant?.fullName} width="max-w-md">
        {detail && <CommentThread comments={detail.comments || []} onAdd={handleAddComment} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this invoice?"
        body="This billing record will be permanently removed."
      />
    </div>
  );
}
