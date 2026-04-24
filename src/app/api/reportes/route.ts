import { NextResponse } from "next/server";

import { puedeVerReportes } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function crearFechaInicio(fecha: string) {
  return new Date(`${fecha}T00:00:00.000Z`);
}

function crearFechaFin(fecha: string) {
  return new Date(`${fecha}T23:59:59.999Z`);
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

  const semana = searchParams.get("semana");
  const fechaDesde = searchParams.get("fechaDesde");
  const fechaHasta = searchParams.get("fechaHasta");
  const loteId = searchParams.get("loteId");
  const sectorId = searchParams.get("sectorId");
  const variedadId = searchParams.get("variedadId");
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

  const where = {
    ...(planta
      ? {
          planta: {
            numero: /^\d+$/.test(planta)
              ? {
                  equals: planta,
                  mode: "insensitive" as const
                }
              : {
                  contains: planta,
                  mode: "insensitive" as const
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
      ...(semana
        ? {
            semana: {
              numero: Number(semana)
            }
          }
        : {})
    }
  };

  const [total, totals, items] = await Promise.all([
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
    })
  ]);

  const mapped = items.map((item) => ({
    id: item.id,
    semana: item.combinacion.semana.numero,
    fecha: item.combinacion.fecha,
    lote: item.combinacion.lote.nombre,
    sector: item.combinacion.sector.nombre,
    variedad: item.combinacion.variedad.nombre,
    planta: item.planta.numero,
    fc: item.fc,
    fa: item.fa,
    total: item.fc + item.fa
  }));

  return NextResponse.json({
    items: mapped,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    resumen: {
      fc: totals._sum.fc || 0,
      fa: totals._sum.fa || 0,
      total: (totals._sum.fc || 0) + (totals._sum.fa || 0)
    }
  });
}