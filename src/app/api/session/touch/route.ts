import { NextResponse } from "next/server";

import {
  crearSessionConExpiracion,
  crearSessionValue,
  getSession,
  SESSION_COOKIE_NAME
} from "@/lib/session";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sesión expirada."
      },
      {
        status: 401
      }
    );
  }

  const refreshed = crearSessionConExpiracion({
    id: session.id,
    usuario: session.usuario,
    nombre: session.nombre,
    rol: session.rol
  });

  const response = NextResponse.json({
    ok: true
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: crearSessionValue(refreshed),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}