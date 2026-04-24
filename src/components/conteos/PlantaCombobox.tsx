"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

type Planta = {
  id: string;
  numero: string;
};

type PlantaComboboxProps = {
  value: string;
  label: string;
  onChange: (id: string, label: string) => void;
};

export function PlantaCombobox({ value, label, onChange }: PlantaComboboxProps) {
  const [texto, setTexto] = useState(label);
  const [opciones, setOpciones] = useState<Planta[]>([]);

  useEffect(() => {
    setTexto(label);
  }, [label]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/plantas?q=${encodeURIComponent(texto)}`);
      const data = await response.json();

      setOpciones(data.items || []);
    }, 250);

    return () => clearTimeout(timer);
  }, [texto]);

  async function crearPlanta() {
    const numero = texto.trim();

    if (!numero) {
      return;
    }

    const response = await fetch("/api/plantas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        numero
      })
    });

    const data = await response.json();

    if (response.ok && data.item) {
      onChange(data.item.id, data.item.numero);
      setTexto(data.item.numero);
    } else {
      alert(data.message || "No se pudo crear la planta.");
    }
  }

  return (
    <div>
      <input
        className="input-base"
        value={texto}
        placeholder="Buscar planta"
        onChange={(event) => {
          setTexto(event.target.value);
          onChange("", event.target.value);
        }}
      />

      {value ? (
        <p className="mt-1 text-xs font-semibold text-[#0B7A3B]">
          Planta seleccionada
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          Escribe, selecciona o crea la planta.
        </p>
      )}

      <div className="mt-2 max-h-44 overflow-auto rounded-2xl border border-[#DDE7E1] bg-white">
        {opciones.map((planta) => (
          <button
            type="button"
            key={planta.id}
            onClick={() => {
              onChange(planta.id, planta.numero);
              setTexto(planta.numero);
            }}
            className="block w-full px-4 py-2 text-left text-sm font-semibold hover:bg-[#E8F5EE]"
          >
            Planta {planta.numero}
          </button>
        ))}

        {texto.trim() ? (
          <button
            type="button"
            onClick={crearPlanta}
            className="flex w-full items-center gap-2 border-t border-[#DDE7E1] px-4 py-2 text-left text-sm font-bold text-[#0B7A3B] hover:bg-[#E8F5EE]"
          >
            <Plus className="h-4 w-4" />
            Crear planta {texto}
          </button>
        ) : null}
      </div>
    </div>
  );
}