import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { conteosSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = conteosSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const acumulados = new Map<string, { plantaId: string; fc: number; fa: number }>();

  let duplicadosEnFormulario = 0;

  for (const fila of parsed.data.filas) {
    const existente = acumulados.get(fila.plantaId);

    if (existente) {
      duplicadosEnFormulario += 1;
      existente.fc += fila.fc || 0;
      existente.fa += fila.fa || 0;
    } else {
      acumulados.set(fila.plantaId, {
        plantaId: fila.plantaId,
        fc: fila.fc || 0,
        fa: fila.fa || 0
      });
    }
  }

  let insertados = 0;
  let actualizados = 0;

  for (const fila of acumulados.values()) {
    const existente = await prisma.conteo.findUnique({
      where: {
        combinacionId_plantaId: {
          combinacionId: parsed.data.combinacionId,
          plantaId: fila.plantaId
        }
      }
    });

    if (existente) {
      actualizados += 1;
    } else {
      insertados += 1;
    }

    await prisma.conteo.upsert({
      where: {
        combinacionId_plantaId: {
          combinacionId: parsed.data.combinacionId,
          plantaId: fila.plantaId
        }
      },
      update: {
        fc: fila.fc,
        fa: fila.fa,
        createdById: session.id
      },
      create: {
        combinacionId: parsed.data.combinacionId,
        plantaId: fila.plantaId,
        fc: fila.fc,
        fa: fila.fa,
        createdById: session.id
      }
    });
  }

  const partes: string[] = [];

  if (insertados > 0) {
    partes.push(`${insertados} conteo(s) registrado(s)`);
  }

  if (actualizados > 0) {
    partes.push(`${actualizados} conteo(s) actualizado(s) porque la planta ya tenía conteo`);
  }

  if (duplicadosEnFormulario > 0) {
    partes.push(`${duplicadosEnFormulario} fila(s) repetida(s) dentro del formulario fueron unificadas`);
  }

  return NextResponse.json({
    ok: true,
    insertados,
    actualizados,
    duplicadosEnFormulario,
    message: partes.length ? partes.join(". ") : "Conteos guardados correctamente."
  });
}