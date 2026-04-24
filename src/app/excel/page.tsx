"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { ExportExcelButton } from "@/components/excel/ExportExcelButton";
import { ImportExcelForm } from "@/components/excel/ImportExcelForm";
import { AppShell } from "@/components/layout/AppShell";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

type Importacion = {
  id: string;
  archivoNombre: string;
  estado: "IMPORTADO" | "ELIMINADO" | "ERROR";
  filasProcesadas: number;
  filasImportadas: number;
  filasConError: number;
  createdAt: string;
  createdBy?: {
    usuario: string;
    nombre: string;
  } | null;
};

type SessionApi = {
  session?: {
    id: string;
    usuario: string;
    nombre: string;
    rol: string;
  } | null;
};

type DeleteTarget = {
  id: string;
  modo: "normal" | "hard";
} | null;

export default function ExcelPage() {
  const toast = useToast();

  const [rol, setRol] = useState("");
  const [items, setItems] = useState<Importacion[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [eliminando, setEliminando] = useState(false);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const esAdmin = rol === "ADMIN";

  const exportHref = useMemo(() => {
    const query = new URLSearchParams();

    if (fechaDesde) {
      query.set("fechaDesde", fechaDesde);
    }

    if (fechaHasta) {
      query.set("fechaHasta", fechaHasta);
    }

    const qs = query.toString();

    return qs ? `/api/excel/exportar?${qs}` : "/api/excel/exportar";
  }, [fechaDesde, fechaHasta]);

  async function cargarSession() {
    const response = await fetch("/api/session", {
      cache: "no-store"
    });

    const data: SessionApi = await response.json();

    setRol(data.session?.rol || "");
  }

  async function cargarImportaciones(pagina = page) {
    const query = new URLSearchParams();

    query.set("page", String(pagina));
    query.set("pageSize", String(pageSize));

    const response = await fetch(`/api/excel/importaciones?${query.toString()}`, {
      cache: "no-store"
    });

    const data = await response.json();

    setItems(data.items || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
  }

  useEffect(() => {
    cargarSession();
  }, []);

  useEffect(() => {
    cargarImportaciones(page);
  }, [page]);

  async function eliminarCarga() {
    if (!deleteTarget) return;

    setEliminando(true);

    const hardQuery = deleteTarget.modo === "hard" ? "?hard=1" : "";

    const response = await fetch(
      `/api/excel/importaciones/${deleteTarget.id}${hardQuery}`,
      {
        method: "DELETE"
      }
    );

    const data = await response.json();

    setEliminando(false);

    if (!response.ok) {
      toast.error(data.message || "No se pudo eliminar.");
      return;
    }

    toast.success(data.message || "Eliminado correctamente.");
    setDeleteTarget(null);
    cargarImportaciones(page);
  }

  const itemSeleccionado = items.find((item) => item.id === deleteTarget?.id);

  return (
    <AppShell title="Excel">
      <div className="space-y-6">
        <section className="card-base">
          <h1 className="text-2xl font-black text-[#10231A]">Excel</h1>

          <p className="mt-1 text-sm text-slate-500">
            Descarga plantilla, importa registros, revisa historial y elimina cargas importadas.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a href="/api/excel/plantilla" className="button-secondary">
              Descargar plantilla
            </a>
          </div>
        </section>

        <section className="card-base">
          <h2 className="text-lg font-black text-[#10231A]">
            Exportar registros por fecha
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Selecciona un rango de fechas para descargar los registros.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#10231A]">
                Fecha desde
              </label>

              <input
                type="date"
                className="input-base"
                value={fechaDesde}
                onChange={(event) => setFechaDesde(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#10231A]">
                Fecha hasta
              </label>

              <input
                type="date"
                className="input-base"
                value={fechaHasta}
                onChange={(event) => setFechaHasta(event.target.value)}
              />
            </div>

            <div className="flex items-end">
              <ExportExcelButton href={exportHref} label="Exportar registros" />
            </div>
          </div>
        </section>

        <ImportExcelForm onImported={() => cargarImportaciones(1)} />

        <section className="card-base">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#10231A]">
                Historial de importaciones
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total de registros: {total}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#E8F5EE] text-[#0B7A3B]">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Archivo</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Procesadas</th>
                  <th className="px-4 py-3">Importadas</th>
                  <th className="px-4 py-3">Errores</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-[#DDE7E1]">
                    <td className="px-4 py-3">
                      {new Date(item.createdAt).toLocaleString("es-PE")}
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {item.archivoNombre}
                    </td>

                    <td className="px-4 py-3">
                      {item.createdBy?.nombre || "-"}
                    </td>

                    <td className="px-4 py-3">{item.filasProcesadas}</td>
                    <td className="px-4 py-3">{item.filasImportadas}</td>
                    <td className="px-4 py-3">{item.filasConError}</td>

                    <td className="px-4 py-3">
                      <span
                        className={
                          item.estado === "IMPORTADO"
                            ? "rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700"
                            : item.estado === "ERROR"
                              ? "rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700"
                              : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                        }
                      >
                        {item.estado}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {esAdmin ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              id: item.id,
                              modo: "hard"
                            })
                          }
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Borrar historial
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={item.estado === "ELIMINADO"}
                          onClick={() =>
                            setDeleteTarget({
                              id: item.id,
                              modo: "normal"
                            })
                          }
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar carga
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {items.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-slate-500"
                      colSpan={8}
                    >
                      Todavía no hay importaciones registradas.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Página {page} de {totalPages}
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
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((actual) => Math.min(actual + 1, totalPages))
                }
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.modo === "hard"
            ? "¿Seguro que deseas borrar este historial?"
            : "¿Seguro que deseas eliminar esta carga?"
        }
        description={
          deleteTarget?.modo === "hard"
            ? `ADMIN borrará definitivamente el historial del archivo ${
                itemSeleccionado?.archivoNombre || "seleccionado"
              }. Si tenía conteos importados, se eliminarán esos conteos. Los lotes, sectores, variedades y plantas se mantendrán.`
            : itemSeleccionado?.estado === "ERROR"
              ? `Se eliminará el registro de error del archivo ${
                  itemSeleccionado?.archivoNombre || "seleccionado"
                }. No hay conteos cargados.`
              : `Se eliminarán todos los conteos importados desde ${
                  itemSeleccionado?.archivoNombre || "este Excel"
                }. Los lotes, sectores, variedades y plantas se mantendrán.`
        }
        confirmText={
          deleteTarget?.modo === "hard" ? "Borrar historial" : "Eliminar carga"
        }
        cancelText="Cancelar"
        danger
        loading={eliminando}
        onClose={() => setDeleteTarget(null)}
        onConfirm={eliminarCarga}
      />
    </AppShell>
  );
}