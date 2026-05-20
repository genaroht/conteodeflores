import ExcelJS from "exceljs";
import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import {
  extraerNumeroSemana,
  normalizarEncabezadoExcel,
  obtenerTextoCelda
} from "@/lib/excel";
import { obtenerFechaInput } from "@/lib/fecha";
import { calcularSemana, obtenerRangoSemana } from "@/lib/semana";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { convertirVacioACero, normalizarTexto } from "@/lib/utils";

export const runtime = "nodejs";

const HEADERS_BASE = [
  "LOTE",
  "SECTOR",
  "VARIEDAD",
  "N° DE PLANTAS",
  "FC",
  "FA",
  "CUAJA"
];

const HEADERS_FECHA = ["FECHA", "SEMANA"];

type ResumenImportacion = {
  filasProcesadas: number;
  filasImportadas: number;
  filasConError: number;
  lotesCreados: number;
  sectoresCreados: number;
  variedadesCreadas: number;
  plantasCreadas: number;
  errores: string[];
};

type FilaExcel = {
  rowNumber: number;
  anio: number;
  semana: number;
  fecha: Date;
  lote: string;
  sector: string;
  variedad: string;
  planta: string;
  fc: number;
  fa: number;
  cuaja: number;
};

function headerCompatible(valor: string, requerido: string) {
  const limpio = valor.replace(/\s/g, "");
  const req = requerido.replace(/\s/g, "");

  if (req === "N°DEPLANTAS") {
    return (
      limpio === "N°DEPLANTAS" ||
      limpio === "NDEPLANTAS" ||
      limpio === "NRODEPLANTAS"
    );
  }

  return limpio === req;
}


const MS_POR_DIA = 24 * 60 * 60 * 1000;

function crearFechaUTCValida(anio: number, mes: number, dia: number) {
  const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  return fecha;
}

function fechaDesdeSerialExcel(serial: number) {
  if (!Number.isFinite(serial) || serial <= 0) {
    return null;
  }

  const dias = Math.floor(serial);

  // Excel usa un serial de días desde 1899-12-30 para representar fechas.
  const fecha = new Date(Date.UTC(1899, 11, 30 + dias, 12, 0, 0));

  return crearFechaUTCValida(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth() + 1,
    fecha.getUTCDate()
  );
}

function parsearFechaTextoExcel(textoEntrada: string) {
  const texto = textoEntrada.trim();

  if (!texto) {
    return null;
  }

  const textoNormalizado = texto.replace(/\./g, "/").replace(/-/g, "/");

  const ymd = textoNormalizado.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);

  if (ymd) {
    return crearFechaUTCValida(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
  }

  const dmyOmdy = textoNormalizado.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (dmyOmdy) {
    const parte1 = Number(dmyOmdy[1]);
    const parte2 = Number(dmyOmdy[2]);
    const anio = Number(dmyOmdy[3]);

    // En Perú lo normal es DD/MM/YYYY. Si la segunda parte es mayor a 12,
    // interpretamos como MM/DD/YYYY para soportar archivos exportados en inglés.
    const dia = parte2 > 12 && parte1 <= 12 ? parte2 : parte1;
    const mes = parte2 > 12 && parte1 <= 12 ? parte1 : parte2;

    return crearFechaUTCValida(anio, mes, dia);
  }

  const yyyymmdd = texto.match(/^(\d{4})(\d{2})(\d{2})$/);

  if (yyyymmdd) {
    return crearFechaUTCValida(
      Number(yyyymmdd[1]),
      Number(yyyymmdd[2]),
      Number(yyyymmdd[3])
    );
  }

  const serial = Number(texto.replace(",", "."));

  if (Number.isFinite(serial) && serial >= 1 && serial <= 80000) {
    return fechaDesdeSerialExcel(serial);
  }

  return null;
}

