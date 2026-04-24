import type { AppRol, AppSession } from "@/lib/session";

export function rolReal(rol?: AppRol | null): AppRol {
  if (rol === "USUARIO") {
    return "OPERADOR";
  }

  return rol || "OPERADOR";
}

export function esAdmin(rol?: AppRol | null): boolean {
  return rolReal(rol) === "ADMIN";
}

export function esEncargadoArea(rol?: AppRol | null): boolean {
  return rolReal(rol) === "ENCARGADO_AREA";
}

export function esOperador(rol?: AppRol | null): boolean {
  return rolReal(rol) === "OPERADOR";
}

export function puedeGestionarUsuarios(rol?: AppRol | null): boolean {
  return esAdmin(rol);
}

export function puedeGestionarMaestros(rol?: AppRol | null): boolean {
  return esAdmin(rol) || esEncargadoArea(rol);
}

export function puedeVerReportes(rol?: AppRol | null): boolean {
  return esAdmin(rol) || esEncargadoArea(rol);
}

export function puedeUsarExcel(rol?: AppRol | null): boolean {
  return esAdmin(rol) || esEncargadoArea(rol);
}

export function puedeRegistrar(rol?: AppRol | null): boolean {
  return esAdmin(rol) || esEncargadoArea(rol) || esOperador(rol);
}

export function fechaLima(fecha: Date | string): string {
  const date = typeof fecha === "string" ? new Date(fecha) : fecha;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function esDeHoy(fecha: Date | string): boolean {
  return fechaLima(fecha) === fechaLima(new Date());
}

export function puedeModificarRegistro(params: {
  session: AppSession;
  createdAt: Date | string;
  createdById?: string | null;
}): boolean {
  const rol = rolReal(params.session.rol);

  if (rol === "ADMIN") {
    return true;
  }

  if (!esDeHoy(params.createdAt)) {
    return false;
  }

  if (rol === "ENCARGADO_AREA") {
    return true;
  }

  if (rol === "OPERADOR") {
    return params.createdById === params.session.id;
  }

  return false;
}