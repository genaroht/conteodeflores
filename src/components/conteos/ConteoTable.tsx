"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import { PlantaCombobox } from "@/components/conteos/PlantaCombobox";
import { useToast } from "@/components/ui/ToastProvider";

type ConteoRow = {
  key: string;
  plantaId: string;
  plantaNumero: string;
  fc: string;
  fa: string;
};

type ConteoTableProps = {
  combinacionId: string;
  onSaved?: () => void;
};

function crearFila(): ConteoRow {
  return {
    key: crypto.randomUUID(),
    plantaId: "",
    plantaNumero: "",
    fc: "",
    fa: ""
  };
}

export function ConteoTable({ combinacionId, onSaved }: ConteoTableProps) {
  const toast = useToast();

  const [filas, setFilas] = useState<ConteoRow[]>([crearFila()]);
  const [guardando, setGuardando] = useState(false);

  function actualizarFila(key: string, cambios: Partial<ConteoRow>) {
    setFilas((actuales) =>
      actuales.map((fila) => (fila.key === key ? { ...fila, ...cambios } : fila))
    );
  }

  function eliminarFila(key: string) {
    setFilas((actuales) => {
      if (actuales.length === 1) {
        return [crearFila()];
      }

      return actuales.filter((fila) => fila.key !== key);
    });
  }

  async function guardar() {
    const incompletas = filas.filter((fila) => !fila.plantaId);

    if (incompletas.length > 0) {
      toast.error("Todas las filas deben tener una planta seleccionada o creada.");
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
          plantaId: fila.plantaId,
          fc: fila.fc === "" ? 0 : Number(fila.fc),
          fa: fila.fa === "" ? 0 : Number(fila.fa)
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
    setFilas([crearFila()]);
    onSaved?.();
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-2xl border border-[#DDE7E1] bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#E8F5EE] text-[#0B7A3B]">
            <tr>
              <th className="px-4 py-3">N° de planta</th>
              <th className="px-4 py-3">FC</th>
              <th className="px-4 py-3">FA</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>

          <tbody>
            {filas.map((fila) => (
              <tr key={fila.key} className="border-t border-[#DDE7E1] align-top">
                <td className="w-[45%] px-4 py-3">
                  <PlantaCombobox
                    value={fila.plantaId}
                    label={fila.plantaNumero}
                    onChange={(id, label) =>
                      actualizarFila(fila.key, {
                        plantaId: id,
                        plantaNumero: label
                      })
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    className="input-base"
                    value={fila.fc}
                    onChange={(event) =>
                      actualizarFila(fila.key, {
                        fc: event.target.value
                      })
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    className="input-base"
                    value={fila.fa}
                    onChange={(event) =>
                      actualizarFila(fila.key, {
                        fa: event.target.value
                      })
                    }
                  />
                </td>

                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => eliminarFila(fila.key)}
                    className="button-secondary px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {filas.map((fila, index) => (
          <div key={fila.key} className="card-base space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#10231A]">Fila {index + 1}</p>

              <button
                type="button"
                onClick={() => eliminarFila(fila.key)}
                className="rounded-xl border border-[#DDE7E1] p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <PlantaCombobox
              value={fila.plantaId}
              label={fila.plantaNumero}
              onChange={(id, label) =>
                actualizarFila(fila.key, {
                  plantaId: id,
                  plantaNumero: label
                })
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-bold">FC</label>
                <input
                  type="number"
                  min={0}
                  className="input-base"
                  value={fila.fc}
                  onChange={(event) =>
                    actualizarFila(fila.key, {
                      fc: event.target.value
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold">FA</label>
                <input
                  type="number"
                  min={0}
                  className="input-base"
                  value={fila.fa}
                  onChange={(event) =>
                    actualizarFila(fila.key, {
                      fa: event.target.value
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="button-secondary"
          onClick={() => setFilas((actuales) => [...actuales, crearFila()])}
        >
          <Plus className="mr-2 h-5 w-5" />
          Agregar fila
        </button>

        <button
          type="button"
          className="button-primary"
          onClick={guardar}
          disabled={guardando}
        >
          <Save className="mr-2 h-5 w-5" />
          {guardando ? "Guardando..." : "Guardar todos"}
        </button>
      </div>
    </div>
  );
}