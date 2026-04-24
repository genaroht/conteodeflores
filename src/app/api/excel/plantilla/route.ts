import { crearWorkbookBase } from "@/lib/excel";

export const runtime = "nodejs";

export async function GET() {
  const { workbook } = crearWorkbookBase("Plantilla");

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=plantilla-conteo-flores.xlsx"
    }
  });
}