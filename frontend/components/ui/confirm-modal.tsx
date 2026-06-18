"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ConfirmModal({ open, onOpenChange, title = "Tem certeza que deseja continuar?", description = "Essa acao nao podera ser desfeita", onConfirm, confirmLabel = "Continuar", cancelLabel = "Cancelar" }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <Modal title={title} open={open} onOpenChange={onOpenChange}>
      <p className="text-sm text-muted">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
