"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Save,
  Trash2
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";

type ConteoGuardado = {
  id: string;
  fc: number;
  fa: number;
  planta: {
    id: string;
    numero: string;
  };
};

type CombinacionDetalle = {
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
  conteos: ConteoGuardado[];
};

type FilaConteo = {
  id: string;
  plantaNumero: string;
  fc: string;
  fa: string;
};

function crearIdTemporal() {
  return crypto.randomUUID();
}

function numeroSeguro(value: string) {
  const numero = Number(value);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return Math.trunc(numero);
}

function formatoFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-PE");
}

export default function ConteosPage() {
  const params = useParams();
  const toast = useToast();

  const combinacionId = String(params.id || "");

  const [combinacion, setCombinacion] = useState<CombinacionDetalle | null>(
    null
  );

  const [filas, setFilas] = useState<FilaConteo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mostrarGuardados, setMostrarGuardados] = useState(false);
  const [deleteConteoId, setDeleteConteoId] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const conteosGuardados = useMemo(() => {
    return combinacion?.conteos || [];
  }, [combinacion]);

  const plantasGuardadas = useMemo(() => {
    return new Set(conteosGuardados.map((conteo) => conteo.planta.numero));
  }, [conteosGuardados]);

  function obtenerSiguientePlanta(filasActuales = filas) {
    const numerosGuardados = conteosGuardados
      .map((conteo) => Number(conteo.planta.numero))
      .filter((numero) => Number.isFinite(numero));

    const numerosFilas = filasActuales
      .map((fila) => Number(fila.plantaNumero))
      .filter((numero) => Number.isFinite(numero));

    const maximo = Math.max(0, ...numerosGuardados, ...numerosFilas);

    return String(maximo + 1);
  }

  function crearFila(filasActuales = filas): FilaConteo {
    return {
      id: crearIdTemporal(),
      plantaNumero: obtenerSiguientePlanta(filasActuales),
      fc: "",
      fa: ""
    };
  }

  async function cargarCombinacion() {
    const response = await fetch(`/api/combinaciones/${combinacionId}`, {
      cache: "no-store"
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message || "No se pudo cargar la combinación.");
      return null;
    }

    setCombinacion(data.item);
    return data.item as CombinacionDetalle;
  }

  useEffect(() => {
    cargarCombinacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinacionId]);

  useEffect(() => {
    if (combinacion && filas.length === 0) {
      setFilas([crearFila([])]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinacion]);

  function actualizarFila(
    id: string,
    campo: keyof Omit<FilaConteo, "id">,
    value: string
  ) {
    setFilas((actuales) =>
      actuales.map((fila) =>
        fila.id === id
          ? {
              ...fila,
              [campo]: value
            }
          : fila
      )
    );
  }

  function agregarFilaDespues(index: number) {
    setFilas((actuales) => {
      const nuevas = [...actuales];
      const nuevaFila = crearFila(nuevas);

      nuevas.splice(index + 1, 0, nuevaFila);

      return nuevas;
    });
  }

  function eliminarFila(id: string) {
    setFilas((actuales) => {
      const nuevas = actuales.filter((fila) => fila.id !== id);

      if (nuevas.length === 0) {
        return [crearFila([])];
      }

      return nuevas;
    });
  }

  function validarFilas() {
    const plantas = filas.map((fila) => fila.plantaNumero.trim());

    const vacias = plantas.filter((planta) => !planta);

    if (vacias.length > 0) {
      return "Todas las filas deben tener N° de planta.";
    }

    const repetidasEnFormulario = plantas.filter(
      (planta, index) => plantas.indexOf(planta) !== index
    );

    if (repetidasEnFormulario.length > 0) {
      const unicas = Array.from(new Set(repetidasEnFormulario));

      return `Hay plantas repetidas en las filas: ${unicas.join(
        ", "
      )}. Cada planta solo puede tener un conteo.`;
    }

    const repetidasConGuardadas = plantas.filter((planta) =>
      plantasGuardadas.has(planta)
    );

    if (repetidasConGuardadas.length > 0) {
      const unicas = Array.from(new Set(repetidasConGuardadas));

      return `La planta ${unicas.join(
        ", "
      )} ya tiene conteo guardado. Edita el conteo guardado en vez de volver a registrarlo.`;
    }

    const negativos = filas.some(
      (fila) => numeroSeguro(fila.fc) < 0 || numeroSeguro(fila.fa) < 0
    );

    if (negativos) {
      return "FC y FA no pueden ser negativos.";
    }

    return "";
  }

  async function guardarTodos() {
    const error = validarFilas();

    if (error) {
      toast.error(error);
      return;
    }

    setGuardando(true);

    const response = await fetch("/api/conteos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        combinacionId,
        filas: filas.map((fila) => ({
          plantaNumero: fila.plantaNumero.trim(),
          fc: fila.fc === "" ? 0 : numeroSeguro(fila.fc),
          fa: fila.fa === "" ? 0 : numeroSeguro(fila.fa)
        }))
      })
    });

    const data = await response.json();

    setGuardando(false);

    if (!response.ok) {
      toast.error(data.message || "No se pudo guardar.");
      return;
    }

    toast.success(data.message || "Conteos guardados correctamente.");

    await cargarCombinacion();

    setFilas([
      {
        id: crearIdTemporal(),
        plantaNumero: "",
        fc: "",
        fa: ""
      }
    ]);

    setTimeout(() => {
      setFilas((actuales) => {
        if (actuales[0]?.plantaNumero) {
          return actuales;
        }

        return [
          {
            ...actuales[0],
            plantaNumero: obtenerSiguientePlanta([])
          }
        ];
      });
    }, 100);
  }

  async function eliminarConteoGuardado() {
    if (!deleteConteoId) return;

    setEliminando(true);

    const response = await fetch(`/api/conteos/${deleteConteoId}`, {
      method: "DELETE"
    });

    const data = await response.json();

    setEliminando(false);

    if (!response.ok) {
      toast.error(data.message || "No se pudo eliminar el conteo.");
      return;
    }

    toast.success(data.message || "Conteo eliminado correctamente.");
    setDeleteConteoId(null);
    await cargarCombinacion();
  }

  const conteoSeleccionado = conteosGuardados.find(
    (conteo) => conteo.id === deleteConteoId
  );

  return (
    <AppShell title="Conteos">
      <div className="space-y-5">
        <section className="card-base">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-[#0B7A3B]">
                Semana {combinacion?.semana.numero || "-"} -{" "}
                {combinacion?.semana.anio || ""}
              </p>

              <h1 className="mt-1 text-2xl font-black text-[#10231A]">
                Lote {combinacion?.lote.nombre || "-"} / Sector{" "}
                {combinacion?.sector.nombre || "-"}
              </h1>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Variedad: {combinacion?.variedad.nombre || "-"} | Fecha:{" "}
                {combinacion ? formatoFecha(combinacion.fecha) : "-"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/combinaciones" className="button-secondary">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Volver
              </Link>

              <Link href="/combinaciones/nueva" className="button-primary">
                <Plus className="mr-2 h-4 w-4" />
                Nueva combinación
              </Link>
            </div>
          </div>
        </section>

        <section className="card-base">
          <div className="mb-4">
            <h2 className="text-lg font-black text-[#10231A]">
              Registrar conteos
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#DDE7E1]">
            <table className="w-full min-w-[410px] table-fixed text-left text-xs sm:text-sm">
              <thead className="bg-[#E8F5EE] text-[#0B7A3B]">
                <tr>
                  <th className="w-[26%] px-2 py-3 sm:px-4">Planta</th>
                  <th className="w-[24%] px-2 py-3 sm:px-4">FC</th>
                  <th className="w-[24%] px-2 py-3 sm:px-4">FA</th>
                  <th className="w-[26%] px-2 py-3 sm:px-4">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filas.map((fila, index) => (
                  <tr key={fila.id} className="border-t border-[#DDE7E1]">
                    <td className="px-2 py-3 sm:px-4">
                    <input
                      type="number"
                      min={1}
                      className="h-10 w-full rounded-2xl border border-[#B8CFC4] bg-[#DCE8E2] px-3 font-black text-[#10231A] shadow-inner outline-none transition focus:border-[#0B7A3B] focus:bg-white focus:ring-4 focus:ring-[#E8F5EE] sm:h-12 sm:px-4"
                      value={fila.plantaNumero}
                      onChange={(event) =>
                        actualizarFila(
                          fila.id,
                          "plantaNumero",
                          event.target.value
                        )
                      }
                    />
                    </td>

                    <td className="px-2 py-3 sm:px-4">
                      <input
                        type="number"
                        min={0}
                        className="input-base h-10 !px-2 sm:h-12 sm:!px-4"
                        value={fila.fc}
                        onChange={(event) =>
                          actualizarFila(fila.id, "fc", event.target.value)
                        }
                        placeholder="0"
                      />
                    </td>

                    <td className="px-2 py-3 sm:px-4">
                      <input
                        type="number"
                        min={0}
                        className="input-base h-10 !px-2 sm:h-12 sm:!px-4"
                        value={fila.fa}
                        onChange={(event) =>
                          actualizarFila(fila.id, "fa", event.target.value)
                        }
                        placeholder="0"
                      />
                    </td>

                    <td className="px-2 py-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDE7E1] bg-white font-black text-[#0B7A3B] hover:bg-[#E8F5EE]"
                          onClick={() => agregarFilaDespues(index)}
                          title="Agregar fila"
                          aria-label="Agregar fila"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 font-black text-red-700 hover:bg-red-100"
                          onClick={() => eliminarFila(fila.id)}
                          title="Eliminar fila"
                          aria-label="Eliminar fila"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="button-primary mt-4 w-full"
            onClick={guardarTodos}
            disabled={guardando}
          >
            <Save className="mr-2 h-4 w-4" />
            {guardando ? "Guardando..." : "Guardar todos"}
          </button>
        </section>

        <section className="card-base">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#10231A]">
                Conteos guardados
              </h2>

              <p className="text-sm text-slate-500">
                Total guardados: {conteosGuardados.length}
              </p>
            </div>

            <button
              type="button"
              className="button-secondary"
              onClick={() => setMostrarGuardados((actual) => !actual)}
            >
              {mostrarGuardados ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {mostrarGuardados ? "Ocultar conteos" : "Ver conteos guardados"}
            </button>
          </div>

          {mostrarGuardados ? (
            <ConteosGuardados
              items={conteosGuardados}
              onSaved={cargarCombinacion}
              onDelete={(id) => setDeleteConteoId(id)}
            />
          ) : null}
        </section>
      </div>

      <ConfirmModal
        open={Boolean(deleteConteoId)}
        title="¿Eliminar conteo?"
        description={`Se eliminará el conteo de la planta ${
          conteoSeleccionado?.planta.numero || ""
        }. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger
        loading={eliminando}
        onClose={() => setDeleteConteoId(null)}
        onConfirm={eliminarConteoGuardado}
      />
    </AppShell>
  );
}

function ConteosGuardados({
  items,
  onSaved,
  onDelete
}: {
  items: ConteoGuardado[];
  onSaved: () => void;
  onDelete: (id: string) => void;
}) {
  const [pagina, setPagina] = useState(1);
  const pageSize = 10;

  const itemsOrdenados = useMemo(() => {
    return [...items].sort((a, b) => {
      const plantaA = Number(a.planta.numero);
      const plantaB = Number(b.planta.numero);

      if (Number.isFinite(plantaA) && Number.isFinite(plantaB)) {
        return plantaA - plantaB;
      }

      return a.planta.numero.localeCompare(b.planta.numero, "es", {
        numeric: true
      });
    });
  }, [items]);

  const totalPages = Math.max(Math.ceil(itemsOrdenados.length / pageSize), 1);

  const itemsPagina = useMemo(() => {
    const inicio = (pagina - 1) * pageSize;
    const fin = inicio + pageSize;

    return itemsOrdenados.slice(inicio, fin);
  }, [itemsOrdenados, pagina]);

  useEffect(() => {
    if (pagina > totalPages) {
      setPagina(totalPages);
    }
  }, [pagina, totalPages]);

  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-[#DDE7E1] bg-white p-4 text-sm text-slate-500">
        Todavía no hay conteos guardados.
      </div>
    );
  }

  const desde = (pagina - 1) * pageSize + 1;
  const hasta = Math.min(pagina * pageSize, itemsOrdenados.length);

  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-[#DDE7E1]">
        <table className="w-full min-w-[460px] table-fixed text-left text-xs sm:text-sm">
          <thead className="bg-[#E8F5EE] text-[#0B7A3B]">
            <tr>
              <th className="w-[18%] px-2 py-3 sm:px-4">Planta</th>
              <th className="w-[18%] px-2 py-3 sm:px-4">FC</th>
              <th className="w-[18%] px-2 py-3 sm:px-4">FA</th>
              <th className="w-[18%] px-2 py-3 sm:px-4">Total</th>
              <th className="w-[28%] px-2 py-3 sm:px-4">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {itemsPagina.map((item) => (
              <ConteoGuardadoRow
                key={item.id}
                item={item}
                onSaved={onSaved}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#DDE7E1] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          Mostrando {desde} - {hasta} de {itemsOrdenados.length} · Página{" "}
          {pagina} de {totalPages}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <button
            type="button"
            className="button-secondary"
            disabled={pagina <= 1}
            onClick={() => setPagina((actual) => Math.max(actual - 1, 1))}
          >
            Anterior
          </button>

          <button
            type="button"
            className="button-secondary"
            disabled={pagina >= totalPages}
            onClick={() =>
              setPagina((actual) => Math.min(actual + 1, totalPages))
            }
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

function ConteoGuardadoRow({
  item,
  onSaved,
  onDelete
}: {
  item: ConteoGuardado;
  onSaved: () => void;
  onDelete: (id: string) => void;
}) {
  const toast = useToast();

  const [fc, setFc] = useState(String(item.fc));
  const [fa, setFa] = useState(String(item.fa));
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);

    const response = await fetch(`/api/conteos/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fc,
        fa
      })
    });

    const data = await response.json();

    setGuardando(false);

    if (!response.ok) {
      toast.error(data.message || "No se pudo actualizar.");
      return;
    }

    toast.success("Conteo actualizado correctamente.");
    setEditando(false);
    onSaved();
  }

  return (
    <tr className="border-t border-[#DDE7E1]">
      <td className="px-2 py-3 font-black sm:px-4">{item.planta.numero}</td>

      <td className="px-2 py-3 sm:px-4">
        {editando ? (
          <input
            type="number"
            min={0}
            className="input-base h-10 !px-2 sm:h-12 sm:!px-4"
            value={fc}
            onChange={(event) => setFc(event.target.value)}
          />
        ) : (
          item.fc
        )}
      </td>

      <td className="px-2 py-3 sm:px-4">
        {editando ? (
          <input
            type="number"
            min={0}
            className="input-base h-10 !px-2 sm:h-12 sm:!px-4"
            value={fa}
            onChange={(event) => setFa(event.target.value)}
          />
        ) : (
          item.fa
        )}
      </td>

      <td className="px-2 py-3 font-black sm:px-4">
        {numeroSeguro(fc) + numeroSeguro(fa)}
      </td>

      <td className="px-2 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          {editando ? (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B7A3B] font-black text-white hover:bg-[#096832] sm:w-auto sm:px-3"
              onClick={guardar}
              disabled={guardando}
              title="Guardar"
              aria-label="Guardar"
            >
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {guardando ? "Guardando..." : "Guardar"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDE7E1] bg-white font-black text-[#10231A] hover:bg-[#E8F5EE] sm:w-auto sm:px-3"
              onClick={() => setEditando(true)}
              title="Editar"
              aria-label="Editar"
            >
              <Pencil className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </button>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 font-black text-red-700 hover:bg-red-100"
            onClick={() => onDelete(item.id)}
            title="Eliminar"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}