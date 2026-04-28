"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

type Option = {
  id: string;
  nombre: string;
};

type SearchableSelectProps = {
  value: string;
  options: Option[];
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  numericSort?: boolean;
};

function esNumero(value: string) {
  return /^-?\d+(\.\d+)?$/.test(value.trim());
}

function compararNatural(a: string, b: string, numericSort = true) {
  const limpioA = a.trim();
  const limpioB = b.trim();

  if (numericSort && esNumero(limpioA) && esNumero(limpioB)) {
    return Number(limpioA) - Number(limpioB);
  }

  return limpioA.localeCompare(limpioB, "es", {
    numeric: true,
    sensitivity: "base"
  });
}

export function SearchableSelect({
  value,
  options,
  placeholder,
  onChange,
  className = "",
  disabled = false,
  numericSort = true
}: SearchableSelectProps) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const opcionesOrdenadas = useMemo(() => {
    return [...options].sort((a, b) =>
      compararNatural(a.nombre, b.nombre, numericSort)
    );
  }, [options, numericSort]);

  const seleccionado = useMemo(() => {
    return opcionesOrdenadas.find((option) => option.id === value) || null;
  }, [opcionesOrdenadas, value]);

  const opcionesFiltradas = useMemo(() => {
    const texto = query.trim().toLowerCase();

    if (!texto) {
      return opcionesOrdenadas;
    }

    return opcionesOrdenadas.filter((option) =>
      option.nombre.toLowerCase().includes(texto)
    );
  }, [opcionesOrdenadas, query]);

  function abrir() {
    if (disabled) return;

    setOpen(true);
    setQuery("");
  }

  function seleccionar(id: string) {
    onChange(id);
    setQuery("");
    setOpen(false);
  }

  function limpiar() {
    onChange("");
    setQuery("");
    setOpen(false);
  }

  const textoVisible = open ? query : seleccionado?.nombre || "";

  return (
    <div ref={contenedorRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type="text"
          className="input-base !pl-11 !pr-20"
          value={textoVisible}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={abrir}
          onClick={abrir}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />

        {value ? (
          <button
            type="button"
            className="absolute right-10 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={limpiar}
            title="Limpiar"
            aria-label="Limpiar"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <button
          type="button"
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          onClick={() => {
            if (disabled) return;
            setOpen((actual) => !actual);
            setQuery("");
          }}
          title="Abrir opciones"
          aria-label="Abrir opciones"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            tabIndex={-1}
            aria-label="Cerrar opciones"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          />

          <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-[#DDE7E1] bg-white shadow-2xl">
            <button
              type="button"
              className={`block w-full px-4 py-3 text-left text-sm font-bold hover:bg-[#E8F5EE] ${
                !value ? "bg-[#E8F5EE] text-[#0B7A3B]" : "text-slate-600"
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                seleccionar("");
              }}
            >
              {placeholder}
            </button>

            <div className="max-h-64 overflow-y-auto">
              {opcionesFiltradas.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`block w-full px-4 py-3 text-left text-sm font-semibold hover:bg-[#E8F5EE] ${
                    option.id === value
                      ? "bg-[#E8F5EE] text-[#0B7A3B]"
                      : "text-[#10231A]"
                  }`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    seleccionar(option.id);
                  }}
                >
                  {option.nombre}
                </button>
              ))}

              {opcionesFiltradas.length === 0 ? (
                <div className="px-4 py-5 text-center text-sm font-semibold text-slate-500">
                  No se encontraron resultados.
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}