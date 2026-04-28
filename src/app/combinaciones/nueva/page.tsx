"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { calcularSemana } from "@/lib/semana";
import { hoyInput } from "@/lib/utils";

type Item = {
  id: string;
  nombre: string;
};

type Sector = Item & {
  loteId: string;
};

export default function NuevaCombinacionPage() {
  const router = useRouter();

  const [fecha, setFecha] = useState(hoyInput());
  const [lotes, setLotes] = useState<Item[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [variedades, setVariedades] = useState<Item[]>([]);
  const [loteId, setLoteId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [variedadId, setVariedadId] = useState("");
  const [guardando, setGuardando] = useState(false);

  const semana = useMemo(() => calcularSemana(fecha), [fecha]);

  async function cargarMaestros() {
    const [lotesRes, variedadesRes] = await Promise.all([
      fetch("/api/lotes?pageSize=500", { cache: "no-store" }),
      fetch("/api/variedades?pageSize=500", { cache: "no-store" })
    ]);

    const lotesData = await lotesRes.json();
    const variedadesData = await variedadesRes.json();

    setLotes(lotesData.items || []);
    setVariedades(variedadesData.items || []);
  }

  async function cargarSectores(id: string) {
    if (!id) {
      setSectores([]);
      return;
    }

    const response = await fetch(`/api/sectores?loteId=${id}&pageSize=500`, {
      cache: "no-store"
    });

    const data = await response.json();

    setSectores(data.items || []);
  }

  useEffect(() => {
    cargarMaestros();
  }, []);

  useEffect(() => {
    cargarSectores(loteId);
    setSectorId("");
  }, [loteId]);

  async function crearLote() {
    const nombre = prompt("Nombre del lote:");

    if (!nombre) return;

    const response = await fetch("/api/lotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombre })
    });

    const data = await response.json();

    if (response.ok) {
      await cargarMaestros();
      setLoteId(data.item.id);
    } else {
      alert(data.message || "No se pudo crear lote.");
    }
  }

  async function crearSector() {
    if (!loteId) {
      alert("Primero selecciona un lote.");
      return;
    }

    const nombre = prompt("Nombre del sector:");

    if (!nombre) return;

    const response = await fetch("/api/sectores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombre, loteId })
    });

    const data = await response.json();

    if (response.ok) {
      await cargarSectores(loteId);
      setSectorId(data.item.id);
    } else {
      alert(data.message || "No se pudo crear sector.");
    }
  }

  async function crearVariedad() {
    const nombre = prompt("Nombre de la variedad:");

    if (!nombre) return;

    const response = await fetch("/api/variedades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombre })
    });

    const data = await response.json();

    if (response.ok) {
      await cargarMaestros();
      setVariedadId(data.item.id);
    } else {
      alert(data.message || "No se pudo crear variedad.");
    }
  }

  async function guardar() {
    if (!loteId || !sectorId || !variedadId) {
      alert("Completa lote, sector y variedad.");
      return;
    }

    setGuardando(true);

    const response = await fetch("/api/combinaciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fecha,
        loteId,
        sectorId,
        variedadId
      })
    });

    const data = await response.json();

    setGuardando(false);

    if (!response.ok) {
      alert(data.message || "No se pudo guardar.");
      return;
    }

    router.push(`/combinaciones/${data.item.id}/conteos`);
  }

  return (
    <AppShell title="Nueva combinación">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="card-base">
          <h1 className="text-2xl font-black text-[#10231A]">
            Nueva combinación
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Selecciona fecha, lote, sector y variedad para registrar conteos.
          </p>
        </section>

        <section className="card-base space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#10231A]">
              Fecha
            </label>
            <input
              type="date"
              className="input-base"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
            />
            <p className="mt-2 rounded-2xl bg-[#E8F5EE] px-4 py-3 text-sm font-bold text-[#0B7A3B]">
              Semana {semana.numero} - Año {semana.anio}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-[#10231A]">
                Lote
              </label>
              <button
                type="button"
                className="text-sm font-bold text-[#0B7A3B]"
                onClick={crearLote}
              >
                + Crear
              </button>
            </div>

            <SearchableSelect
              value={loteId}
              onChange={setLoteId}
              options={lotes}
              placeholder="Seleccionar lote"
              numericSort
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-[#10231A]">
                Sector
              </label>
              <button
                type="button"
                className="text-sm font-bold text-[#0B7A3B]"
                onClick={crearSector}
              >
                + Crear
              </button>
            </div>

            <SearchableSelect
              value={sectorId}
              onChange={setSectorId}
              options={sectores}
              placeholder={
                loteId ? "Seleccionar sector" : "Primero selecciona lote"
              }
              numericSort
              disabled={!loteId}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-bold text-[#10231A]">
                Variedad
              </label>
              <button
                type="button"
                className="text-sm font-bold text-[#0B7A3B]"
                onClick={crearVariedad}
              >
                + Crear
              </button>
            </div>

            <SearchableSelect
              value={variedadId}
              onChange={setVariedadId}
              options={variedades}
              placeholder="Seleccionar variedad"
              numericSort={false}
            />
          </div>

          <button
            type="button"
            className="button-primary w-full"
            onClick={guardar}
            disabled={guardando}
          >
            <Save className="mr-2 h-5 w-5" />
            {guardando ? "Guardando..." : "Guardar e ir a conteos"}
          </button>
        </section>
      </div>
    </AppShell>
  );
}