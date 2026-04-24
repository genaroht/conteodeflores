"use client";

import { ReactNode } from "react";

import { SessionTimeout } from "@/components/ui/SessionTimeout";
import { ToastProvider } from "@/components/ui/ToastProvider";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      <SessionTimeout />
      {children}
    </ToastProvider>
  );
}