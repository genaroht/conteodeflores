"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ConteoTable } from "@/components/conteos/ConteoTable";
import { AppShell } from "@/components/layout/AppShell";

type Conteo = {
  id: string;
  fc: number;
  fa: number;
  planta: {
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
  conteos: Conteo[];
};

export default function ConteosPage() {
  const params = useParams();
  const id = String(params.id);

  const [item, setItem] = useState<CombinacionDetalle | null>(null);

  async function cargar() {
    const response = await fetch(`/api/combinaciones/${id}`, {
      cache: "no-store"
    });

    const data = await response.json();
    setItem(data.item);
  }

  useEffect(() => {
    cargar();
  }, [id]);

  return (
    <AppShell title="Conteos">
      <div className="space-y-6">
        {item ? (
          <>
            <section className="card-base">
              <p className="text-sm font-bold uppercase tracking-wide text-[#0B7A3B]">
                Semana {item.semana.numero} - {item.semana.anio}
              </p>

              <h1 className="mt-1 text-2xl font-black text-[#10231A]">
                Lote {item.lote.nombre} / Sector {item.sector.nombre}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Variedad: {item.variedad.nombre} | Fecha:{" "}
                {item.fecha.slice(0, 10)}
              </p>

              <Link href="/combinaciones" className="button-secondary mt-4">
                Volver
              </Link>
            </section>

            <section className="card-base">
              <h2 className="mb-4 text-lg font-black text-[#10231A]">
                Registrar conteos por filas
              </h2>

              <ConteoTable combinacionId={item.id} onSaved={cargar} />
            </section>

            <section className="card-base">
              <h2 className="mb-4 text-lg font-black text-[#10231A]">
                Conteos guardados
              </h2>

              {item.conteos.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Todavía no hay conteos.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#E8F5EE] text-[#0B7A3B]">
                      <tr>
                        <th className="px-4 py-3">Planta</th>
                        <th className="px-4 py-3">FC</th>
                        <th className="px-4 py-3">FA</th>
                        <th className="px-4 py-3">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {item.conteos.map((conteo) => (
                        <tr
                          key={conteo.id}
                          className="border-t border-[#DDE7E1]"
                        >
                          <td className="px-4 py-3">
                            {conteo.planta.numero}
                          </td>
                          <td className="px-4 py-3">{conteo.fc}</td>
                          <td className="px-4 py-3">{conteo.fa}</td>
                          <td className="px-4 py-3 font-bold">
                            {conteo.fc + conteo.fa}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="card-base">
            <p>Cargando...</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}