-- CreateEnum
CREATE TYPE "EstadoImportacion" AS ENUM ('IMPORTADO', 'ELIMINADO', 'ERROR');

-- AlterTable
ALTER TABLE "Combinacion" ADD COLUMN     "createdFromImportacionId" TEXT;

-- AlterTable
ALTER TABLE "Conteo" ADD COLUMN     "importacionId" TEXT;

-- CreateTable
CREATE TABLE "ImportacionExcel" (
    "id" TEXT NOT NULL,
    "archivoNombre" TEXT NOT NULL,
    "estado" "EstadoImportacion" NOT NULL DEFAULT 'IMPORTADO',
    "filasProcesadas" INTEGER NOT NULL DEFAULT 0,
    "filasImportadas" INTEGER NOT NULL DEFAULT 0,
    "filasConError" INTEGER NOT NULL DEFAULT 0,
    "lotesCreados" INTEGER NOT NULL DEFAULT 0,
    "sectoresCreados" INTEGER NOT NULL DEFAULT 0,
    "variedadesCreadas" INTEGER NOT NULL DEFAULT 0,
    "plantasCreadas" INTEGER NOT NULL DEFAULT 0,
    "resumenErrores" JSONB,
    "createdById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportacionExcel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportacionExcel_createdById_idx" ON "ImportacionExcel"("createdById");

-- CreateIndex
CREATE INDEX "ImportacionExcel_estado_idx" ON "ImportacionExcel"("estado");

-- CreateIndex
CREATE INDEX "ImportacionExcel_createdAt_idx" ON "ImportacionExcel"("createdAt");

-- CreateIndex
CREATE INDEX "Combinacion_createdFromImportacionId_idx" ON "Combinacion"("createdFromImportacionId");

-- CreateIndex
CREATE INDEX "Conteo_importacionId_idx" ON "Conteo"("importacionId");

-- AddForeignKey
ALTER TABLE "ImportacionExcel" ADD CONSTRAINT "ImportacionExcel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combinacion" ADD CONSTRAINT "Combinacion_createdFromImportacionId_fkey" FOREIGN KEY ("createdFromImportacionId") REFERENCES "ImportacionExcel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conteo" ADD CONSTRAINT "Conteo_importacionId_fkey" FOREIGN KEY ("importacionId") REFERENCES "ImportacionExcel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
