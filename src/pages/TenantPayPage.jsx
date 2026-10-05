import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Smartphone, CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import { formatKES, CATEGORY_LABELS } from "../lib/format";
import Button from "../components/Button";

/**
 * Public tenant payment page — no staff login required.
 * Uses existing backend routes only:
 *   GET  /api/public/properties
 *   POST /api/public/mpesa/stk
 *   GET  /api/public/mpesa/status/:paymentId
 */
export default function TenantPayPage() {
  const [buildings, setBuildings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [building, setBuilding] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [paymentId, setPaymentId] = useState(null);
  const [payStatus, setPayStatus] = useState(null); // pending | success | failed | cancelled
  const [statusMsg, setStatusMsg] = useState("");
  const [receipt, setReceipt] = useState("");

  useEffect(() => {
    setLoadingUnits(true);
    api
      .get("/public/properties")
      .then((res) => {
        setBuildings(res.data.buildings || []);
        setProperties(res.data.properties || []);
      })
      .catch(() => setLoadError("Could not load units. Please try again later."))
      .finally(() => setLoadingUnits(false));
  }, []);

  const unitsForBuilding = useMemo(() => {
    if (!building) return properties;
    return properties.filter((p) => (p.buildingName || p.name) === building);
  }, [properties, building]);

  const selectedUnit = useMemo(
    () => properties.find((p) => p._id === propertyId) || null,
    [properties, propertyId]
  );

  // When unit changes, prefill amount with monthly rent if empty / previous rent
  useEffect(() => {
    if (selectedUnit?.monthlyRent != null) {
      setAmount(String(selectedUnit.monthlyRent));
    }
  }, [selectedUnit?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll STK status while pending
  useEffect(() => {
    if (!paymentId || !payStatus || payStatus !== "pending") return undefined;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await api.get(`/public/mpesa/status/${paymentId}`);
        if (cancelled) return;
        setPayStatus(res.data.status);
        setStatusMsg(res.data.resultDesc || "");
        if (res.data.mpesaReceipt) setReceipt(res.data.mpesaReceipt);
      } catch {
        // keep polling; network blips are fine
      }
    };

    tick();
    const id = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [paymentId, payStatus]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!propertyId) {
      setFormError("Select your unit.");
      return;
    }
    const amt = Math.round(Number(amount));
    if (!amt || amt < 1) {
      setFormError("Enter a valid amount (at least 1 KES).");
      return;
    }
    if (!phone.trim()) {
      setFormError("Enter the M-Pesa phone number that will receive the prompt.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/public/mpesa/stk", {
        propertyId,
        phone: phone.trim(),
        amount: amt,
      });
      setPaymentId(res.data.paymentId);
      setPayStatus("pending");
      setStatusMsg(res.data.message || "STK push sent. Check your phone.");
      setReceipt("");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Could not start M-Pesa payment. Try again.";
      // 409 = already pending for this unit+phone
      if (err.response?.status === 409 && err.response?.data?.paymentId) {
        setPaymentId(err.response.data.paymentId);
        setPayStatus("pending");
        setStatusMsg(msg);
      } else {
        setFormError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setPaymentId(null);
    setPayStatus(null);
    setStatusMsg("");
    setReceipt("");
    setFormError("");
  }

  const unitLabel = (p) => {
    const code = p.unitCode || p.floorLabel || "";
    const cat = CATEGORY_LABELS[p.category] || p.category || "";
    const parts = [code, cat].filter(Boolean);
    return parts.length ? parts.join(" · ") : p.name;
  };

  return (
    <div className="min-h-screen bg-base bg-grid flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-signal/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-signal/30 bg-signal/10 text-signal shadow-glow">
            <Building2 size={22} strokeWidth={2.25} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Pay rent</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Select your unit, enter an amount, and confirm on your phone via M-Pesa.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border bg-surface p-5 shadow-panel"
        >
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink transition-colors"
          >
            <ArrowLeft size={12} /> Back to sign-in
          </Link>

          {loadingUnits && (
            <p className="flex items-center gap-2 text-sm text-ink-faint">
              <Loader2 size={14} className="animate-spin" /> Loading units…
            </p>
          )}
          {loadError && <p className="text-sm text-rose">{loadError}</p>}

          {/* Success / pending / failed result panel */}
          {paymentId && payStatus && (
            <div className="space-y-4">
              {payStatus === "pending" && (
                <div className="rounded-xl border border-signal/30 bg-signal/10 px-4 py-5 text-center">
                  <Loader2 size={28} className="mx-auto mb-3 animate-spin text-signal" />
                  <p className="text-sm font-semibold text-ink">Waiting for M-Pesa</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {statusMsg || "Check your phone and enter your M-Pesa PIN."}
                  </p>
                  <p className="mt-3 text-[11px] text-ink-faint">This page updates automatically.</p>
                </div>
              )}

              {payStatus === "success" && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-5 text-center">
                  <CheckCircle2 size={28} className="mx-auto mb-3 text-emerald-400" />
                  <p className="text-sm font-semibold text-ink">Payment successful</p>
                  {receipt && (
                    <p className="mt-1 font-mono text-xs text-ink-muted">Receipt: {receipt}</p>
                  )}
                  {selectedUnit && (
                    <p className="mt-2 text-xs text-ink-faint">
                      {selectedUnit.buildingName || selectedUnit.name}
                      {selectedUnit.unitCode ? ` · ${selectedUnit.unitCode}` : ""} ·{" "}
                      {formatKES(amount)}
                    </p>
                  )}
                </div>
              )}

              {(payStatus === "failed" || payStatus === "cancelled") && (
                <div className="rounded-xl border border-rose/30 bg-rose/10 px-4 py-5 text-center">
                  <XCircle size={28} className="mx-auto mb-3 text-rose" />
                  <p className="text-sm font-semibold text-ink">
                    {payStatus === "cancelled" ? "Payment cancelled" : "Payment failed"}
                  </p>
                  {statusMsg && <p className="mt-1 text-xs text-ink-muted">{statusMsg}</p>}
                </div>
              )}

              {payStatus !== "pending" && (
                <Button className="w-full" onClick={resetForm}>
                  Make another payment
                </Button>
              )}
              {payStatus === "pending" && (
                <Button variant="ghost" className="w-full" onClick={resetForm}>
                  Cancel and start over
                </Button>
              )}
            </div>
          )}

          {/* Payment form */}
          {!paymentId && !loadingUnits && !loadError && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
                  {formError}
                </p>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Building</label>
                <select
                  value={building}
                  onChange={(e) => {
                    setBuilding(e.target.value);
                    setPropertyId("");
                  }}
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-signal/60 focus:ring-1 focus:ring-signal/30"
                >
                  <option value="">All buildings</option>
                  {buildings.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Unit <span className="text-rose">*</span>
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-signal/60 focus:ring-1 focus:ring-signal/30"
                >
                  <option value="">Select your unit…</option>
                  {unitsForBuilding.map((p) => (
                    <option key={p._id} value={p._id}>
                      {unitLabel(p)}
                      {p.area ? ` — ${p.area}` : ""}
                      {p.monthlyRent != null ? ` (${formatKES(p.monthlyRent)}/mo)` : ""}
                    </option>
                  ))}
                </select>
                {selectedUnit && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    {selectedUnit.name}
                    {selectedUnit.description ? ` · ${selectedUnit.description.slice(0, 80)}` : ""}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Amount (KES) <span className="text-rose">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  required
                  className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-signal/60 focus:ring-1 focus:ring-signal/30"
                />
                <p className="mt-1 text-[11px] text-ink-faint">
                  You can pay any amount. Monthly rent is suggested when you pick a unit.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  M-Pesa phone number <span className="text-rose">*</span>
                </label>
                <div className="relative">
                  <Smartphone
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX or 2547XXXXXXXX"
                    required
                    className="w-full rounded-lg border border-border bg-surface-raised pl-9 pr-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-signal/60 focus:ring-1 focus:ring-signal/30"
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-faint">
                  The STK prompt will be sent to this number.
                </p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Sending prompt…
                  </>
                ) : (
                  "Pay with M-Pesa"
                )}
              </Button>
            </form>
          )}
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-ink-faint px-2">
          Powered by M-Pesa. You will be asked to enter your PIN on your phone.
        </p>
      </div>
    </div>
  );
}
