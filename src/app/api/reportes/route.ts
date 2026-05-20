import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { crearFechaUtcMediodia, obtenerFechaInput } from "@/lib/fecha";
import { puedeVerReportes } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function crearFechaSoloDia(fecha: string) {
  // La columna Combinacion.fecha es DATE. Usar T00/T23 puede desfazar el día
  // según la zona horaria de Node/PostgreSQL. Mediodía UTC conserva el día real.
  return crearFechaUtcMediodia(fecha);
}

function calcularPromedio(total: number, plantas: number) {
  if (plantas <= 0) {
    return 0;
  }

  return Math.round((total / plantas) * 100) / 100;
}

function crearEvolucion(
  items: Array<{
    fc: number;
    fa: number;
    cuaja: number;
    combinacion: {
      fecha: Date;
      semana: {
        numero: number;
        anio: number;
      };
    };
  }>
) {
  const mapa = new Map<
    string,
    {
      etiqueta: string;
      anio: number;
      semana: number;
      fecha: string;
      plantas: number;
      fc: number;
      fa: number;
      cuaja: number;
      total: number;
    }
  >();

  for (const item of items) {
    const anio = item.combinacion.semana.anio;
    const semana = item.combinacion.semana.numero;
    const key = `${anio}-${semana}`;
    const fecha = obtenerFechaInput(item.combinacion.fecha);

    const actual = mapa.get(key);

    if (actual) {
      actual.plantas += 1;
      actual.fc += item.fc;
      actual.fa += item.fa;
      actual.cuaja += item.cuaja;
      actual.total += item.fc + item.fa + item.cuaja;

      if (fecha < actual.fecha) {
        actual.fecha = fecha;
      }
    } else {
      mapa.set(key, {
        etiqueta: `Semana ${semana} - ${anio}`,
        anio,
        semana,
        fecha,
        plantas: 1,
        fc: item.fc,
        fa: item.fa,
        cuaja: item.cuaja,
        total: item.fc + item.fa + item.cuaja
      });
    }
  }

  return Array.from(mapa.values())
    .sort((a, b) => {
      if (a.anio !== b.anio) {
        return a.anio - b.anio;
      }

      return a.semana - b.semana;
    })
    .map((item) => ({
      ...item,
      promedioFc: calcularPromedio(item.fc, item.plantas),
      promedioFa: calcularPromedio(item.fa, item.plantas),
      promedioCuaja: calcularPromedio(item.cuaja, item.plantas)
    }));
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session || !puedeVerReportes(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || 20), 1),
    200
  );

  const semana = searchParams.get("semana")?.trim() || "";
  const fechaDesde = searchParams.get("fechaDesde")?.trim() || "";
  const fechaHasta = searchParams.get("fechaHasta")?.trim() || "";
  const loteId = searchParams.get("loteId") || "";
  const variedadId = searchParams.get("variedadId") || "";

  const fechaFiltro: {
    gte?: Date;
    lte?: Date;
  } = {};

  if (fechaDesde) {
    fechaFiltro.gte = crearFechaSoloDia(fechaDesde);
  }

  if (fechaHasta) {
    fechaFiltro.lte = crearFechaSoloDia(fechaHasta);
  }

  const semanaNumero = /^\d+$/.test(semana) ? Number(semana) : undefined;

  const where: Prisma.ConteoWhereInput = {
    combinacion: {
      ...(loteId ? { loteId } : {}),
      ...(variedadId ? { variedadId } : {}),
      ...(Object.keys(fechaFiltro).length > 0
        ? {
            fecha: fechaFiltro
          }
        : {}),
      ...(semanaNumero
        ? {
            semana: {
              numero: semanaNumero
            }
          }
        : {})
    }
  };

  const [total, totals, items, itemsEvolucion] = await Promise.all([
    prisma.conteo.count({ where }),

    prisma.conteo.aggregate({
      where,
      _sum: {
        fc: true,
        fa: true,
        cuaja: true
      }
    }),

    prisma.conteo.findMany({
      where,
      include: {
        planta: true,
        combinacion: {
          include: {
            semana: true,
            lote: true,
            sector: true,
            variedad: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),

    prisma.conteo.findMany({
      where,
      select: {
        fc: true,
        fa: true,
        cuaja: true,
        combinacion: {
          select: {
            fecha: true,
            semana: {
              select: {
                numero: true,
                anio: true
              }
            }
          }
        }
      }
    })
  ]);

  const mapped = items.map((item) => ({
    id: item.id,
    semana: item.combinacion.semana.numero,
    fecha: obtenerFechaInput(item.combinacion.fecha),
    lote: item.combinacion.lote.nombre,
    sector: item.combinacion.sector.nombre,
    variedad: item.combinacion.variedad.nombre,
    planta: item.planta.numero,
    fc: item.fc,
    fa: item.fa,
    cuaja: item.cuaja,
    total: item.fc + item.fa + item.cuaja
  }));

  const fc = totals._sum.fc || 0;
  const fa = totals._sum.fa || 0;
  const cuaja = totals._sum.cuaja || 0;

  return NextResponse.json({
    items: mapped,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    resumen: {
      fc,
      fa,
      cuaja,
      total: fc + fa + cuaja
    },
    evolucion: crearEvolucion(itemsEvolucion)
  });
}