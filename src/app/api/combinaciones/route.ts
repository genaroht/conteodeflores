import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { crearFechaUtcMediodia, obtenerFechaInput } from "@/lib/fecha";
import { calcularSemana } from "@/lib/semana";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { combinacionSchema } from "@/lib/validations";

function crearFiltroFechaExacta(fecha?: string | null): Prisma.DateTimeFilter | null {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return null;
  }

  // La columna es DATE. Usamos mediodía UTC para evitar desfases de zona horaria
  // al comparar desde JavaScript/Prisma/PostgreSQL.
  return {
    equals: crearFechaUtcMediodia(fecha)
  };
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || 10), 1),
    100
  );

  const q = searchParams.get("q")?.trim() || "";
  const fecha = searchParams.get("fecha");
  const exact = searchParams.get("exact") === "1";
  const buscarExacto = exact && /^\d+$/.test(q);
  const filtroFechaExacta = crearFiltroFechaExacta(fecha);

  const filtroTexto: Prisma.StringFilter | undefined = q
    ? buscarExacto
      ? {
          equals: q,
          mode: "insensitive"
        }
      : {
          contains: q,
          mode: "insensitive"
        }
    : undefined;

  const where: Prisma.CombinacionWhereInput = {
    ...(session.rol === "OPERADOR" || session.rol === "USUARIO"
      ? {
          createdById: session.id
        }
      : {}),
    ...(filtroFechaExacta
      ? {
          fecha: filtroFechaExacta
        }
      : {}),
    ...(filtroTexto
      ? {
          OR: [
            {
              lote: {
                nombre: filtroTexto
              }
            },
            {
              sector: {
                nombre: filtroTexto
              }
            },
            {
              variedad: {
                nombre: filtroTexto
              }
            }
          ]
        }
      : {})
  };

  const [total, itemsDb] = await Promise.all([
    prisma.combinacion.count({ where }),
    prisma.combinacion.findMany({
      where,
      include: {
        semana: true,
        lote: true,
        sector: true,
        variedad: true,
        _count: {
          select: {
            conteos: true
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

  const items = itemsDb.map((item) => ({
    ...item,
    fecha: obtenerFechaInput(item.fecha)
  }));

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1)
  });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = combinacionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const semanaCalculada = calcularSemana(parsed.data.fecha);

  const semana = await prisma.semana.upsert({
    where: {
      anio_numero: {
        anio: semanaCalculada.anio,
        numero: semanaCalculada.numero
      }
    },
    update: {
      fechaInicio: semanaCalculada.fechaInicio,
      fechaFin: semanaCalculada.fechaFin
    },
    create: {
      anio: semanaCalculada.anio,
      numero: semanaCalculada.numero,
      fechaInicio: semanaCalculada.fechaInicio,
      fechaFin: semanaCalculada.fechaFin
    }
  });

  const fechaCombinacion = crearFechaUtcMediodia(parsed.data.fecha);

  const existente = await prisma.combinacion.findUnique({
    where: {
      fecha_loteId_sectorId_variedadId: {
        fecha: fechaCombinacion,
        loteId: parsed.data.loteId,
        sectorId: parsed.data.sectorId,
        variedadId: parsed.data.variedadId
      }
    }
  });

  if (existente) {
    return NextResponse.json({
      item: {
        ...existente,
        fecha: obtenerFechaInput(existente.fecha)
      },
      message: "La combinación ya existía para esa fecha."
    });
  }

  const item = await prisma.combinacion.create({
    data: {
      fecha: fechaCombinacion,
      semanaId: semana.id,
      loteId: parsed.data.loteId,
      sectorId: parsed.data.sectorId,
      variedadId: parsed.data.variedadId,
      createdById: session.id
    }
  });

  return NextResponse.json({
    item: {
      ...item,
      fecha: obtenerFechaInput(item.fecha)
    }
  });
}