import { NextResponse } from "next/server";

import { puedeGestionarMaestros } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { loteSchema } from "@/lib/validations";
import { normalizarTexto } from "@/lib/utils";

function getParams(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || 10), 1),
    500
  );
  const q = searchParams.get("q")?.trim() || "";
  const exact = searchParams.get("exact") === "1";
  const buscarExacto = exact && /^\d+$/.test(q);

  return { page, pageSize, q, buscarExacto };
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { page, pageSize, q, buscarExacto } = getParams(request);

  const where = q
    ? {
        nombre: buscarExacto
          ? {
              equals: q,
              mode: "insensitive" as const
            }
          : {
              contains: q,
              mode: "insensitive" as const
            }
      }
    : {};

  const [total, items] = await Promise.all([
    prisma.lote.count({ where }),
    prisma.lote.findMany({
      where,
      orderBy: {
        nombre: "asc"
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

  if (!session || !puedeGestionarMaestros(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = loteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const nombre = normalizarTexto(parsed.data.nombre);

  const item = await prisma.lote.upsert({
    where: {
      nombre
    },
    update: {},
    create: {
      nombre
    }
  });

  return NextResponse.json({ item });
}