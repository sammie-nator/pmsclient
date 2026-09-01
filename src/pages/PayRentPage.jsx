import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import api from "../lib/api";
import Button from "../components/Button";
import { Field, Input, Select } from "../components/FormField";

export default function PayRentPage() {
  const [buildings, setBuildings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [building, setBuilding] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [status, setStatus] = useState(null); // pending | success | failed | cancelled
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    api
      .get("/public/properties")
      .then((res) => {
        setBuildings(res.data.buildings || []);
        setProperties(res.data.properties || []);
      })
      .catch(() => setError("Could not load properties. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  const unitsInBuilding = useMemo(() => {
    if (!building) return [];
    return properties.filter((p) => (p.buildingName || p.name) === building);
  }, [building, properties]);

  const selectedUnit = useMemo(
    () => properties.find((p) => p._id === propertyId),
    [properties, propertyId]
  );

  useEffect(() => {
    if (selectedUnit) {
      setAmount(String(selectedUnit.monthlyRent ?? ""));
    }
  }, [selectedUnit]);

  // Poll payment status after STK
  useEffect(() => {
    if (!paymentId || status === "success" || status === "failed" || status === "cancelled") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await api.get(`/public/mpesa/status/${paymentId}`);
        if (cancelled) return;
        setStatus(res.data.status);
        if (res.data.status === "success") {
          setStatusMsg(
            res.data.mpesaReceipt
              ? `Paid. M-Pesa receipt: ${res.data.mpesaReceipt}`
              : "Payment successful."
          );
        } else if (res.data.status === "failed" || res.data.status === "cancelled") {
          setStatusMsg(res.data.resultDesc || "Payment was not completed.");
        }
      } catch {
        // ignore transient errors
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [paymentId, status]);

  async function handlePay(e) {
    e.preventDefault();
    setError("");
    setStatusMsg("");
    if (!propertyId) {
      setError("Select a house and room.");
      return;
    }
    if (!phone) {
      setError("Enter the M-Pesa phone number.");
      return;
    }
    setSubmitting(true);
    setStatus("pending");
    try {
      const res = await api.post("/public/mpesa/stk", {
        propertyId,
        phone,
        amount: amount ? Number(amount) : undefined,
      });
      setPaymentId(res.data.paymentId);
      setStatusMsg(res.data.message || "STK push sent. Enter your M-Pesa PIN on your phone.");
    } catch (err) {
      setStatus(null);
      setPaymentId(null);
      setError(err.response?.data?.error || "Could not start M-Pesa payment.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setPaymentId(null);
    setStatus(null);
    setStatusMsg("");
    setError("");
  }

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
            Select your house and room, then pay with M-Pesa STK Push.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-panel">
          {loading ? (
            <p className="text-sm text-ink-faint">Loading houses…</p>
          ) : status === "success" ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
              <p className="font-display font-semibold text-ink">Payment received</p>
              <p className="text-sm text-ink-muted">{statusMsg}</p>
              <Button variant="outline" onClick={reset} className="mt-2">
                Pay another
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-4">
              {error && (
                <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{error}</p>
              )}

              <Field label="House / building" required>
                <Select
                  value={building}
                  onChange={(e) => {
                    setBuilding(e.target.value);
                    setPropertyId("");
                  }}
                  disabled={!!paymentId}
                >
                  <option value="">Select house…</option>
                  {buildings.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Room / unit" required>
                <Select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  disabled={!building || !!paymentId}
                >
                  <option value="">Select room…</option>
                  {unitsInBuilding.map((u) => (
                    <option key={u._id} value={u._id}>
                      {(u.unitCode || u.name) +
                        (u.monthlyRent != null ? ` — KES ${Number(u.monthlyRent).toLocaleString()}` : "")}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Amount (KES)" hint="Defaults to monthly rent; you can change it.">
                <Input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!!paymentId}
                />
              </Field>

              <Field label="M-Pesa phone number" required hint="e.g. 07XXXXXXXX">
                <div className="relative">
                  <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <Input
                    className="pl-10"
                    inputMode="tel"
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!!paymentId}
                  />
                </div>
              </Field>

              {paymentId && status === "pending" && (
                <div className="flex items-start gap-2 rounded-lg border border-signal/30 bg-signal/10 px-3 py-2 text-xs text-ink">
                  <Loader2 size={14} className="mt-0.5 animate-spin shrink-0" />
                  <span>{statusMsg || "Waiting for you to complete the prompt on your phone…"}</span>
                </div>
              )}

              {(status === "failed" || status === "cancelled") && (
                <p className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">
                  {statusMsg || "Payment failed."}{" "}
                  <button type="button" className="underline" onClick={reset}>
                    Try again
                  </button>
                </p>
              )}

              {!paymentId && (
                <Button type="submit" className="w-full" disabled={submitting || !propertyId || !phone}>
                  {submitting ? "Sending STK…" : "Pay with M-Pesa"}
                </Button>
              )}
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-ink-faint">
          Staff?{" "}
          <Link to="/" className="text-signal hover:underline">
            Sign in to Nyumbani OS
          </Link>
        </p>
      </div>
    </div>
  );
}
