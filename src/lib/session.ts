import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "conteodeflores_session";
export const SESSION_MAX_INACTIVITY_MS = 10 * 60 * 1000;

export type AppRol = "ADMIN" | "ENCARGADO_AREA" | "OPERADOR" | "USUARIO";

export type AppSession = {
  id: string;
  usuario: string;
  nombre: string;
  rol: AppRol;
  expiresAt?: number;
};

function encodeBase64Url(valor: string): string {
  return Buffer.from(valor, "utf8").toString("base64url");
}

function decodeBase64Url(valor: string): string {
  return Buffer.from(valor, "base64url").toString("utf8");
}

export function crearSessionValue(session: AppSession): string {
  return encodeBase64Url(JSON.stringify(session));
}

export function crearSessionConExpiracion(session: Omit<AppSession, "expiresAt">): AppSession {
  return {
    ...session,
    expiresAt: Date.now() + SESSION_MAX_INACTIVITY_MS
  };
}

export function leerSessionValue(value?: string): AppSession | null {
  if (!value) {
    return null;
  }

  try {
    const data = JSON.parse(decodeBase64Url(value)) as AppSession;

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

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return leerSessionValue(value);
}