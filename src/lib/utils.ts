import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizarUsuario(valor: string): string {
  return valor.trim().toLowerCase();
}

export function normalizarTexto(valor: string): string {
  return valor.trim().replace(/\s+/g, " ").toUpperCase();
}

export function convertirVacioACero(valor: unknown): number {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  const numero = Number(valor);

  if (Number.isNaN(numero) || numero < 0) {
    return 0;
  }

  return Math.trunc(numero);
}

export function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

export function hoyInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatearFecha(fecha: Date | string): string {
  const date = typeof fecha === "string" ? new Date(fecha) : fecha;

  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}