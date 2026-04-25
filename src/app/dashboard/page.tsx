"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AppShell } from "@/components/layout/AppShell";

type Lote = {
  id: string;
  nombre: string;
};

type Sector = {
  id: string;
  nombre: string;
};

type UsuarioFiltro = {
  id: string;
  nombre: string;
  usuario: string;
};

type DashboardItem = {
  id: string;
  semana: number;
  lote: string;
  sector: string;
  variedad: string;
  fc: number;
  fa: number;
  registradoPor: string;
};

type DashboardResponse = {
  anio: number;
  semana: number;
  items: DashboardItem[];
  usuariosFiltro: UsuarioFiltro[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardResponse | null>(null);

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [usuariosFiltro, setUsuariosFiltro] = useState<UsuarioFiltro[]>([]);

  const [anio, setAnio] = useState("");
  const [semana, setSemana] = useState("");
  const [loteId, setLoteId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");

  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(false);

  async function cargarCombos(loteSeleccionado?: string) {
    const lotesRes = await fetch("/api/lotes?pageSize=500", {
      cache: "no-store"
    });

    const lotesData = await lotesRes.json();
    setLotes(lotesData.items || []);

    const query = new URLSearchParams();
    query.set("pageSize", "500");

    if (loteSeleccionado) {
      query.set("loteId", loteSeleccionado);
    }

    const sectoresRes = await fetch(`/api/sectores?${query.toString()}`, {
      cache: "no-store"
    });

    const sectoresData = await sectoresRes.json();
    setSectores(sectoresData.items || []);
  }

  async function cargarDashboard(pagina = page) {
    setCargando(true);

    const query = new URLSearchParams();

    if (anio) query.set("anio", anio);
    if (semana) query.set("semana", semana);
    if (loteId) query.set("loteId", loteId);
    if (sectorId) query.set("sectorId", sectorId);
    if (usuarioId) query.set("usuarioId", usuarioId);

    query.set("page", String(pagina));
    query.set("pageSize", "9");

    const response = await fetch(`/api/dashboard?${query.toString()}`, {
      cache: "no-store"
    });

    if (response.status === 403) {
      setCargando(false);
      router.replace("/combinaciones");
      return;
    }

    const json = await response.json();

    setData(json);
    setAnio(String(json.anio));
    setSemana(String(json.semana));
    setUsuariosFiltro(json.usuariosFiltro || []);
    setCargando(false);
  }

  useEffect(() => {
    cargarCombos();
    cargarDashboard(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarDashboard(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function aplicarFiltro() {
    setPage(1);
    await cargarDashboard(1);
  }

  async function cambiarLote(value: string) {
    setLoteId(value);
    setSectorId("");
    await cargarCombos(value);
  }

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <section className="card-base">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#0B7A3B]">
                Dashboard
              </p>

              <h1 className="mt-1 text-2xl font-black text-[#10231A] sm:text-3xl">
                Conteo por semana
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Filtra por semana, lote, sector y usuario que registró.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[8rem_8rem_1fr_1fr_1fr_auto]">
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
                required
              />

              <select
                className="input-base"
                value={loteId}
                onChange={(event) => cambiarLote(event.target.value)}
              >
                <option value="">Todos los lotes</option>
                {lotes.map((lote) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.nombre}
                  </option>
                ))}
              </select>

              <select
                className="input-base"
                value={sectorId}
                onChange={(event) => setSectorId(event.target.value)}
              >
                <option value="">Todos los sectores</option>
                {sectores.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.nombre}
                  </option>
                ))}
              </select>

              <select
                className="input-base"
                value={usuarioId}
                onChange={(event) => setUsuarioId(event.target.value)}
              >
                <option value="">Todos los usuarios</option>
                {usuariosFiltro.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre || usuario.usuario}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="button-primary"
                onClick={aplicarFiltro}
                disabled={cargando || !semana}
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
            <p className="mt-1 text-sm text-slate-500">
              Cambia los filtros o registra conteos para visualizar información.
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
              registradoPor={item.registradoPor}
            />
          ))}
        </section>

        {data ? (
          <section className="card-base flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Página {data.page} de {data.totalPages} · Total: {data.total}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                className="button-secondary"
                disabled={page <= 1}
                onClick={() => setPage((actual) => Math.max(actual - 1, 1))}
              >
                Anterior
              </button>

              <button
                type="button"
                className="button-secondary"
                disabled={page >= data.totalPages}
                onClick={() =>
                  setPage((actual) => Math.min(actual + 1, data.totalPages))
                }
              >
                Siguiente
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}