function obtenerFechaExcel(valor: ExcelJS.CellValue): Date | null {
  if (valor === null || valor === undefined) {
    return null;
  }

  if (valor instanceof Date) {
    // ExcelJS entrega las fechas como objetos Date. En zonas horarias como Perú,
    // usar getFullYear/getMonth/getDate puede mover la fecha un día hacia atrás
    // cuando el valor viene a medianoche UTC. Por eso siempre leemos el día UTC.
    return crearFechaUTCValida(
      valor.getUTCFullYear(),
      valor.getUTCMonth() + 1,
      valor.getUTCDate()
    );
  }

  if (typeof valor === "number") {
    return fechaDesdeSerialExcel(valor);
  }

  if (typeof valor === "string") {
    return parsearFechaTextoExcel(valor);
  }

  if (typeof valor === "object") {
    const valorObjeto = valor as {
      result?: ExcelJS.CellValue;
      text?: string;
      richText?: Array<{ text: string }>;
    };

    if (valorObjeto.result !== undefined) {
      return obtenerFechaExcel(valorObjeto.result);
    }

    if (valorObjeto.text) {
      return parsearFechaTextoExcel(valorObjeto.text);
    }

    if (Array.isArray(valorObjeto.richText)) {
      return parsearFechaTextoExcel(
        valorObjeto.richText.map((item) => item.text).join("")
      );
    }
  }

  return parsearFechaTextoExcel(obtenerTextoCelda(valor));
}

function crearClaveFecha(fecha: Date) {
  return obtenerFechaInput(fecha);
}

async function registrarImportacionError(params: {
  archivoNombre: string;
  createdById: string;
  resumen: ResumenImportacion;
}) {
  await prisma.importacionExcel.create({
    data: {
      archivoNombre: params.archivoNombre,
      estado: "ERROR",
      filasProcesadas: params.resumen.filasProcesadas,
      filasImportadas: 0,
      filasConError: params.resumen.filasConError,
      lotesCreados: 0,
      sectoresCreados: 0,
      variedadesCreadas: 0,
      plantasCreadas: 0,
      resumenErrores: params.resumen.errores,
      createdById: params.createdById
    }
  });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || !["ADMIN", "ENCARGADO_AREA"].includes(session.rol)) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Archivo no enviado." },
      { status: 400 }
    );
  }

  const archivoNombre = file.name || "archivo.xlsx";

  const resumen: ResumenImportacion = {
    filasProcesadas: 0,
    filasImportadas: 0,
    filasConError: 0,
    lotesCreados: 0,
    sectoresCreados: 0,
    variedadesCreadas: 0,
    plantasCreadas: 0,
    errores: []
  };

const workbook = new ExcelJS.Workbook();
const arrayBuffer = await file.arrayBuffer();

const excelBuffer = Buffer.from(arrayBuffer) as unknown as Parameters<
  typeof workbook.xlsx.load
>[0];

