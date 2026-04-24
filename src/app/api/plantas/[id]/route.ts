import { NextResponse } from "next/server";

import { puedeGestionarMaestros } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { plantaSchema } from "@/lib/validations";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();

  if (!session || !puedeGestionarMaestros(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = plantaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const item = await prisma.planta.update({
    where: { id },
    data: {
      numero: parsed.data.numero.trim()
    }
  });

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();

  if (!session || !puedeGestionarMaestros(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.planta.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        message:
          "No se puede eliminar esta planta porque tiene conteos relacionados."
      },
      { status: 400 }
    );
  }
}