import ExcelJS from "exceljs";

export const EXCEL_HEADERS = [
  "semana",
  "LOTE",
  "SECTOR",
  "VARIEDAD",
  "N° DE PLANTAS",
  "FC",
  "FA"
];

export function normalizarEncabezadoExcel(valor: unknown): string {
  return String(valor ?? "")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .replace(/º/g, "°");
}

export function obtenerTextoCelda(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) {
    return "";
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number" ||
    typeof valor === "boolean"
  ) {
    return String(valor);
  }

  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }

  if ("text" in valor && valor.text) {
    return String(valor.text);
  }

  if ("result" in valor && valor.result !== undefined) {
    return String(valor.result);
  }

  if ("richText" in valor && Array.isArray(valor.richText)) {
    return valor.richText.map((item) => item.text).join("");
  }

  return String(valor);
}

export function extraerNumeroSemana(valor: unknown): number | null {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return null;
  }

  const match = texto.match(/\d+/);

  if (!match) {
    return null;
  }

  const numero = Number(match[0]);

  if (Number.isNaN(numero) || numero <= 0) {
    return null;
  }

  return Math.trunc(numero);
}

export function crearWorkbookBase(nombreHoja: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(nombreHoja);

  worksheet.addRow(EXCEL_HEADERS);

  worksheet.getRow(1).font = {
    bold: true
  };

  worksheet.columns = [
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 22 },
    { width: 18 },
    { width: 12 },
    { width: 12 }
  ];

  return {
    workbook,
    worksheet
  };
}