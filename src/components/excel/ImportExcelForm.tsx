"use client";

import { FormEvent, useState } from "react";
import { Upload } from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";

type Resumen = {
  filasProcesadas: number;
  filasImportadas: number;
  filasConError: number;
  lotesCreados: number;
  sectoresCreados: number;
  variedadesCreadas: number;
  plantasCreadas: number;
  errores: string[];
};

type ImportExcelFormProps = {
  onImported?: () => void;
};

export function ImportExcelForm({ onImported }: ImportExcelFormProps) {
  const toast = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(false);

  async function importar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      toast.error("Selecciona un archivo Excel.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setCargando(true);

    const response = await fetch("/api/excel/importar", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    setCargando(false);

    if (!response.ok) {
      setResumen(data.resumen || null);
      toast.error(data.message || "No se pudo importar.");
      onImported?.();
      return;
    }

    setResumen(data.resumen);
    toast.success(data.message || "Excel importado correctamente.");
    setFile(null);
    onImported?.();
  }

  return (
    <div className="card-base">
      <h2 className="text-lg font-bold text-[#10231A]">Importar Excel</h2>

      <form className="mt-4 space-y-4" onSubmit={importar}>
        <input
          type="file"
          accept=".xlsx"
          className="input-base file:mr-4 file:rounded-xl file:border-0 file:bg-[#E8F5EE] file:px-4 file:py-2 file:font-bold file:text-[#0B7A3B]"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />

        <button
          type="submit"
          className="button-primary w-full sm:w-auto"
          disabled={cargando}
        >
          <Upload className="mr-2 h-5 w-5" />
          {cargando ? "Validando e importando..." : "Importar"}
        </button>
      </form>

      {resumen ? (
        <div className="mt-5 rounded-2xl bg-[#E8F5EE] p-4 text-sm">
          <p className="font-bold text-[#0B7A3B]">Resumen de importación</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p>Filas procesadas: {resumen.filasProcesadas}</p>
            <p>Filas importadas: {resumen.filasImportadas}</p>
            <p>Filas con error: {resumen.filasConError}</p>
            <p>Lotes creados: {resumen.lotesCreados}</p>
            <p>Sectores creados: {resumen.sectoresCreados}</p>
            <p>Variedades creadas: {resumen.variedadesCreadas}</p>
            <p>Plantas creadas: {resumen.plantasCreadas}</p>
          </div>

          {resumen.errores.length > 0 ? (
            <div className="mt-4 rounded-xl bg-white p-3">
              <p className="font-bold text-red-700">Avisos o errores</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700">
                {resumen.errores.slice(0, 20).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}