import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { rolReal } from "@/lib/permissions";
import { calcularSemana } from "@/lib/semana";
import { getSession } from "@/lib/session";

type DashboardItem = {
  id: string;
  semana: number;
  lote: string;
  sector: string;
  variedad: string;
  registradoPor: string;
  fc: number;
  fa: number;
};

function numeroFiltro(value: string | null, fallback: number) {
  const numero = Number(value || fallback);

  if (!Number.isFinite(numero) || numero <= 0) {
    return fallback;
  }

  return Math.trunc(numero);
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const rol = rolReal(session.rol);

  if (rol !== "ADMIN" && rol !== "ENCARGADO_AREA") {
    return NextResponse.json(
      { message: "No tienes permiso para ver el dashboard." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);

  const actual = calcularSemana(new Date().toISOString().slice(0, 10));

  const anio = numeroFiltro(searchParams.get("anio"), actual.anio);
  const semana = numeroFiltro(searchParams.get("semana"), actual.numero);
  const loteId = searchParams.get("loteId") || undefined;
  const sectorId = searchParams.get("sectorId") || undefined;
  const usuarioId = searchParams.get("usuarioId") || undefined;

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || 9), 1),
    60
  );

  const where: Prisma.ConteoWhereInput = {
    ...(usuarioId ? { createdById: usuarioId } : {}),
    combinacion: {
      semana: {
        anio,
        numero: semana
      },
      ...(loteId ? { loteId } : {}),
      ...(sectorId ? { sectorId } : {})
    }
  };

  const [grupos, usuariosFiltro] = await Promise.all([
    prisma.conteo.groupBy({
      by: ["combinacionId", "createdById"],
      where,
      _sum: {
        fc: true,
        fa: true
      }
    }),
    prisma.usuario.findMany({
      where: {
        activo: true
      },
      orderBy: [
        {
          nombre: "asc"
        },
        {
          usuario: "asc"
        }
      ],
      select: {
        id: true,
        nombre: true,
        usuario: true
      }
    })
  ]);

  const combinacionIds = Array.from(
    new Set(grupos.map((grupo) => grupo.combinacionId))
  );

  const usuarioIds = Array.from(
    new Set(
      grupos
        .map((grupo) => grupo.createdById)
        .filter((id): id is string => Boolean(id))
    )
  );

  const [combinaciones, usuarios] = await Promise.all([
    combinacionIds.length > 0
      ? prisma.combinacion.findMany({
          where: {
            id: {
              in: combinacionIds
            }
          },
          include: {
            semana: true,
            lote: true,
            sector: true,
            variedad: true,
            createdBy: {
              select: {
                id: true,
                nombre: true,
                usuario: true
              }
            }
          }
        })
      : Promise.resolve([]),
    usuarioIds.length > 0
      ? prisma.usuario.findMany({
          where: {
            id: {
              in: usuarioIds
            }
          },
          select: {
            id: true,
            nombre: true,
            usuario: true
          }
        })
      : Promise.resolve([])
  ]);

  const combinacionesPorId = new Map(
    combinaciones.map((combinacion) => [combinacion.id, combinacion])
  );

  const usuariosPorId = new Map(
    usuarios.map((usuario) => [usuario.id, usuario])
  );

  const itemsCompletos: DashboardItem[] = grupos
    .map((grupo) => {
      const combinacion = combinacionesPorId.get(grupo.combinacionId);

      if (!combinacion) {
        return null;
      }

      const usuarioConteo = grupo.createdById
        ? usuariosPorId.get(grupo.createdById)
        : null;

      const registradoPor =
        usuarioConteo?.nombre ||
        usuarioConteo?.usuario ||
        combinacion.createdBy?.nombre ||
        combinacion.createdBy?.usuario ||
        "Sin usuario";

      return {
        id: `${grupo.combinacionId}-${grupo.createdById || "sin-usuario"}`,
        semana: combinacion.semana.numero,
        lote: combinacion.lote.nombre,
        sector: combinacion.sector.nombre,
        variedad: combinacion.variedad.nombre,
        registradoPor,
        fc: grupo._sum.fc || 0,
        fa: grupo._sum.fa || 0
      };
    })
    .filter((item): item is DashboardItem => Boolean(item))
    .sort((a, b) => {
      const lote = a.lote.localeCompare(b.lote, "es", { numeric: true });

      if (lote !== 0) return lote;

      const sector = a.sector.localeCompare(b.sector, "es", {
        numeric: true
      });

      if (sector !== 0) return sector;

      const variedad = a.variedad.localeCompare(b.variedad, "es", {
        numeric: true
      });

      if (variedad !== 0) return variedad;

      return a.registradoPor.localeCompare(b.registradoPor, "es", {
        numeric: true
      });
    });

  const total = itemsCompletos.length;
  const items = itemsCompletos.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    anio,
    semana,
    items,
    usuariosFiltro,
    page,
    pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1)
  });
}