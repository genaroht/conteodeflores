import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { calcularSemana } from "@/lib/semana";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const actual = calcularSemana(new Date().toISOString().slice(0, 10));

  const anio = Number(searchParams.get("anio") || actual.anio);
  const semana = Number(searchParams.get("semana") || actual.numero);
  const loteId = searchParams.get("loteId") || undefined;
  const sectorId = searchParams.get("sectorId") || undefined;

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || 9), 1),
    60
  );

  const where = {
    semana: {
      anio,
      numero: semana
    },
    ...(loteId ? { loteId } : {}),
    ...(sectorId ? { sectorId } : {}),
    conteos: {
      some: {}
    }
  };

  const [total, combinaciones] = await Promise.all([
    prisma.combinacion.count({ where }),
    prisma.combinacion.findMany({
      where,
      include: {
        semana: true,
        lote: true,
        sector: true,
        variedad: true,
        conteos: {
          select: {
            fc: true,
            fa: true
          }
        }
      },
      orderBy: [
        {
          lote: {
            nombre: "asc"
          }
        },
        {
          sector: {
            nombre: "asc"
          }
        },
        {
          variedad: {
            nombre: "asc"
          }
        }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  const items = combinaciones.map((combinacion) => {
    const fc = combinacion.conteos.reduce((sum, item) => sum + item.fc, 0);
    const fa = combinacion.conteos.reduce((sum, item) => sum + item.fa, 0);

    return {
      id: combinacion.id,
      semana: combinacion.semana.numero,
      lote: combinacion.lote.nombre,
      sector: combinacion.sector.nombre,
      variedad: combinacion.variedad.nombre,
      fc,
      fa
    };
  });

  return NextResponse.json({
    anio,
    semana,
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1)
  });
}