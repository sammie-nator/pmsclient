import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Button from "../components/Button";

export default function PaySuccessPage() {
  const [params] = useSearchParams();
  const receipt = params.get("receipt") || "";
  const amount = params.get("amount") || "";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-base">
      <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-6 text-center shadow-panel">
        <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
        <h1 className="mt-4 font-display text-xl font-bold text-ink">Payment successful</h1>
        <p className="mt-2 text-sm text-ink-muted">Thank you. Your rent payment was received.</p>
        {amount && <p className="mt-3 font-mono text-sm">KES {Number(amount).toLocaleString()}</p>}
        {receipt && <p className="mt-1 text-xs text-ink-faint">M-Pesa receipt: {receipt}</p>}
        <Link to="/pay" className="inline-block mt-6">
          <Button variant="outline">Pay another</Button>
        </Link>
      </div>
    </div>
  );
}
