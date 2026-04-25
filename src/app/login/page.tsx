"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setCargando(true);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuario,
        password
      })
    });

    const data = await response.json();

    setCargando(false);

    if (!response.ok || !data.ok) {
      setError(data.message || "Usuario o clave incorrectos.");
      return;
    }

    router.push(data.redirectTo || "/combinaciones");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E8F5EE] px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-[#DDE7E1] bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex justify-center">
            <Image
              src="/logo-agrokasa.png"
              alt="Agrokasa"
              width={210}
              height={80}
              priority
              className="h-auto w-52 object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-[#10231A]">
            Conteo de Flores
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ingresa tu usuario Agrokasa para continuar.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#10231A]">
              Usuario
            </label>

            <div className="flex overflow-hidden rounded-xl border border-[#DDE7E1] bg-white focus-within:border-[#0B7A3B] focus-within:ring-4 focus-within:ring-[#E8F5EE]">
              <div className="flex items-center px-3 text-slate-400">
                <User className="h-5 w-5" />
              </div>

              <input
                value={usuario}
                onChange={(event) => setUsuario(event.target.value)}
                className="h-12 min-w-0 flex-1 border-0 px-1 text-base outline-none"
                placeholder="Usuario"
                autoComplete="username"
                required
              />

              <div className="hidden items-center border-l border-[#DDE7E1] bg-[#E8F5EE] px-3 text-sm font-semibold text-[#0B7A3B] sm:flex">
                @agrokasa.com.pe
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500 sm:hidden">
              Dominio: @agrokasa.com.pe
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#10231A]">
              Clave
            </label>

            <div className="flex overflow-hidden rounded-xl border border-[#DDE7E1] bg-white focus-within:border-[#0B7A3B] focus-within:ring-4 focus-within:ring-[#E8F5EE]">
              <div className="flex items-center px-3 text-slate-400">
                <Lock className="h-5 w-5" />
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 min-w-0 flex-1 border-0 px-1 text-base outline-none"
                placeholder="Clave"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="button-primary w-full"
            disabled={cargando}
          >
            {cargando ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}