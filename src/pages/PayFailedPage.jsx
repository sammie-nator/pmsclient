import { Link, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import Button from "../components/Button";

export default function PayFailedPage() {
  const [params] = useSearchParams();
  const reason = params.get("reason") || "Payment was not completed.";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-base">
      <div className="max-w-md w-full rounded-2xl border border-border bg-surface p-6 text-center shadow-panel">
        <XCircle className="mx-auto text-rose-500" size={48} />
        <h1 className="mt-4 font-display text-xl font-bold text-ink">Payment failed</h1>
        <p className="mt-2 text-sm text-ink-muted">{reason}</p>
        <Link to="/pay" className="inline-block mt-6">
          <Button>Try again</Button>
        </Link>
      </div>
    </div>
  );
}
