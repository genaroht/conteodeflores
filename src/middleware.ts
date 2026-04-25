import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "conteodeflores_session";

const rutasProtegidas = [
  "/dashboard",
  "/combinaciones",
  "/reportes",
  "/excel",
  "/usuarios",
  "/maestros",
  "/perfil"
];

type SessionData = {
  id?: string;
  usuario?: string;
  rol?: string;
  expiresAt?: number;
};

function decodeBase64Url(valor: string): string {
  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function leerSession(value?: string): SessionData | null {
  if (!value) {
    return null;
  }

  try {
    const data = JSON.parse(decodeBase64Url(value)) as SessionData;

    if (!data.id || !data.usuario || !data.rol) {
      return null;
    }

    if (data.expiresAt && data.expiresAt < Date.now()) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function redirigirLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0
  });

  return response;
}

function rolReal(rol?: string) {
  if (rol === "USUARIO") {
    return "OPERADOR";
  }

  return rol || "OPERADOR";
}

function puedeEntrar(pathname: string, rol: string) {
  if (pathname.startsWith("/dashboard")) {
    return rol === "ADMIN" || rol === "ENCARGADO_AREA";
  }

  if (pathname.startsWith("/maestros")) {
    return rol === "ADMIN" || rol === "ENCARGADO_AREA";
  }

  if (pathname.startsWith("/reportes")) {
    return rol === "ADMIN" || rol === "ENCARGADO_AREA";
  }

  if (pathname.startsWith("/excel")) {
    return rol === "ADMIN" || rol === "ENCARGADO_AREA";
  }

  if (pathname.startsWith("/usuarios")) {
    return rol === "ADMIN";
  }

  if (pathname.startsWith("/combinaciones")) {
    return true;
  }

  if (pathname.startsWith("/perfil")) {
    return true;
  }

  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esRutaProtegida = rutasProtegidas.some((ruta) =>
    pathname.startsWith(ruta)
  );

  if (!esRutaProtegida) {
    return NextResponse.next();
  }

  const sessionValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = leerSession(sessionValue);

  if (!session) {
    return redirigirLogin(request);
  }

  const rol = rolReal(session.rol);

  if (!puedeEntrar(pathname, rol)) {
    return NextResponse.redirect(new URL("/combinaciones", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/combinaciones/:path*",
    "/reportes/:path*",
    "/excel/:path*",
    "/usuarios/:path*",
    "/maestros/:path*",
    "/perfil/:path*"
  ]
};