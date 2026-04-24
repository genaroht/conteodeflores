"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

type Combinacion = {
  id: string;
  fecha: string;
  semana: {
    numero: number;
    anio: number;
  };
  lote: {
    nombre: string;
  };
  sector: {
    nombre: string;
  };
  variedad: {
    nombre: string;
  };
  _count: {
    conteos: number;
  };
};

export default function CombinacionesPage() {
  const toast = useToast();

  const [items, setItems] = useState<Combinacion[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function cargar(pagina = page) {
    const query = new URLSearchParams();

    query.set("page", String(pagina));
    query.set("pageSize", "10");
    query.set("exact", "1");

    if (q.trim()) {
      query.set("q", q.trim());
    }

    const response = await fetch(`/api/combinaciones?${query.toString()}`, {
      cache: "no-store"
    });

    const data = await response.json();

    setItems(data.items || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
  }

  useEffect(() => {
    cargar(page);
  }, [page]);

  async function buscar() {
    setPage(1);
    await cargar(1);
  }

  async function eliminar() {
    if (!deleteId) return;

    setDeleting(true);

    const response = await fetch(`/api/combinaciones/${deleteId}`, {
      method: "DELETE"
    });

    const data = await response.json();

    setDeleting(false);

    if (!response.ok) {
      toast.error(data.message || "No se pudo eliminar.");
      return;
    }

    toast.success(data.message || "Combinación eliminada.");
    setDeleteId(null);
    cargar(page);
  }

  const seleccionado = items.find((item) => item.id === deleteId);

  return (
    <AppShell title="Combinaciones">
      <div className="space-y-6">
        <section className="card-base">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#10231A]">
                Combinaciones
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Consulta combinaciones, registra conteos o elimina registros permitidos.
              </p>
            </div>

            <Link href="/combinaciones/nueva" className="button-primary">
              <Plus className="mr-2 h-5 w-5" />
              Nueva combinación
            </Link>
          </div>
        </section>

        <section className="card-base">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="input-base"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Buscar lote, sector o variedad"
            />

            <button type="button" className="button-primary" onClick={buscar}>
              <Search className="mr-2 h-5 w-5" />
              Buscar
            </button>
          </div>
        </section>

        <section className="card-base overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[#E8F5EE] text-[#0B7A3B]">
              <tr>
                <th className="px-4 py-3">Semana</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Variedad</th>
                <th className="px-4 py-3">Conteos</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-[#DDE7E1]">
                  <td className="px-4 py-3 font-bold">
                    Semana {item.semana.numero}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(item.fecha).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3">{item.lote.nombre}</td>
                  <td className="px-4 py-3">{item.sector.nombre}</td>
                  <td className="px-4 py-3">{item.variedad.nombre}</td>
                  <td className="px-4 py-3">{item._count.conteos}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/combinaciones/${item.id}/conteos`}
                        className="button-secondary min-h-10 px-3 py-2 text-sm"
                      >
                        Registrar conteos
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeleteId(item.id)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    No hay combinaciones para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="card-base flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Página {page} de {totalPages} · Total: {total}
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
        </section>
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="¿Seguro que deseas eliminar esta combinación?"
        description={`Se eliminará la combinación ${
          seleccionado
            ? `${seleccionado.lote.nombre} / ${seleccionado.sector.nombre} / ${seleccionado.variedad.nombre}`
            : ""
        }. También se eliminarán sus conteos registrados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        loading={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={eliminar}
      />
    </AppShell>
  );
}