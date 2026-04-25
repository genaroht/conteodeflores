import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  crearSessionConExpiracion,
  crearSessionValue,
  SESSION_COOKIE_NAME
} from "@/lib/session";
import { loginSchema } from "@/lib/validations";
import { normalizarUsuario } from "@/lib/utils";

function rutaInicialPorRol(rol: string) {
  if (rol === "ADMIN" || rol === "ENCARGADO_AREA") {
    return "/dashboard";
  }

  return "/combinaciones";
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Datos inválidos."
      },
      {
        status: 400
      }
    );
  }

  const usuarioInput = normalizarUsuario(parsed.data.usuario);

  const usuario = await prisma.usuario.findUnique({
    where: {
      usuario: usuarioInput
    }
  });

  if (!usuario || !usuario.activo) {
    return NextResponse.json(
      {
        ok: false,
        message: "Usuario o clave incorrectos."
      },
      {
        status: 401
      }
    );
  }

  const passwordValida = await compare(parsed.data.password, usuario.password);

  if (!passwordValida) {
    return NextResponse.json(
      {
        ok: false,
        message: "Usuario o clave incorrectos."
      },
      {
        status: 401
      }
    );
  }

  const sessionValue = crearSessionValue(
    crearSessionConExpiracion({
      id: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      rol: usuario.rol
    })
  );

  const response = NextResponse.json({
    ok: true,
    message: "Login correcto.",
    redirectTo: rutaInicialPorRol(usuario.rol)
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}