await workbook.xlsx.load(excelBuffer);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    resumen.errores.push("El Excel no tiene hojas.");
    resumen.filasConError = 1;

    await registrarImportacionError({
      archivoNombre,
      createdById: session.id,
      resumen
    });

    return NextResponse.json(
      {
        message: "El Excel no tiene hojas.",
        resumen
      },
      { status: 400 }
    );
  }

  let headerRowNumber = 0;
  const columnas: Record<string, number> = {};

  worksheet.eachRow((row, rowNumber) => {
    if (headerRowNumber) return;

    const encontrados: Record<string, number> = {};

    row.eachCell((cell, colNumber) => {
      const valor = normalizarEncabezadoExcel(obtenerTextoCelda(cell.value));

      for (const requerido of [...HEADERS_FECHA, ...HEADERS_BASE]) {
        if (headerCompatible(valor, requerido)) {
          encontrados[requerido] = colNumber;
        }
      }
    });

    const completo =
      HEADERS_BASE.every((header) => encontrados[header]) &&
      HEADERS_FECHA.some((header) => encontrados[header]);

    if (completo) {
      headerRowNumber = rowNumber;
      Object.assign(columnas, encontrados);
    }
  });

  if (!headerRowNumber) {
    resumen.errores.push(
      "No se encontraron los encabezados requeridos: FECHA o SEMANA, LOTE, SECTOR, VARIEDAD, N° DE PLANTAS, FC, FA, CUAJA."
    );
    resumen.filasConError = 1;

    await registrarImportacionError({
      archivoNombre,
      createdById: session.id,
      resumen
    });

    return NextResponse.json(
      {
        message: "No se encontraron los encabezados requeridos.",
        resumen
      },
      { status: 400 }
    );
  }

  const filas: FilaExcel[] = [];
  const clavesArchivo = new Map<string, number>();

  for (
    let rowNumber = headerRowNumber + 1;
    rowNumber <= worksheet.rowCount;
    rowNumber++
  ) {
    const row = worksheet.getRow(rowNumber);

    const fechaCelda = columnas["FECHA"]
      ? row.getCell(columnas["FECHA"]).value
      : null;
    const fechaValor = fechaCelda ? obtenerTextoCelda(fechaCelda) : "";
    const semanaValor = columnas["SEMANA"]
      ? obtenerTextoCelda(row.getCell(columnas["SEMANA"]).value)
      : "";
    const loteValor = obtenerTextoCelda(row.getCell(columnas["LOTE"]).value);
    const sectorValor = obtenerTextoCelda(
      row.getCell(columnas["SECTOR"]).value
    );
    const variedadValor = obtenerTextoCelda(
      row.getCell(columnas["VARIEDAD"]).value
    );
    const plantaValor = obtenerTextoCelda(
      row.getCell(columnas["N° DE PLANTAS"]).value
    );
    const fcValor = obtenerTextoCelda(row.getCell(columnas["FC"]).value);
    const faValor = obtenerTextoCelda(row.getCell(columnas["FA"]).value);
    const cuajaValor = obtenerTextoCelda(row.getCell(columnas["CUAJA"]).value);

    const filaVacia = [
      fechaValor,
      semanaValor,
      loteValor,
      sectorValor,
      variedadValor,
      plantaValor,
      fcValor,
      faValor,
      cuajaValor
    ].every((valor) => !String(valor).trim());

    if (filaVacia) {
      continue;
    }

    const tieneIdentificacionConteo = [
      fechaValor,
      semanaValor,
      loteValor,
      sectorValor,
      variedadValor
    ].some((valor) => String(valor).trim());

    const tieneSoloValoresSueltos = [
      plantaValor,
      fcValor,
      faValor,
      cuajaValor
    ].some((valor) => String(valor).trim());

    // ExcelJS considera como parte del archivo las filas con residuos en cualquier celda.
    // Si una fila no tiene FECHA/SEMANA, LOTE, SECTOR ni VARIEDAD, no puede formar
    // una combinación válida; se omite para evitar errores por filas sobrantes al final
    // de la plantilla, por ejemplo valores quedados en N° DE PLANTAS, FC, FA o CUAJA.
    if (!tieneIdentificacionConteo && tieneSoloValoresSueltos) {
      continue;
    }

    resumen.filasProcesadas += 1;

    let anio = new Date().getFullYear();
    let numeroSemana = extraerNumeroSemana(semanaValor);
    let fechaRegistro: Date | null = null;

    if (columnas["FECHA"] && fechaValor.trim()) {
      fechaRegistro = obtenerFechaExcel(fechaCelda);

      if (!fechaRegistro) {
        resumen.errores.push(
          `Fila ${rowNumber}: fecha inválida. Usa una fecha real de Excel, YYYY-MM-DD o DD/MM/YYYY.`
        );
        continue;
      }

      const semanaCalculada = calcularSemana(fechaRegistro);
      anio = semanaCalculada.anio;
      numeroSemana = semanaCalculada.numero;
    } else if (numeroSemana) {
      const rango = obtenerRangoSemana(anio, numeroSemana);
      fechaRegistro = rango.fechaInicio;
    }

    const loteNombre = normalizarTexto(loteValor);
    const sectorNombre = normalizarTexto(sectorValor);
    const variedadNombre = normalizarTexto(variedadValor);
    const plantaNumero = plantaValor.trim();

    if (!numeroSemana || !fechaRegistro) {
      resumen.errores.push(`Fila ${rowNumber}: fecha o semana inválida.`);
      continue;
    }

    if (!loteNombre || !sectorNombre || !variedadNombre || !plantaNumero) {
      resumen.errores.push(
        `Fila ${rowNumber}: faltan lote, sector, variedad o número de planta.`
      );
      continue;
    }

    const clave = [
      crearClaveFecha(fechaRegistro),
      loteNombre,
      sectorNombre,
      variedadNombre,
      plantaNumero
    ].join("|");

    const filaAnterior = clavesArchivo.get(clave);

    if (filaAnterior) {
      resumen.errores.push(
        `Fila ${rowNumber}: conteo duplicado en el Excel. Ya existe la misma fecha, lote, sector, variedad y planta en la fila ${filaAnterior}.`
      );
      continue;
    }

    clavesArchivo.set(clave, rowNumber);

    filas.push({
      rowNumber,
      anio,
      semana: numeroSemana,
      fecha: fechaRegistro,
      lote: loteNombre,
      sector: sectorNombre,
      variedad: variedadNombre,
      planta: plantaNumero,
      fc: convertirVacioACero(fcValor),
      fa: convertirVacioACero(faValor),
      cuaja: convertirVacioACero(cuajaValor)
    });
  }

  if (resumen.errores.length > 0) {
    resumen.filasConError = resumen.errores.length;

    await registrarImportacionError({
      archivoNombre,
      createdById: session.id,
      resumen
    });

    return NextResponse.json(
      {
        message:
          "El Excel tiene errores. No se cargó ningún registro. Corrige el archivo e intenta nuevamente.",
        resumen
      },
      { status: 400 }
    );
  }

  if (filas.length === 0) {
    resumen.errores.push("El Excel no tiene filas válidas para importar.");
    resumen.filasConError = 1;

    await registrarImportacionError({
      archivoNombre,
      createdById: session.id,
      resumen
    });

    return NextResponse.json(
      {
        message: "El Excel no tiene filas válidas para importar.",
        resumen
      },
      { status: 400 }
    );
  }

  try {
    const resultado = await prisma.$transaction(
      async (tx) => {
        const importacion = await tx.importacionExcel.create({
          data: {
            archivoNombre,
            estado: "IMPORTADO",
            filasProcesadas: resumen.filasProcesadas,
            filasImportadas: 0,
            filasConError: 0,
            createdById: session.id
          }
        });

        const semanaCache = new Map<string, { id: string }>();
        const loteCache = new Map<string, { id: string }>();
        const sectorCache = new Map<string, { id: string }>();
        const variedadCache = new Map<string, { id: string }>();
        const plantaCache = new Map<string, { id: string }>();
        const combinacionCache = new Map<string, { id: string }>();

        const erroresDuplicados: string[] = [];

        const preparados: Array<{
          combinacionId: string;
          plantaId: string;
          fc: number;
          fa: number;
          cuaja: number;
          createdById: string;
          importacionId: string;
        }> = [];

        const creados = {
          lotes: 0,
          sectores: 0,
          variedades: 0,
          plantas: 0
        };

        for (const fila of filas) {
          const semanaKey = `${fila.anio}|${fila.semana}`;
          let semana = semanaCache.get(semanaKey);

          if (!semana) {
            const rango = obtenerRangoSemana(fila.anio, fila.semana);

            semana = await tx.semana.upsert({
              where: {
                anio_numero: {
                  anio: rango.anio,
                  numero: rango.numero
                }
              },
              update: {
                fechaInicio: rango.fechaInicio,
                fechaFin: rango.fechaFin
              },
              create: {
                anio: rango.anio,
                numero: rango.numero,
                fechaInicio: rango.fechaInicio,
                fechaFin: rango.fechaFin
              },
              select: {
                id: true
              }
            });

            semanaCache.set(semanaKey, semana);
          }

          let lote = loteCache.get(fila.lote);

          if (!lote) {
            const existente = await tx.lote.findUnique({
              where: {
                nombre: fila.lote
              },
              select: {
                id: true
              }
            });

            if (existente) {
              lote = existente;
            } else {
              lote = await tx.lote.create({
                data: {
                  nombre: fila.lote
                },
                select: {
                  id: true
                }
              });

              creados.lotes += 1;
            }

            loteCache.set(fila.lote, lote);
          }

          const sectorKey = `${lote.id}|${fila.sector}`;
          let sector = sectorCache.get(sectorKey);

          if (!sector) {
            const existente = await tx.sector.findUnique({
              where: {
                loteId_nombre: {
                  loteId: lote.id,
                  nombre: fila.sector
                }
              },
              select: {
                id: true
              }
            });

            if (existente) {
              sector = existente;
            } else {
              sector = await tx.sector.create({
                data: {
                  loteId: lote.id,
                  nombre: fila.sector
                },
                select: {
                  id: true
                }
              });

              creados.sectores += 1;
            }

            sectorCache.set(sectorKey, sector);
          }

          let variedad = variedadCache.get(fila.variedad);

          if (!variedad) {
            const existente = await tx.variedad.findUnique({
              where: {
                nombre: fila.variedad
              },
              select: {
                id: true
              }
            });

            if (existente) {
              variedad = existente;
            } else {
              variedad = await tx.variedad.create({
                data: {
                  nombre: fila.variedad
                },
                select: {
                  id: true
                }
              });

              creados.variedades += 1;
            }

            variedadCache.set(fila.variedad, variedad);
          }

          let planta = plantaCache.get(fila.planta);

          if (!planta) {
            const existente = await tx.planta.findUnique({
              where: {
                numero: fila.planta
              },
              select: {
                id: true
              }
            });

            if (existente) {
              planta = existente;
            } else {
              planta = await tx.planta.create({
                data: {
                  numero: fila.planta
                },
                select: {
                  id: true
                }
              });

              creados.plantas += 1;
            }

            plantaCache.set(fila.planta, planta);
          }

          const combinacionKey = `${crearClaveFecha(fila.fecha)}|${lote.id}|${sector.id}|${variedad.id}`;
          let combinacion = combinacionCache.get(combinacionKey);

          if (!combinacion) {
            const existente = await tx.combinacion.findUnique({
              where: {
                fecha_loteId_sectorId_variedadId: {
                  fecha: fila.fecha,
                  loteId: lote.id,
                  sectorId: sector.id,
                  variedadId: variedad.id
                }
              },
              select: {
                id: true
              }
            });

            if (existente) {
              combinacion = existente;
            } else {
              combinacion = await tx.combinacion.create({
                data: {
                  fecha: fila.fecha,
                  semanaId: semana.id,
                  loteId: lote.id,
                  sectorId: sector.id,
                  variedadId: variedad.id,
                  createdById: session.id,
                  createdFromImportacionId: importacion.id
                },
                select: {
                  id: true
                }
              });
            }

            combinacionCache.set(combinacionKey, combinacion);
          }

          const conteoExistente = await tx.conteo.findUnique({
            where: {
              combinacionId_plantaId: {
                combinacionId: combinacion.id,
                plantaId: planta.id
              }
            },
            select: {
              id: true
            }
          });

          if (conteoExistente) {
            erroresDuplicados.push(
              `Fila ${fila.rowNumber}: ya existe un conteo para la misma fecha, lote, sector, variedad y planta. Corrige el Excel o edita el registro existente.`
            );
            continue;
          }

          preparados.push({
            combinacionId: combinacion.id,
            plantaId: planta.id,
            fc: fila.fc,
            fa: fila.fa,
            cuaja: fila.cuaja,
            createdById: session.id,
            importacionId: importacion.id
          });
        }

        if (erroresDuplicados.length > 0) {
          throw new Error(`DUPLICADOS:${JSON.stringify(erroresDuplicados)}`);
        }

        await tx.conteo.createMany({
          data: preparados
        });

        await tx.importacionExcel.update({
          where: {
            id: importacion.id
          },
          data: {
            filasImportadas: preparados.length,
            lotesCreados: creados.lotes,
            sectoresCreados: creados.sectores,
            variedadesCreadas: creados.variedades,
            plantasCreadas: creados.plantas
          }
        });

        return {
          creados,
          importados: preparados.length
        };
      },
      {
        timeout: 120000,
        maxWait: 120000
      }
    );

    resumen.filasImportadas = resultado.importados;
    resumen.lotesCreados = resultado.creados.lotes;
    resumen.sectoresCreados = resultado.creados.sectores;
    resumen.variedadesCreadas = resultado.creados.variedades;
    resumen.plantasCreadas = resultado.creados.plantas;

    return NextResponse.json({
      message: "Excel importado correctamente.",
      resumen
    });
  } catch (error) {
    let errores = ["No se pudo importar el Excel."];

    if (error instanceof Error && error.message.startsWith("DUPLICADOS:")) {
      errores = JSON.parse(error.message.replace("DUPLICADOS:", "")) as string[];
    } else if (error instanceof Error) {
      errores = [
        "No se cargó ningún registro.",
        error.message
      ];
    }

    resumen.errores = errores;
    resumen.filasConError = errores.length;
    resumen.filasImportadas = 0;

    await registrarImportacionError({
      archivoNombre,
      createdById: session.id,
      resumen
    });

    return NextResponse.json(
      {
        message:
          "El Excel tiene errores o duplicados. No se cargó ningún registro.",
        resumen
      },
      { status: 400 }
    );
  }
}