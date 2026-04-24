"use client";

import { AlertTriangle } from "lucide-react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onClose
}: ConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              danger ? "bg-red-50 text-red-600" : "bg-[#E8F5EE] text-[#0B7A3B]"
            }`}
          >
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-black text-[#10231A]">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="button-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={
              danger
                ? "inline-flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-base font-bold text-white hover:bg-red-700 disabled:opacity-60"
                : "button-primary"
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}