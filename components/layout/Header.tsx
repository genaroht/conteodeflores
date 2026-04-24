"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import type { AppSession } from "@/lib/session";

type HeaderProps = {
  session: AppSession;
  title: string;
};

export function Header({ session, title }: HeaderProps) {
  const router = useRouter();

  async function cerrarSesion() {
    await fetch("/api/logout", {
      method: "POST"
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-borde bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-agrokasa.png"
            alt="Agrokasa"
            width={120}
            height={45}
            className="h-auto w-28 object-contain lg:hidden"
            priority
          />

          <div>
            <h1 className="hidden text-xl font-bold text-texto sm:block">
              {title}
            </h1>

            <p className="hidden text-sm text-slate-500 sm:block">
              {session.nombre}
            </p>
          </div>
        </div>

        <button
          onClick={cerrarSesion}
          className="button-secondary min-h-10 px-3 py-2 text-sm"
          type="button"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Salir
        </button>
      </div>
    </header>
  );
}