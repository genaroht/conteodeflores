import ExcelJS from "exceljs";
import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import {
  extraerNumeroSemana,
  normalizarEncabezadoExcel,
  obtenerTextoCelda
} from "@/lib/excel";
import { obtenerRangoSemana } from "@/lib/semana";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { convertirVacioACero, normalizarTexto } from "@/lib/utils";

export const runtime = "nodejs";

const HEADERS_REQUERIDOS = [
  "SEMANA",
  "LOTE",
  "SECTOR",
  "VARIEDAD",
  "N° DE PLANTAS",
  "FC",
  "FA"
];

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
  semana: number;
  lote: string;
  sector: string;
  variedad: string;
  planta: string;
  fc: number;
  fa: number;
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

      for (const requerido of HEADERS_REQUERIDOS) {
        if (headerCompatible(valor, requerido)) {
          encontrados[requerido] = colNumber;
        }
      }
    });

    const completo = HEADERS_REQUERIDOS.every((header) => encontrados[header]);

    if (completo) {
      headerRowNumber = rowNumber;
      Object.assign(columnas, encontrados);
    }
  });

  if (!headerRowNumber) {
    resumen.errores.push(
      "No se encontraron los encabezados requeridos: semana, LOTE, SECTOR, VARIEDAD, N° DE PLANTAS, FC, FA."
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

    const semanaValor = obtenerTextoCelda(
      row.getCell(columnas["SEMANA"]).value
    );
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

    const filaVacia = [
      semanaValor,
      loteValor,
      sectorValor,
      variedadValor,
      plantaValor,
      fcValor,
      faValor
    ].every((valor) => !String(valor).trim());

    if (filaVacia) {
      continue;
    }

    resumen.filasProcesadas += 1;

    const numeroSemana = extraerNumeroSemana(semanaValor);
    const loteNombre = normalizarTexto(loteValor);
    const sectorNombre = normalizarTexto(sectorValor);
    const variedadNombre = normalizarTexto(variedadValor);
    const plantaNumero = plantaValor.trim();

    if (!numeroSemana) {
      resumen.errores.push(`Fila ${rowNumber}: semana inválida.`);
      continue;
    }

    if (!loteNombre || !sectorNombre || !variedadNombre || !plantaNumero) {
      resumen.errores.push(
        `Fila ${rowNumber}: faltan lote, sector, variedad o número de planta.`
      );
      continue;
    }

    const clave = [
      numeroSemana,
      loteNombre,
      sectorNombre,
      variedadNombre,
      plantaNumero
    ].join("|");

    const filaAnterior = clavesArchivo.get(clave);

    if (filaAnterior) {
      resumen.errores.push(
        `Fila ${rowNumber}: conteo duplicado en el Excel. Ya existe la misma semana, lote, sector, variedad y planta en la fila ${filaAnterior}.`
      );
      continue;
    }

    clavesArchivo.set(clave, rowNumber);

    filas.push({
      rowNumber,
      semana: numeroSemana,
      lote: loteNombre,
      sector: sectorNombre,
      variedad: variedadNombre,
      planta: plantaNumero,
      fc: convertirVacioACero(fcValor),
      fa: convertirVacioACero(faValor)
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

        const semanaCache = new Map<number, { id: string }>();
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
          let semana = semanaCache.get(fila.semana);

          if (!semana) {
            const rango = obtenerRangoSemana(new Date().getFullYear(), fila.semana);

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

            semanaCache.set(fila.semana, semana);
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

          const combinacionKey = `${semana.id}|${lote.id}|${sector.id}|${variedad.id}`;
          let combinacion = combinacionCache.get(combinacionKey);

          if (!combinacion) {
            const existente = await tx.combinacion.findUnique({
              where: {
                semanaId_loteId_sectorId_variedadId: {
                  semanaId: semana.id,
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
              const rango = obtenerRangoSemana(
                new Date().getFullYear(),
                fila.semana
              );

              combinacion = await tx.combinacion.create({
                data: {
                  fecha: rango.fechaInicio,
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
              `Fila ${fila.rowNumber}: ya existe un conteo para la misma semana, lote, sector, variedad y planta. Corrige el Excel o edita el registro existente.`
            );
            continue;
          }

          preparados.push({
            combinacionId: combinacion.id,
            plantaId: planta.id,
            fc: fila.fc,
            fa: fila.fa,
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