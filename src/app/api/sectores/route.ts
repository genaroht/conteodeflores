import { NextResponse } from "next/server";

import { puedeGestionarMaestros } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sectorSchema } from "@/lib/validations";
import { normalizarTexto } from "@/lib/utils";

function getParams(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || 10), 1),
    500
  );

  const q = searchParams.get("q")?.trim() || "";
  const loteId = searchParams.get("loteId") || undefined;
  const exact = searchParams.get("exact") === "1";

  const buscarNumeroExacto = exact && /^\d+$/.test(q);

  return {
    page,
    pageSize,
    q,
    loteId,
    buscarNumeroExacto
  };
}

function esNumero(value: string) {
  return /^-?\d+(\.\d+)?$/.test(value.trim());
}

function compararNombres(a: string, b: string) {
  const nombreA = a.trim();
  const nombreB = b.trim();

  if (esNumero(nombreA) && esNumero(nombreB)) {
    return Number(nombreA) - Number(nombreB);
  }

  return nombreA.localeCompare(nombreB, "es", {
    numeric: true,
    sensitivity: "base"
  });
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { page, pageSize, q, loteId, buscarNumeroExacto } = getParams(request);

  const where = {
    ...(loteId ? { loteId } : {}),

    ...(q
      ? buscarNumeroExacto
        ? {
            nombre: {
              equals: q,
              mode: "insensitive" as const
            }
          }
        : {
            OR: [
              {
                nombre: {
                  contains: q,
                  mode: "insensitive" as const
                }
              },
              {
                lote: {
                  nombre: {
                    contains: q,
                    mode: "insensitive" as const
                  }
                }
              }
            ]
          }
      : {})
  };

  const [total, itemsSinOrdenar] = await Promise.all([
    prisma.sector.count({ where }),
    prisma.sector.findMany({
      where,
      include: {
        lote: true
      }
    })
  ]);

  const itemsOrdenados = [...itemsSinOrdenar].sort((a, b) => {
    const loteCompare = compararNombres(a.lote.nombre, b.lote.nombre);

    if (loteCompare !== 0) {
      return loteCompare;
    }

    return compararNombres(a.nombre, b.nombre);
  });

  const items = itemsOrdenados.slice((page - 1) * pageSize, page * pageSize);

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

  if (!session || !puedeGestionarMaestros(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = sectorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const nombre = normalizarTexto(parsed.data.nombre);

  const item = await prisma.sector.upsert({
    where: {
      loteId_nombre: {
        loteId: parsed.data.loteId,
        nombre
      }
    },
    update: {},
    create: {
      loteId: parsed.data.loteId,
      nombre
    }
  });

  return NextResponse.json({ item });
}