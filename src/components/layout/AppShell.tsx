"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import type { AppSession } from "@/lib/session";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  const router = useRouter();
  const [session, setSession] = useState<AppSession | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarSession() {
      const response = await fetch("/api/session", {
        cache: "no-store"
      });

      const data = await response.json();

      if (!data.session) {
        router.push("/login");
        return;
      }

      setSession(data.session);
      setCargando(false);
    }

    cargarSession();
  }, [router]);

  if (cargando || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7F6] px-4">
        <div className="rounded-3xl border border-[#DDE7E1] bg-white p-6 text-center shadow-lg">
          <p className="text-sm font-semibold text-[#0B7A3B]">
            Cargando sistema...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F6]">
      <Sidebar session={session} />

      <div className="min-h-screen lg:pl-72">
        <Header session={session} title={title} />

        <main className="page-container mobile-safe-bottom">{children}</main>
      </div>

      <MobileNav rol={session.rol} />
    </div>
  );
}