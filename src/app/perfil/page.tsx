"use client";

import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/ToastProvider";

export default function PerfilPage() {
  const toast = useToast();

  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cambiarClave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setGuardando(true);

    const response = await fetch("/api/perfil/password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        claveActual,
        claveNueva,
        confirmarClave
      })
    });

    const data = await response.json();

    setGuardando(false);

    if (!response.ok) {
      toast.error(data.message || "No se pudo cambiar la clave.");
      return;
    }

    toast.success("Clave actualizada correctamente.");

    setClaveActual("");
    setClaveNueva("");
    setConfirmarClave("");
  }

  return (
    <AppShell title="Mi clave">
      <div className="mx-auto max-w-xl space-y-6">
        <section className="card-base">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F5EE] text-[#0B7A3B]">
              <KeyRound className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-[#10231A]">
                Cambiar mi clave
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Actualiza tu contraseña de acceso al sistema.
              </p>
            </div>
          </div>
        </section>

        <section className="card-base">
          <form className="space-y-4" onSubmit={cambiarClave}>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10231A]">
                Clave actual
              </label>

              <input
                type="password"
                className="input-base"
                value={claveActual}
                onChange={(event) => setClaveActual(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#10231A]">
                Nueva clave
              </label>

              <input
                type="password"
                className="input-base"
                value={claveNueva}
                onChange={(event) => setClaveNueva(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#10231A]">
                Confirmar nueva clave
              </label>

              <input
                type="password"
                className="input-base"
                value={confirmarClave}
                onChange={(event) => setConfirmarClave(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="button-primary w-full"
              disabled={guardando}
            >
              {guardando ? "Guardando..." : "Guardar nueva clave"}
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}