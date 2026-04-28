import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { puedeVerReportes } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function crearFechaInicio(fecha: string) {
  return new Date(`${fecha}T00:00:00.000Z`);
}

function crearFechaFin(fecha: string) {
  return new Date(`${fecha}T23:59:59.999Z`);
}

function crearEvolucion(
  items: Array<{
    fc: number;
    fa: number;
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
      fc: number;
      fa: number;
      total: number;
    }
  >();

  for (const item of items) {
    const anio = item.combinacion.semana.anio;
    const semana = item.combinacion.semana.numero;
    const key = `${anio}-${semana}`;
    const fecha = item.combinacion.fecha.toISOString();

    const actual = mapa.get(key);

    if (actual) {
      actual.fc += item.fc;
      actual.fa += item.fa;
      actual.total += item.fc + item.fa;

      if (fecha < actual.fecha) {
        actual.fecha = fecha;
      }
    } else {
      mapa.set(key, {
        etiqueta: `Semana ${semana} - ${anio}`,
        anio,
        semana,
        fecha,
        fc: item.fc,
        fa: item.fa,
        total: item.fc + item.fa
      });
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    if (a.anio !== b.anio) {
      return a.anio - b.anio;
    }

    return a.semana - b.semana;
  });
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
  const sectorId = searchParams.get("sectorId") || "";
  const variedadId = searchParams.get("variedadId") || "";
  const planta = searchParams.get("planta")?.trim() || "";

  const fechaFiltro: {
    gte?: Date;
    lte?: Date;
  } = {};

  if (fechaDesde) {
    fechaFiltro.gte = crearFechaInicio(fechaDesde);
  }

  if (fechaHasta) {
    fechaFiltro.lte = crearFechaFin(fechaHasta);
  }

  const semanaNumero = /^\d+$/.test(semana) ? Number(semana) : undefined;

  const where: Prisma.ConteoWhereInput = {
    ...(planta
      ? {
          planta: {
            numero: /^\d+$/.test(planta)
              ? {
                  equals: planta,
                  mode: "insensitive"
                }
              : {
                  contains: planta,
                  mode: "insensitive"
                }
          }
        }
      : {}),

    combinacion: {
      ...(loteId ? { loteId } : {}),
      ...(sectorId ? { sectorId } : {}),
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
        fa: true
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
    fecha: item.combinacion.fecha.toISOString(),
    lote: item.combinacion.lote.nombre,
    sector: item.combinacion.sector.nombre,
    variedad: item.combinacion.variedad.nombre,
    planta: item.planta.numero,
    fc: item.fc,
    fa: item.fa,
    total: item.fc + item.fa
  }));

  const fc = totals._sum.fc || 0;
  const fa = totals._sum.fa || 0;

  return NextResponse.json({
    items: mapped,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    resumen: {
      fc,
      fa,
      total: fc + fa
    },
    evolucion: crearEvolucion(itemsEvolucion)
  });
}