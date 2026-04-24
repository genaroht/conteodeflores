import { NextResponse } from "next/server";

import { puedeUsarExcel } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session || !puedeUsarExcel(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || 10), 1),
    100
  );

  const [total, items] = await Promise.all([
    prisma.importacionExcel.count(),
    prisma.importacionExcel.findMany({
      include: {
        createdBy: {
          select: {
            usuario: true,
            nombre: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
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