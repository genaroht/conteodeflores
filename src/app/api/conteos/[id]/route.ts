import { NextResponse } from "next/server";

import { puedeModificarRegistro } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { conteoUpdateSchema } from "@/lib/validations";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const conteo = await prisma.conteo.findUnique({
    where: { id }
  });

  if (!conteo) {
    return NextResponse.json({ message: "Conteo no encontrado." }, { status: 404 });
  }

  if (
    !puedeModificarRegistro({
      session,
      createdAt: conteo.createdAt,
      createdById: conteo.createdById
    })
  ) {
    return NextResponse.json(
      {
        message:
          "No tienes permiso para editar este conteo. Solo ADMIN puede editar días anteriores."
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = conteoUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const item = await prisma.conteo.update({
    where: { id },
    data: {
      fc: parsed.data.fc,
      fa: parsed.data.fa
    },
    include: {
      planta: true
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

  const conteo = await prisma.conteo.findUnique({
    where: { id }
  });

  if (!conteo) {
    return NextResponse.json({ message: "Conteo no encontrado." }, { status: 404 });
  }

  if (
    !puedeModificarRegistro({
      session,
      createdAt: conteo.createdAt,
      createdById: conteo.createdById
    })
  ) {
    return NextResponse.json(
      {
        message:
          "No tienes permiso para eliminar este conteo. Solo ADMIN puede eliminar días anteriores."
      },
      { status: 403 }
    );
  }

  await prisma.conteo.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}