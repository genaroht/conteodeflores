"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

type DashboardItem = {
  id: string;
  semana: number;
  lote: string;
  sector: string;
  variedad: string;
  fc: number;
  fa: number;
};

type DashboardResponse = {
  anio: number;
  semana: number;
  items: DashboardItem[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [anio, setAnio] = useState("");
  const [semana, setSemana] = useState("");
  const [cargando, setCargando] = useState(false);

  async function cargarDashboard(params?: { anio?: string; semana?: string }) {
    setCargando(true);

    const query = new URLSearchParams();

    if (params?.anio) query.set("anio", params.anio);
    if (params?.semana) query.set("semana", params.semana);

    const response = await fetch(`/api/dashboard?${query.toString()}`, {
      cache: "no-store"
    });

    const json = await response.json();

    setData(json);
    setAnio(String(json.anio));
    setSemana(String(json.semana));
    setCargando(false);
  }

  useEffect(() => {
    cargarDashboard();
  }, []);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <section className="card-base">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#0B7A3B]">
                Dashboard
              </p>

              <h1 className="mt-1 text-2xl font-black text-[#10231A] sm:text-3xl">
                Conteo por semana
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Totales de FC y FA agrupados por lote, sector y variedad.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[120px_120px_auto]">
              <input
                className="input-base"
                value={anio}
                onChange={(event) => setAnio(event.target.value)}
                placeholder="Año"
                type="number"
              />

              <input
                className="input-base"
                value={semana}
                onChange={(event) => setSemana(event.target.value)}
                placeholder="Semana"
                type="number"
              />

              <button
                type="button"
                className="button-primary"
                onClick={() => cargarDashboard({ anio, semana })}
                disabled={cargando}
              >
                <Search className="mr-2 h-5 w-5" />
                Filtrar
              </button>
            </div>
          </div>
        </section>

        {data && data.items.length === 0 ? (
          <div className="card-base text-center">
            <p className="font-bold text-[#10231A]">
              No hay registros para esta semana.
            </p>
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.items.map((item) => (
            <DashboardCard
              key={item.id}
              semana={item.semana}
              lote={item.lote}
              sector={item.sector}
              variedad={item.variedad}
              fc={item.fc}
              fa={item.fa}
            />
          ))}
        </section>
      </div>
    </AppShell>
  );
}