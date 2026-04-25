import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const conteoUpdateSchema = z.object({
  fc: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return 0;
      }

      const numero = Number(value);

      if (!Number.isFinite(numero)) {
        return Number.NaN;
      }

      return Math.trunc(numero);
    })
    .refine((value) => Number.isInteger(value) && value >= 0, {
      message: "FC debe ser un número entero mayor o igual a 0."
    }),
  fa: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return 0;
      }

      const numero = Number(value);

      if (!Number.isFinite(numero)) {
        return Number.NaN;
      }

      return Math.trunc(numero);
    })
    .refine((value) => Number.isInteger(value) && value >= 0, {
      message: "FA debe ser un número entero mayor o igual a 0."
    })
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