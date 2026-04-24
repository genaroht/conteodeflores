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

function decodeBase64Url(valor: string): string {
  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function sessionValida(value?: string): boolean {
  if (!value) {
    return false;
  }

  try {
    const data = JSON.parse(decodeBase64Url(value)) as {
      id?: string;
      usuario?: string;
      rol?: string;
      expiresAt?: number;
    };

    if (!data.id || !data.usuario || !data.rol) {
      return false;
    }

    if (data.expiresAt && data.expiresAt < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esRutaProtegida = rutasProtegidas.some((ruta) =>
    pathname.startsWith(ruta)
  );

  if (!esRutaProtegida) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionValida(session)) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0
    });

    return response;
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