import { useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { timeAgo } from "../lib/format";
import { useActor } from "../context/ActorContext";
import Button from "./Button";
import { Textarea } from "./FormField";

const ROLE_LABEL = { admin: "Admin", agent: "Agent", frontdesk: "Front desk" };

export default function CommentThread({ comments = [], onAdd, disabled }) {
  const { actor } = useActor();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
        <MessageSquare size={13} /> Notes &amp; comments
      </div>

      <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-1">
        {comments.length === 0 && <p className="text-xs text-ink-faint">No notes yet.</p>}
        {[...comments].reverse().map((c, i) => (
          <div key={c._id || i} className="rounded-xl border border-border bg-surface-raised px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink">{c.authorName || "Unknown"}</span>
              <span className="text-[10px] text-ink-faint">
                {ROLE_LABEL[c.authorRole] || c.authorRole} · {timeAgo(c.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted whitespace-pre-wrap">{c.text}</p>
          </div>
        ))}
      </div>

      {!disabled && (
        <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
          <Textarea
            rows={2}
            placeholder={`Add a note as ${actor?.name || "yourself"}…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!text.trim() || submitting} className="shrink-0">
            <Send size={13} />
          </Button>
        </form>
      )}
    </div>
  );
}
