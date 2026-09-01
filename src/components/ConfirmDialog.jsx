import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({ open, onClose, onConfirm, title = "Are you sure?", body, confirmLabel = "Delete", danger = true, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      {body && <p className="text-sm text-ink-muted">{body}</p>}
      <div className="mt-5 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? "danger" : "primary"} size="sm" onClick={onConfirm} disabled={loading}>
          {loading ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
