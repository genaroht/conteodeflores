import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { calcularSemana, formatearFechaInput } from "@/lib/semana";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { combinacionSchema } from "@/lib/validations";

function crearRangoFecha(fecha?: string | null) {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return null;
  }

  const inicio = new Date(`${fecha}T00:00:00.000Z`);
  const fin = new Date(inicio);
  fin.setUTCDate(fin.getUTCDate() + 1);

  return {
    gte: inicio,
    lt: fin
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
  const rangoFecha = crearRangoFecha(fecha);

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
    ...(rangoFecha
      ? {
          fecha: rangoFecha
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

  const [total, items] = await Promise.all([
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

  const existente = await prisma.combinacion.findUnique({
    where: {
      semanaId_loteId_sectorId_variedadId: {
        semanaId: semana.id,
        loteId: parsed.data.loteId,
        sectorId: parsed.data.sectorId,
        variedadId: parsed.data.variedadId
      }
    }
  });

  if (existente) {
    return NextResponse.json({
      item: existente,
      message: "La combinación ya existía."
    });
  }

  const item = await prisma.combinacion.create({
    data: {
      fecha: new Date(`${parsed.data.fecha}T12:00:00.000Z`),
      semanaId: semana.id,
      loteId: parsed.data.loteId,
      sectorId: parsed.data.sectorId,
      variedadId: parsed.data.variedadId,
      createdById: session.id
    }
  });

  return NextResponse.json({
    item,
    fecha: formatearFechaInput(item.fecha)
  });
}