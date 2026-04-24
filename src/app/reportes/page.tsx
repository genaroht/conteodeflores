"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";

type Lote = {
  id: string;
  nombre: string;
};

type Sector = {
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
    total: number;
  };
};

export default function ReportesPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [variedades, setVariedades] = useState<Variedad[]>([]);

  const [semana, setSemana] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loteId, setLoteId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [variedadId, setVariedadId] = useState("");
  const [planta, setPlanta] = useState("");

  const [data, setData] = useState<ReporteResponse | null>(null);
  const [page, setPage] = useState(1);

  async function cargarCombos(loteSeleccionado?: string) {
    const [lotesRes, variedadesRes] = await Promise.all([
      fetch("/api/lotes?pageSize=500", { cache: "no-store" }),
      fetch("/api/variedades?pageSize=500", { cache: "no-store" })
    ]);

    setLotes((await lotesRes.json()).items || []);
    setVariedades((await variedadesRes.json()).items || []);

    const query = new URLSearchParams();
    query.set("pageSize", "500");

    if (loteSeleccionado) {
      query.set("loteId", loteSeleccionado);
    }

    const sectoresRes = await fetch(`/api/sectores?${query.toString()}`, {
      cache: "no-store"
    });

    setSectores((await sectoresRes.json()).items || []);
  }

  async function cargarReportes(pagina = page) {
    const query = new URLSearchParams();

    query.set("page", String(pagina));
    query.set("pageSize", "20");

    if (semana) query.set("semana", semana);
    if (fechaDesde) query.set("fechaDesde", fechaDesde);
    if (fechaHasta) query.set("fechaHasta", fechaHasta);
    if (loteId) query.set("loteId", loteId);
    if (sectorId) query.set("sectorId", sectorId);
    if (variedadId) query.set("variedadId", variedadId);
    if (planta) query.set("planta", planta);

    const response = await fetch(`/api/reportes?${query.toString()}`, {
      cache: "no-store"
    });

    const json = await response.json();

    setData(json);
  }

  useEffect(() => {
    cargarCombos();
    cargarReportes(1);
  }, []);

  useEffect(() => {
    cargarReportes(page);
  }, [page]);

  async function buscar() {
    setPage(1);
    await cargarReportes(1);
  }

  async function cambiarLote(value: string) {
    setLoteId(value);
    setSectorId("");
    await cargarCombos(value);
  }

  return (
    <AppShell title="Reportes">
      <div className="space-y-6">
        <section className="card-base">
          <h1 className="text-2xl font-black text-[#10231A]">Reportes</h1>

          <p className="mt-1 text-sm text-slate-500">
            Filtra y revisa los registros de conteo.
          </p>
        </section>

        <section className="card-base">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
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

            <select
              className="input-base"
              value={loteId}
              onChange={(event) => cambiarLote(event.target.value)}
            >
              <option value="">Lote</option>
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
              <option value="">Sector</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.nombre}
                </option>
              ))}
            </select>

            <select
              className="input-base"
              value={variedadId}
              onChange={(event) => setVariedadId(event.target.value)}
            >
              <option value="">Variedad</option>
              {variedades.map((variedad) => (
                <option key={variedad.id} value={variedad.id}>
                  {variedad.nombre}
                </option>
              ))}
            </select>

            <input
              className="input-base"
              value={planta}
              onChange={(event) => setPlanta(event.target.value)}
              placeholder="Planta"
            />

            <button type="button" className="button-primary" onClick={buscar}>
              <Search className="mr-2 h-5 w-5" />
              Buscar
            </button>
          </div>
        </section>

        {data ? (
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="card-base">
              <p className="text-sm font-bold text-[#0B7A3B]">Total FC</p>
              <p className="mt-2 text-3xl font-black">{data.resumen.fc}</p>
            </div>

            <div className="card-base">
              <p className="text-sm font-bold text-[#0B7A3B]">Total FA</p>
              <p className="mt-2 text-3xl font-black">{data.resumen.fa}</p>
            </div>

            <div className="card-base">
              <p className="text-sm font-bold text-[#0B7A3B]">Total</p>
              <p className="mt-2 text-3xl font-black">{data.resumen.total}</p>
            </div>
          </section>
        ) : null}

        <section className="card-base overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
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
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>

            <tbody>
              {data?.items.map((item) => (
                <tr key={item.id} className="border-t border-[#DDE7E1]">
                  <td className="px-4 py-3">Semana {item.semana}</td>
                  <td className="px-4 py-3">
                    {new Date(item.fecha).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3">{item.lote}</td>
                  <td className="px-4 py-3">{item.sector}</td>
                  <td className="px-4 py-3">{item.variedad}</td>
                  <td className="px-4 py-3">{item.planta}</td>
                  <td className="px-4 py-3">{item.fc}</td>
                  <td className="px-4 py-3">{item.fa}</td>
                  <td className="px-4 py-3 font-bold">{item.total}</td>
                </tr>
              ))}

              {data?.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
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