import { hash } from "bcryptjs";
import { Rol } from "@prisma/client";
import { NextResponse } from "next/server";

import { puedeGestionarUsuarios } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { usuarioUpdateSchema } from "@/lib/validations";
import { normalizarUsuario } from "@/lib/utils";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();

  if (!session || !puedeGestionarUsuarios(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const parsed = usuarioUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos." }, { status: 400 });
  }

  const data: {
    usuario: string;
    nombre: string;
    rol: Rol;
    activo: boolean;
    password?: string;
  } = {
    usuario: normalizarUsuario(parsed.data.usuario),
    nombre: parsed.data.nombre,
    rol: parsed.data.rol as Rol,
    activo: parsed.data.activo
  };

  if (parsed.data.password) {
    data.password = await hash(parsed.data.password, 10);
  }

  const item = await prisma.usuario.update({
    where: {
      id
    },
    data,
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

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();

  if (!session || !puedeGestionarUsuarios(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.id) {
    return NextResponse.json(
      {
        message: "No puedes inactivar tu propio usuario."
      },
      { status: 400 }
    );
  }

  const item = await prisma.usuario.update({
    where: {
      id
    },
    data: {
      activo: false
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
    item,
    message: "Usuario inactivado correctamente."
  });
}