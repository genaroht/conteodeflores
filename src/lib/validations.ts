import { z } from "zod";

const textoObligatorio = z
  .string({
    required_error: "Este campo es obligatorio."
  })
  .trim()
  .min(1, "Este campo es obligatorio.");

const textoOpcional = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() ? value.trim() : undefined));

const numeroNoNegativo = z.coerce
  .number({
    invalid_type_error: "Debe ser un número."
  })
  .min(0, "No puede ser negativo.")
  .transform((value) => Math.trunc(value));

export const loginSchema = z.object({
  usuario: textoObligatorio,
  password: textoObligatorio
});

export const usuarioSchema = z.object({
  usuario: textoObligatorio,
  nombre: textoObligatorio,
  password: z.string().min(6, "La clave debe tener al menos 6 caracteres."),
  rol: z.enum(["ADMIN", "ENCARGADO_AREA", "OPERADOR"]).default("OPERADOR"),
  activo: z.boolean().default(true)
});

export const usuarioUpdateSchema = z.object({
  usuario: textoObligatorio,
  nombre: textoObligatorio,
  password: textoOpcional,
  rol: z.enum(["ADMIN", "ENCARGADO_AREA", "OPERADOR"]),
  activo: z.boolean()
});

export const loteSchema = z.object({
  nombre: textoObligatorio
});

export const sectorSchema = z.object({
  nombre: textoObligatorio,
  loteId: textoObligatorio
});

export const variedadSchema = z.object({
  nombre: textoObligatorio
});

export const plantaSchema = z.object({
  numero: textoObligatorio
});

export const combinacionSchema = z.object({
  fecha: textoObligatorio,
  loteId: textoObligatorio,
  sectorId: textoObligatorio,
  variedadId: textoObligatorio
});

export const conteoFilaSchema = z.object({
  plantaId: textoObligatorio,
  fc: numeroNoNegativo.default(0),
  fa: numeroNoNegativo.default(0)
});

export const conteosSchema = z.object({
  combinacionId: textoObligatorio,
  filas: z.array(conteoFilaSchema).min(1, "Agrega al menos una fila.")
});

export const conteoUpdateSchema = z.object({
  fc: numeroNoNegativo.default(0),
  fa: numeroNoNegativo.default(0)
});