"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { EvolucionChart, type EvolucionItem } from "@/components/reportes/EvolucionChart";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { formatearFechaEsPe } from "@/lib/fecha";

type Lote = {
  id: string;
  nombre: string;
};

type Variedad = {
  id: string;
  nombre: string;
};

type ReporteItem = {
  id: string;
  semana: number;
  fecha: string;
  lote: string;
  sector: string;
  variedad: string;
  planta: string;
  fc: number;
  fa: number;
  cuaja: number;
  total: number;
};

type ReporteResponse = {
  items: ReporteItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  resumen: {
    fc: number;
    fa: number;
    cuaja: number;
    total: number;
  };
  evolucion: EvolucionItem[];
};

export default function ReportesPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [variedades, setVariedades] = useState<Variedad[]>([]);

  const [semana, setSemana] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loteId, setLoteId] = useState("");
  const [variedadId, setVariedadId] = useState("");

  const [data, setData] = useState<ReporteResponse | null>(null);
  const [page, setPage] = useState(1);

  async function cargarCombos() {
    const [lotesRes, variedadesRes] = await Promise.all([
      fetch("/api/lotes?pageSize=500", { cache: "no-store" }),
      fetch("/api/variedades?pageSize=500", { cache: "no-store" })
    ]);

    const lotesData = await lotesRes.json();
    const variedadesData = await variedadesRes.json();

    setLotes(lotesData.items || []);
    setVariedades(variedadesData.items || []);
  }

  async function cargarReportes(pagina = page) {
    const query = new URLSearchParams();

    query.set("page", String(pagina));
    query.set("pageSize", "20");

    if (semana) query.set("semana", semana);
    if (fechaDesde) query.set("fechaDesde", fechaDesde);
    if (fechaHasta) query.set("fechaHasta", fechaHasta);
    if (loteId) query.set("loteId", loteId);
    if (variedadId) query.set("variedadId", variedadId);

    const response = await fetch(`/api/reportes?${query.toString()}`, {
      cache: "no-store"
    });

    const json = await response.json();

    setData(json);
  }

  useEffect(() => {
    cargarCombos();
    cargarReportes(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarReportes(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function buscar() {
    setPage(1);
    await cargarReportes(1);
  }

  return (
    <AppShell title="Reportes">
      <div className="space-y-6">
        <section className="card-base">
          <h1 className="text-2xl font-black text-[#10231A]">Reportes</h1>

          <p className="mt-1 text-sm text-slate-500">
            Filtra según semana, lote, variedad y fechas.
          </p>
        </section>

        <section className="card-base">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              className="input-base"
              value={semana}
              onChange={(event) => setSemana(event.target.value)}
              placeholder="Semana"
              type="number"
            />

            <input
              className="input-base"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
              type="date"
            />

            <input
              className="input-base"
              value={fechaHasta}
              onChange={(event) => setFechaHasta(event.target.value)}
              type="date"
            />

            <SearchableSelect
              value={loteId}
              onChange={setLoteId}
              options={lotes}
              placeholder="Todos los lotes"
              numericSort
            />

            <SearchableSelect
              value={variedadId}
              onChange={setVariedadId}
              options={variedades}
              placeholder="Todas las variedades"
              numericSort={false}
            />

            <button type="button" className="button-primary" onClick={buscar}>
              <Search className="mr-2 h-5 w-5" />
              Buscar
            </button>
          </div>
        </section>

        {data ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card-base">
              <p className="text-sm font-bold text-[#0B7A3B]">Total FC</p>
              <p className="mt-2 text-3xl font-black">{data.resumen.fc}</p>
            </div>

            <div className="card-base">
              <p className="text-sm font-bold text-[#0B7A3B]">Total FA</p>
              <p className="mt-2 text-3xl font-black">{data.resumen.fa}</p>
            </div>

            <div className="card-base">
              <p className="text-sm font-bold text-[#0B7A3B]">Total Cuaja</p>
              <p className="mt-2 text-3xl font-black">{data.resumen.cuaja}</p>
            </div>

            <div className="card-base">
              <p className="text-sm font-bold text-[#0B7A3B]">Total</p>
              <p className="mt-2 text-3xl font-black">
                {data.resumen.total}
              </p>
            </div>
          </section>
        ) : null}

        {data ? (
          <section className="card-base">
            <EvolucionChart data={data.evolucion || []} />
          </section>
        ) : null}

        <section className="card-base overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#E8F5EE] text-[#0B7A3B]">
              <tr>
                <th className="px-4 py-3">Semana</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Variedad</th>
                <th className="px-4 py-3">Planta</th>
                <th className="px-4 py-3">FC</th>
                <th className="px-4 py-3">FA</th>
                <th className="px-4 py-3">Cuaja</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>

            <tbody>
              {data?.items.map((item) => (
                <tr key={item.id} className="border-t border-[#DDE7E1]">
                  <td className="px-4 py-3">Semana {item.semana}</td>
                  <td className="px-4 py-3">
                    {formatearFechaEsPe(item.fecha)}
                  </td>
                  <td className="px-4 py-3">{item.lote}</td>
                  <td className="px-4 py-3">{item.sector}</td>
                  <td className="px-4 py-3">{item.variedad}</td>
                  <td className="px-4 py-3">{item.planta}</td>
                  <td className="px-4 py-3">{item.fc}</td>
                  <td className="px-4 py-3">{item.fa}</td>
                  <td className="px-4 py-3">{item.cuaja}</td>
                  <td className="px-4 py-3 font-bold">{item.total}</td>
                </tr>
              ))}

              {data?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No hay registros para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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