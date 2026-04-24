import { crearWorkbookBase } from "@/lib/excel";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

function crearFechaInicio(fecha: string) {
  return new Date(`${fecha}T00:00:00.000Z`);
}

function crearFechaFin(fecha: string) {
  return new Date(`${fecha}T23:59:59.999Z`);
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const semana = searchParams.get("semana");
  const loteId = searchParams.get("loteId");
  const variedadId = searchParams.get("variedadId");
  const fechaDesde = searchParams.get("fechaDesde");
  const fechaHasta = searchParams.get("fechaHasta");

  const fechaFiltro: {
    gte?: Date;
    lte?: Date;
  } = {};

  if (fechaDesde) {
    fechaFiltro.gte = crearFechaInicio(fechaDesde);
  }

  if (fechaHasta) {
    fechaFiltro.lte = crearFechaFin(fechaHasta);
  }

  const items = await prisma.conteo.findMany({
    where: {
      ...(session.rol === "OPERADOR" || session.rol === "USUARIO"
        ? { createdById: session.id }
        : {}),
      combinacion: {
        ...(loteId ? { loteId } : {}),
        ...(variedadId ? { variedadId } : {}),
        ...(Object.keys(fechaFiltro).length > 0
          ? {
              fecha: fechaFiltro
            }
          : {}),
        ...(semana
          ? {
              semana: {
                numero: Number(semana)
              }
            }
          : {})
      }
    },
    include: {
      planta: true,
      combinacion: {
        include: {
          semana: true,
          lote: true,
          sector: true,
          variedad: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const { workbook, worksheet } = crearWorkbookBase("Registros");

  for (const item of items) {
    worksheet.addRow([
      item.combinacion.semana.numero,
      item.combinacion.lote.nombre,
      item.combinacion.sector.nombre,
      item.combinacion.variedad.nombre,
      item.planta.numero,
      item.fc,
      item.fa
    ]);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const nombreArchivo =
    fechaDesde || fechaHasta
      ? `conteo-flores-${fechaDesde || "inicio"}-${fechaHasta || "fin"}.xlsx`
      : "conteo-flores.xlsx";

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${nombreArchivo}`
    }
  });
}