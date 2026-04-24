import { hash } from "bcryptjs";
import { Rol } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { usuarioSchema } from "@/lib/validations";
import { normalizarUsuario } from "@/lib/utils";

export async function GET() {
  const session = await getSession();

  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const items = await prisma.usuario.findMany({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      usuario: true,
      nombre: true,
      rol: true,
      activo: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    items
  });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = usuarioSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const password = await hash(parsed.data.password, 10);

  const item = await prisma.usuario.create({
    data: {
      usuario: normalizarUsuario(parsed.data.usuario),
      nombre: parsed.data.nombre,
      password,
      rol: parsed.data.rol as Rol,
      activo: parsed.data.activo
    },
    select: {
      id: true,
      usuario: true,
      nombre: true,
      rol: true,
      activo: true
    }
  });

  return NextResponse.json({
    item
  });
}