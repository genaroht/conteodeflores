import { NextResponse } from "next/server";

import { puedeGestionarMaestros } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { variedadSchema } from "@/lib/validations";
import { normalizarTexto } from "@/lib/utils";

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
  const parsed = variedadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const item = await prisma.variedad.update({
    where: { id },
    data: {
      nombre: normalizarTexto(parsed.data.nombre)
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
    await prisma.variedad.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        message:
          "No se puede eliminar esta variedad porque tiene combinaciones relacionadas."
      },
      { status: 400 }
    );
  }
}