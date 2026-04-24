-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ENCARGADO_AREA', 'OPERADOR', 'USUARIO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'OPERADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variedad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planta" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semana" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combinacion" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "semanaId" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "variedadId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Combinacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conteo" (
    "id" TEXT NOT NULL,
    "combinacionId" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    "fc" INTEGER NOT NULL DEFAULT 0,
    "fa" INTEGER NOT NULL DEFAULT 0,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conteo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_usuario_key" ON "Usuario"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_nombre_key" ON "Lote"("nombre");

-- CreateIndex
CREATE INDEX "Sector_loteId_idx" ON "Sector"("loteId");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_loteId_nombre_key" ON "Sector"("loteId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Variedad_nombre_key" ON "Variedad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Planta_numero_key" ON "Planta"("numero");

-- CreateIndex
CREATE INDEX "Semana_anio_idx" ON "Semana"("anio");

-- CreateIndex
CREATE INDEX "Semana_numero_idx" ON "Semana"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Semana_anio_numero_key" ON "Semana"("anio", "numero");

-- CreateIndex
CREATE INDEX "Combinacion_semanaId_idx" ON "Combinacion"("semanaId");

-- CreateIndex
CREATE INDEX "Combinacion_loteId_idx" ON "Combinacion"("loteId");

-- CreateIndex
CREATE INDEX "Combinacion_sectorId_idx" ON "Combinacion"("sectorId");

-- CreateIndex
CREATE INDEX "Combinacion_variedadId_idx" ON "Combinacion"("variedadId");

-- CreateIndex
CREATE INDEX "Combinacion_createdById_idx" ON "Combinacion"("createdById");

-- CreateIndex
CREATE INDEX "Combinacion_createdAt_idx" ON "Combinacion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Combinacion_semanaId_loteId_sectorId_variedadId_key" ON "Combinacion"("semanaId", "loteId", "sectorId", "variedadId");

-- CreateIndex
CREATE INDEX "Conteo_combinacionId_idx" ON "Conteo"("combinacionId");

-- CreateIndex
CREATE INDEX "Conteo_plantaId_idx" ON "Conteo"("plantaId");

-- CreateIndex
CREATE INDEX "Conteo_createdById_idx" ON "Conteo"("createdById");

-- CreateIndex
CREATE INDEX "Conteo_fechaRegistro_idx" ON "Conteo"("fechaRegistro");

-- CreateIndex
CREATE INDEX "Conteo_createdAt_idx" ON "Conteo"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conteo_combinacionId_plantaId_key" ON "Conteo"("combinacionId", "plantaId");

-- AddForeignKey
ALTER TABLE "Sector" ADD CONSTRAINT "Sector_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combinacion" ADD CONSTRAINT "Combinacion_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "Semana"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combinacion" ADD CONSTRAINT "Combinacion_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combinacion" ADD CONSTRAINT "Combinacion_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combinacion" ADD CONSTRAINT "Combinacion_variedadId_fkey" FOREIGN KEY ("variedadId") REFERENCES "Variedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combinacion" ADD CONSTRAINT "Combinacion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conteo" ADD CONSTRAINT "Conteo_combinacionId_fkey" FOREIGN KEY ("combinacionId") REFERENCES "Combinacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conteo" ADD CONSTRAINT "Conteo_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conteo" ADD CONSTRAINT "Conteo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
