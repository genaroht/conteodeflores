import { NextResponse } from "next/server";

import { puedeModificarRegistro } from "@/lib/permissions";
import { calcularSemana } from "@/lib/semana";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { combinacionSchema } from "@/lib/validations";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.combinacion.findUnique({
    where: {
      id
    },
    include: {
      semana: true,
      lote: true,
      sector: true,
      variedad: true,
      conteos: {
        include: {
          planta: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!item) {
    return NextResponse.json({ message: "No encontrado." }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const actual = await prisma.combinacion.findUnique({
    where: { id }
  });

  if (!actual) {
    return NextResponse.json({ message: "No encontrado." }, { status: 404 });
  }

  if (
    !puedeModificarRegistro({
      session,
      createdAt: actual.createdAt,
      createdById: actual.createdById
    })
  ) {
    return NextResponse.json(
      {
        message:
          "No tienes permiso para editar esta combinación. Solo ADMIN puede editar días anteriores."
      },
      { status: 403 }
    );
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

  const duplicado = await prisma.combinacion.findFirst({
    where: {
      id: {
        not: id
      },
      semanaId: semana.id,
      loteId: parsed.data.loteId,
      sectorId: parsed.data.sectorId,
      variedadId: parsed.data.variedadId
    }
  });

  if (duplicado) {
    return NextResponse.json(
      {
        message:
          "Ya existe una combinación con la misma semana, lote, sector y variedad."
      },
      { status: 400 }
    );
  }

  const item = await prisma.combinacion.update({
    where: { id },
    data: {
      fecha: new Date(`${parsed.data.fecha}T12:00:00.000Z`),
      semanaId: semana.id,
      loteId: parsed.data.loteId,
      sectorId: parsed.data.sectorId,
      variedadId: parsed.data.variedadId
    }
  });

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const actual = await prisma.combinacion.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          conteos: true
        }
      }
    }
  });

  if (!actual) {
    return NextResponse.json({ message: "No encontrado." }, { status: 404 });
  }

  if (
    !puedeModificarRegistro({
      session,
      createdAt: actual.createdAt,
      createdById: actual.createdById
    })
  ) {
    return NextResponse.json(
      {
        message:
          "No tienes permiso para eliminar esta combinación. Solo ADMIN puede eliminar días anteriores."
      },
      { status: 403 }
    );
  }

  await prisma.combinacion.delete({
    where: {
      id
    }
  });

  return NextResponse.json({
    ok: true,
    message: `Combinación eliminada. También se eliminaron ${actual._count.conteos} conteo(s).`
  });
}