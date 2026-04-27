import { NextResponse } from "next/server";
import { z } from "zod";

import { puedeModificarRegistro } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const numeroEnteroSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === "" || value === null || value === undefined) {
      return 0;
    }

    if (typeof value === "string") {
      const limpio = value.trim();

      if (limpio === "") {
        return 0;
      }

      if (!/^\d+$/.test(limpio)) {
        return Number.NaN;
      }

      return Number(limpio);
    }

    return value;
  })
  .refine((value) => Number.isSafeInteger(value) && value >= 0, {
    message:
      "FC y FA deben ser números enteros mayores o iguales a 0. No se permiten decimales."
  });

const conteoUpdateSchema = z.object({
  fc: numeroEnteroSchema,
  fa: numeroEnteroSchema
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const parsed = conteoUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message || "Datos inválidos."
      },
      { status: 400 }
    );
  }

  const existe = await prisma.conteo.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      createdAt: true,
      createdById: true
    }
  });

  if (!existe) {
    return NextResponse.json(
      {
        message: "Conteo no encontrado."
      },
      { status: 404 }
    );
  }

  if (
    !puedeModificarRegistro({
      session,
      createdAt: existe.createdAt,
      createdById: existe.createdById
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

  const item = await prisma.conteo.update({
    where: {
      id
    },
    data: {
      fc: parsed.data.fc,
      fa: parsed.data.fa
    },
    include: {
      planta: true
    }
  });

  return NextResponse.json({
    ok: true,
    message: "Conteo actualizado correctamente.",
    item
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const existe = await prisma.conteo.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      createdAt: true,
      createdById: true
    }
  });

  if (!existe) {
    return NextResponse.json(
      {
        message: "Conteo no encontrado."
      },
      { status: 404 }
    );
  }

  if (
    !puedeModificarRegistro({
      session,
      createdAt: existe.createdAt,
      createdById: existe.createdById
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
    where: {
      id
    }
  });

  return NextResponse.json({
    ok: true,
    message: "Conteo eliminado correctamente."
  });
}