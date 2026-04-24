import { NextResponse } from "next/server";

import { puedeUsarExcel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, { params }: Params) {
  const session = await getSession();

  if (!session || !puedeUsarExcel(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const hardDelete = searchParams.get("hard") === "1";

  const importacion = await prisma.importacionExcel.findUnique({
    where: {
      id
    }
  });

  if (!importacion) {
    return NextResponse.json(
      {
        message: "Importación no encontrada."
      },
      { status: 404 }
    );
  }

  if (hardDelete) {
    if (session.rol !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Solo ADMIN puede borrar definitivamente el historial."
        },
        { status: 403 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const conteosEliminados = await tx.conteo.deleteMany({
        where: {
          importacionId: id
        }
      });

      const combinacionesVacias = await tx.combinacion.findMany({
        where: {
          createdFromImportacionId: id,
          conteos: {
            none: {}
          }
        },
        select: {
          id: true
        }
      });

      const combinacionesEliminadas = await tx.combinacion.deleteMany({
        where: {
          id: {
            in: combinacionesVacias.map((item) => item.id)
          }
        }
      });

      await tx.importacionExcel.delete({
        where: {
          id
        }
      });

      return {
        conteosEliminados: conteosEliminados.count,
        combinacionesEliminadas: combinacionesEliminadas.count
      };
    });

    return NextResponse.json({
      ok: true,
      message: `Historial borrado definitivamente. Conteos eliminados: ${resultado.conteosEliminados}. Combinaciones vacías eliminadas: ${resultado.combinacionesEliminadas}.`
    });
  }

  if (importacion.estado === "ELIMINADO") {
    return NextResponse.json(
      {
        message: "Esta importación ya fue eliminada."
      },
      { status: 400 }
    );
  }

  if (importacion.estado === "ERROR") {
    await prisma.importacionExcel.update({
      where: {
        id
      },
      data: {
        estado: "ELIMINADO",
        deletedAt: new Date(),
        deletedById: session.id
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Registro de importación eliminado. No había conteos cargados."
    });
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const conteosEliminados = await tx.conteo.deleteMany({
      where: {
        importacionId: id
      }
    });

    const combinacionesVacias = await tx.combinacion.findMany({
      where: {
        createdFromImportacionId: id,
        conteos: {
          none: {}
        }
      },
      select: {
        id: true
      }
    });

    const combinacionesEliminadas = await tx.combinacion.deleteMany({
      where: {
        id: {
          in: combinacionesVacias.map((item) => item.id)
        }
      }
    });

    await tx.importacionExcel.update({
      where: {
        id
      },
      data: {
        estado: "ELIMINADO",
        deletedAt: new Date(),
        deletedById: session.id
      }
    });

    return {
      conteosEliminados: conteosEliminados.count,
      combinacionesEliminadas: combinacionesEliminadas.count
    };
  });

  return NextResponse.json({
    ok: true,
    message: `Carga eliminada. Conteos eliminados: ${resultado.conteosEliminados}. Combinaciones vacías eliminadas: ${resultado.combinacionesEliminadas}.`
  });
}