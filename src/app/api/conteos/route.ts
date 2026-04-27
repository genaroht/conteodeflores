import { NextResponse } from "next/server";
import { z } from "zod";

import { puedeModificarRegistro } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const numeroPlantaSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => value.length > 0, {
    message: "La planta es obligatoria."
  })
  .refine((value) => /^\d+$/.test(value), {
    message: "La planta debe ser un número entero. No se permiten decimales."
  })
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value) && value > 0, {
    message: "La planta debe ser un número entero mayor que 0."
  })
  .transform((value) => String(value));

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

const conteosSchema = z.object({
  combinacionId: z.string().min(1),
  filas: z
    .array(
      z.object({
        plantaNumero: numeroPlantaSchema,
        fc: numeroEnteroSchema,
        fa: numeroEnteroSchema
      })
    )
    .min(1, "Debes registrar al menos una fila.")
});

function obtenerRepetidos(valores: string[]) {
  const contador = new Map<string, number>();

  for (const valor of valores) {
    contador.set(valor, (contador.get(valor) || 0) + 1);
  }

  return Array.from(contador.entries())
    .filter(([, cantidad]) => cantidad > 1)
    .map(([valor]) => valor);
}

function esOperadorOSuario(rol: string) {
  return rol === "OPERADOR" || rol === "USUARIO";
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const combinacionId = searchParams.get("combinacionId") || "";
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || 20), 1),
    100
  );

  if (!combinacionId) {
    return NextResponse.json(
      { message: "Falta combinacionId." },
      { status: 400 }
    );
  }

  const combinacion = await prisma.combinacion.findUnique({
    where: {
      id: combinacionId
    },
    select: {
      id: true,
      createdById: true
    }
  });

  if (!combinacion) {
    return NextResponse.json(
      { message: "La combinación no existe." },
      { status: 404 }
    );
  }

  if (
    esOperadorOSuario(session.rol) &&
    combinacion.createdById !== session.id
  ) {
    return NextResponse.json(
      { message: "No tienes permiso para ver esta combinación." },
      { status: 403 }
    );
  }

  const where = {
    combinacionId
  };

  const [total, items] = await Promise.all([
    prisma.conteo.count({ where }),
    prisma.conteo.findMany({
      where,
      include: {
        planta: true
      },
      orderBy: {
        planta: {
          numero: "asc"
        }
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
  const parsed = conteosSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message || "Datos inválidos."
      },
      { status: 400 }
    );
  }

  const { combinacionId, filas } = parsed.data;

  const combinacion = await prisma.combinacion.findUnique({
    where: {
      id: combinacionId
    },
    select: {
      id: true,
      createdAt: true,
      createdById: true
    }
  });

  if (!combinacion) {
    return NextResponse.json(
      { message: "La combinación no existe." },
      { status: 404 }
    );
  }

  if (
    !puedeModificarRegistro({
      session,
      createdAt: combinacion.createdAt,
      createdById: combinacion.createdById
    })
  ) {
    return NextResponse.json(
      {
        message:
          "No tienes permiso para registrar conteos en esta combinación."
      },
      { status: 403 }
    );
  }

  const plantasEnFormulario = filas.map((fila) => fila.plantaNumero);
  const plantasRepetidasEnFormulario = obtenerRepetidos(plantasEnFormulario);

  if (plantasRepetidasEnFormulario.length > 0) {
    return NextResponse.json(
      {
        message: `Hay plantas repetidas en las filas: ${plantasRepetidasEnFormulario.join(
          ", "
        )}. Cada planta solo puede tener un conteo por combinación.`
      },
      { status: 400 }
    );
  }

  const conteosExistentes = await prisma.conteo.findMany({
    where: {
      combinacionId,
      planta: {
        numero: {
          in: plantasEnFormulario
        }
      }
    },
    include: {
      planta: true
    }
  });

  if (conteosExistentes.length > 0) {
    const plantasDuplicadas = conteosExistentes
      .map((conteo) => conteo.planta.numero)
      .join(", ");

    return NextResponse.json(
      {
        message: `La planta ${plantasDuplicadas} ya tiene conteo en esta combinación. Edita el conteo guardado en vez de volver a registrarlo.`
      },
      { status: 409 }
    );
  }

  try {
    const creados = await prisma.$transaction(async (tx) => {
      const resultados = [];

      for (const fila of filas) {
        const planta = await tx.planta.upsert({
          where: {
            numero: fila.plantaNumero
          },
          update: {},
          create: {
            numero: fila.plantaNumero
          }
        });

        const conteo = await tx.conteo.create({
          data: {
            combinacionId,
            plantaId: planta.id,
            fc: fila.fc,
            fa: fila.fa,
            createdById: session.id
          },
          include: {
            planta: true
          }
        });

        resultados.push(conteo);
      }

      return resultados;
    });

    return NextResponse.json({
      ok: true,
      message: `Se guardaron ${creados.length} conteo(s).`,
      items: creados
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "No se pudo guardar. Verifica que las plantas no estén repetidas en esta combinación."
      },
      { status: 400 }
    );
  }
}