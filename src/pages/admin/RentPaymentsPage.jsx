import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import api from "../../lib/api";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

export default function RentPaymentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api
      .get("/payments", { params: { status: "success" } })
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Could not load payments."))
      .finally(() => setLoading(false));
  }, []);

  async function downloadCsv() {
    setExporting(true);
    try {
      const res = await api.get("/payments/export.csv", {
        params: { status: "success" },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rent-payments.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download CSV.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Rent payments"
        subtitle="Successful M-Pesa STK payments from the public pay page."
        action={
          <Button onClick={downloadCsv} disabled={exporting || rows.length === 0}>
            <Download size={15} />
            {exporting ? "Downloading…" : "Download CSV"}
          </Button>
        }
      />

      {loading && <p className="text-sm text-ink-faint">Loading…</p>}
      {error && <p className="text-sm text-rose mb-3">{error}</p>}
      {!loading && rows.length === 0 && (
        <EmptyState title="No successful payments yet" subtitle="STK payments will appear here." />
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-faint">
                <th className="p-3">Date</th>
                <th className="p-3">Building</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id} className="border-b border-border">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">{p.buildingName || "—"}</td>
                  <td className="p-3">{p.unitCode || p.propertyName}</td>
                  <td className="p-3 font-mono">KES {Number(p.amount).toLocaleString()}</td>
                  <td className="p-3">{p.phone}</td>
                  <td className="p-3 font-mono text-xs">{p.mpesaReceipt || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
