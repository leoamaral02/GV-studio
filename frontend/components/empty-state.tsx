import { Inbox } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background p-6 text-center text-muted">
      <Inbox className="mb-3 text-faded" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
