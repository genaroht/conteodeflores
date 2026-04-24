"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState
} from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  function remove(id: string) {
    setItems((actuales) => actuales.filter((item) => item.id !== id));
  }

  function toast(type: ToastType, message: string) {
    const id = crypto.randomUUID();

    setItems((actuales) => [
      ...actuales,
      {
        id,
        type,
        message
      }
    ]);

    setTimeout(() => remove(id), 3500);
  }

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast("success", message),
      error: (message) => toast("error", message),
      info: (message) => toast("info", message)
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {items.map((item) => {
          const Icon =
            item.type === "success"
              ? CheckCircle2
              : item.type === "error"
                ? XCircle
                : Info;

          const styles =
            item.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : item.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800";

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => remove(item.id)}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left text-sm font-semibold shadow-lg ${styles}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{item.message}</span>
            </button>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast debe usarse dentro de ToastProvider.");
  }

  return ctx;
}