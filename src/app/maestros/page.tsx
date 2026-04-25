"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, Save, Search, Trash2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

type TipoListado = "lotes" | "sectores" | "variedades";

type Lote = {
  id: string;
  nombre: string;
};

type Sector = {
  id: string;
  nombre: string;
  loteId: string;
  lote?: {
    id: string;
    nombre: string;
  };
};

type Variedad = {
  id: string;
  nombre: string;
};

type ApiList<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type DeleteTarget = {
  tipo: TipoListado;
  id: string;
  label: string;
} | null;

function tipoTitulo(tipo: TipoListado) {
  if (tipo === "lotes") return "Lotes";
  if (tipo === "sectores") return "Sectores";
  return "Variedades";
}

export default function CrearDetallesPage() {
  const toast = useToast();

  const [lotesSelect, setLotesSelect] = useState<Lote[]>([]);

  const [nuevoLote, setNuevoLote] = useState("");
  const [nuevoSector, setNuevoSector] = useState("");
  const [sectorLoteId, setSectorLoteId] = useState("");
  const [nuevaVariedad, setNuevaVariedad] = useState("");

  const [tipo, setTipo] = useState<TipoListado>("lotes");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [variedades, setVariedades] = useState<Variedad[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingId, setSavingId] = useState("");

  const rows = useMemo(() => {
    if (tipo === "lotes") return lotes;
    if (tipo === "sectores") return sectores;
    return variedades;
  }, [tipo, lotes, sectores, variedades]);

  async function cargarLotesSelect() {
    const response = await fetch("/api/lotes?pageSize=500", {
      cache: "no-store"
    });

    const data: ApiList<Lote> = await response.json();

    setLotesSelect(data.items || []);
  }

  async function cargarListado(tipoActual = tipo, paginaActual = page) {
    const query = new URLSearchParams();

    query.set("page", String(paginaActual));
    query.set("pageSize", String(pageSize));
    query.set("exact", "1");

    if (busqueda.trim()) {
      query.set("q", busqueda.trim());
    }

    const response = await fetch(`/api/${tipoActual}?${query.toString()}`, {
      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || "No se pudo cargar el listado.");
      return;
    }

    if (tipoActual === "lotes") setLotes(data.items || []);
    if (tipoActual === "sectores") setSectores(data.items || []);
    if (tipoActual === "variedades") setVariedades(data.items || []);

    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
  }

  useEffect(() => {
    cargarLotesSelect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarListado(tipo, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, page]);

  async function crear(
    event: FormEvent<HTMLFormElement>,
    tipoCrear: TipoListado
  ) {
    event.preventDefault();

    let body: Record<string, string> = {};

    if (tipoCrear === "lotes") {
      body = { nombre: nuevoLote };
    }

    if (tipoCrear === "sectores") {
      body = { nombre: nuevoSector, loteId: sectorLoteId };
    }

    if (tipoCrear === "variedades") {
      body = { nombre: nuevaVariedad };
    }

    const response = await fetch(`/api/${tipoCrear}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || "No se pudo crear.");
      return;
    }

    toast.success("Registro creado correctamente.");

    setNuevoLote("");
    setNuevoSector("");
    setSectorLoteId("");
    setNuevaVariedad("");

    setTipo(tipoCrear);
    setPage(1);

    await cargarLotesSelect();
    await cargarListado(tipoCrear, 1);
  }

  async function actualizar(
    tipoActualizar: TipoListado,
    id: string,
    body: Record<string, string>
  ) {
    setSavingId(id);

    const response = await fetch(`/api/${tipoActualizar}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    setSavingId("");

    if (!response.ok) {
      toast.error(data.message || "No se pudo actualizar.");
      return;
    }

    toast.success("Registro actualizado correctamente.");

    await cargarLotesSelect();
    await cargarListado(tipo, page);
  }

  async function confirmarEliminar() {
    if (!deleteTarget) return;

    setDeleting(true);

    const response = await fetch(`/api/${deleteTarget.tipo}/${deleteTarget.id}`, {
      method: "DELETE"
    });

    const data = await response.json();

    setDeleting(false);

    if (!response.ok) {
      toast.error(data.message || "No se pudo eliminar.");
      return;
    }

    toast.success("Registro eliminado correctamente.");
    setDeleteTarget(null);

    await cargarLotesSelect();
    await cargarListado(tipo, page);
  }

  function seleccionarTipo(nuevoTipo: TipoListado) {
    setTipo(nuevoTipo);
    setBusqueda("");
    setPage(1);
  }

  function buscar() {
    setPage(1);
    cargarListado(tipo, 1);
  }

  return (
    <AppShell title="Crear detalles">
      <div className="space-y-6">
        <section className="card-base">
          <h1 className="text-2xl font-black text-[#10231A]">
            Crear detalles
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Crea lotes, sectores y variedades. Las plantas se generan automáticamente al registrar conteos.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="card-base space-y-4">
            <h2 className="text-lg font-black text-[#10231A]">Crear lote</h2>

            <form className="flex gap-2" onSubmit={(e) => crear(e, "lotes")}>
              <input
                className="input-base"
                value={nuevoLote}
                onChange={(e) => setNuevoLote(e.target.value)}
                placeholder="Nuevo lote"
                required
              />

              <button className="button-primary" type="submit">
                Crear
              </button>
            </form>
          </div>

          <div className="card-base space-y-4">
            <h2 className="text-lg font-black text-[#10231A]">Crear sector</h2>

            <form
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={(e) => crear(e, "sectores")}
            >
              <input
                className="input-base"
                value={nuevoSector}
                onChange={(e) => setNuevoSector(e.target.value)}
                placeholder="Nuevo sector"
                required
              />

              <select
                className="input-base"
                value={sectorLoteId}
                onChange={(e) => setSectorLoteId(e.target.value)}
                required
              >
                <option value="">Lote</option>

                {lotesSelect.map((lote) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.nombre}
                  </option>
                ))}
              </select>

              <button className="button-primary" type="submit">
                Crear
              </button>
            </form>
          </div>

          <div className="card-base space-y-4">
            <h2 className="text-lg font-black text-[#10231A]">
              Crear variedad
            </h2>

            <form
              className="flex gap-2"
              onSubmit={(e) => crear(e, "variedades")}
            >
              <input
                className="input-base"
                value={nuevaVariedad}
                onChange={(e) => setNuevaVariedad(e.target.value)}
                placeholder="Nueva variedad"
                required
              />

              <button className="button-primary" type="submit">
                Crear
              </button>
            </form>
          </div>
        </section>

        <section className="card-base">
          <h2 className="text-lg font-black text-[#10231A]">
            Ver detalles registrados
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(["lotes", "sectores", "variedades"] as TipoListado[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => seleccionarTipo(item)}
                  className={
                    tipo === item ? "button-primary" : "button-secondary"
                  }
                >
                  <Eye className="mr-2 h-5 w-5" />
                  Ver {tipoTitulo(item).toLowerCase()}
                </button>
              )
            )}
          </div>
        </section>

        <section className="card-base">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#10231A]">
                Listado de {tipoTitulo(tipo).toLowerCase()}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total encontrados: {total}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className="input-base"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder={`Buscar ${tipoTitulo(tipo).toLowerCase()}`}
              />

              <button type="button" className="button-primary" onClick={buscar}>
                <Search className="mr-2 h-5 w-5" />
                Buscar
              </button>
            </div>
          </div>

          <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-[#DDE7E1] md:block">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#E8F5EE] text-[#0B7A3B]">
                <tr>
                  <th className="px-4 py-3">Nombre / Número</th>
                  {tipo === "sectores" ? (
                    <th className="px-4 py-3">Lote</th>
                  ) : null}
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {tipo === "lotes" &&
                  (rows as Lote[]).map((item) => (
                    <LoteRow
                      key={item.id}
                      item={item}
                      saving={savingId === item.id}
                      onSave={(nombre) =>
                        actualizar("lotes", item.id, { nombre })
                      }
                      onDelete={() =>
                        setDeleteTarget({
                          tipo: "lotes",
                          id: item.id,
                          label: `lote ${item.nombre}`
                        })
                      }
                    />
                  ))}

                {tipo === "sectores" &&
                  (rows as Sector[]).map((item) => (
                    <SectorRow
                      key={item.id}
                      item={item}
                      lotes={lotesSelect}
                      saving={savingId === item.id}
                      onSave={(nombre, loteId) =>
                        actualizar("sectores", item.id, { nombre, loteId })
                      }
                      onDelete={() =>
                        setDeleteTarget({
                          tipo: "sectores",
                          id: item.id,
                          label: `sector ${item.nombre}`
                        })
                      }
                    />
                  ))}

                {tipo === "variedades" &&
                  (rows as Variedad[]).map((item) => (
                    <VariedadRow
                      key={item.id}
                      item={item}
                      saving={savingId === item.id}
                      onSave={(nombre) =>
                        actualizar("variedades", item.id, { nombre })
                      }
                      onDelete={() =>
                        setDeleteTarget({
                          tipo: "variedades",
                          id: item.id,
                          label: `variedad ${item.nombre}`
                        })
                      }
                    />
                  ))}

                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tipo === "sectores" ? 3 : 2}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      No hay registros para mostrar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-5 space-y-4 md:hidden">
            {rows.map((item) => {
              const label = (item as Lote | Sector | Variedad).nombre;

              const loteNombre =
                tipo === "sectores" ? (item as Sector).lote?.nombre || "" : "";

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#DDE7E1] bg-white p-4"
                >
                  <p className="text-sm font-bold text-[#0B7A3B]">
                    {tipoTitulo(tipo)}
                  </p>

                  <p className="mt-1 text-xl font-black text-[#10231A]">
                    {label}
                  </p>

                  {loteNombre ? (
                    <p className="mt-1 text-sm text-slate-500">
                      Lote: {loteNombre}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs text-slate-500">
                    Para editar con mayor comodidad usa la vista de escritorio.
                  </p>
                </article>
              );
            })}
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
        title="Confirmar eliminación"
        description={`¿Seguro que deseas eliminar ${deleteTarget?.label}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        danger
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmarEliminar}
      />
    </AppShell>
  );
}

function LoteRow({
  item,
  saving,
  onSave,
  onDelete
}: {
  item: Lote;
  saving: boolean;
  onSave: (nombre: string) => void;
  onDelete: () => void;
}) {
  const [nombre, setNombre] = useState(item.nombre);

  return (
    <tr className="border-t border-[#DDE7E1]">
      <td className="px-4 py-3">
        <input
          className="input-base"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            className="button-secondary min-h-10 px-3 py-2 text-sm"
            onClick={() => onSave(nombre)}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </button>

          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function SectorRow({
  item,
  lotes,
  saving,
  onSave,
  onDelete
}: {
  item: Sector;
  lotes: Lote[];
  saving: boolean;
  onSave: (nombre: string, loteId: string) => void;
  onDelete: () => void;
}) {
  const [nombre, setNombre] = useState(item.nombre);
  const [loteId, setLoteId] = useState(item.loteId);

  return (
    <tr className="border-t border-[#DDE7E1]">
      <td className="px-4 py-3">
        <input
          className="input-base"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
      </td>

      <td className="px-4 py-3">
        <select
          className="input-base"
          value={loteId}
          onChange={(event) => setLoteId(event.target.value)}
        >
          {lotes.map((lote) => (
            <option key={lote.id} value={lote.id}>
              {lote.nombre}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            className="button-secondary min-h-10 px-3 py-2 text-sm"
            onClick={() => onSave(nombre, loteId)}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </button>

          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

function VariedadRow({
  item,
  saving,
  onSave,
  onDelete
}: {
  item: Variedad;
  saving: boolean;
  onSave: (nombre: string) => void;
  onDelete: () => void;
}) {
  const [nombre, setNombre] = useState(item.nombre);

  return (
    <tr className="border-t border-[#DDE7E1]">
      <td className="px-4 py-3">
        <input
          className="input-base"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            className="button-secondary min-h-10 px-3 py-2 text-sm"
            onClick={() => onSave(nombre)}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : "Guardar"}
          </button>

          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}