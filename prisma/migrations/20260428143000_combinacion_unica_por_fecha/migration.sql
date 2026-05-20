-- Permite importar varios conteos del mismo lote/sector/variedad dentro de una misma semana
-- cuando pertenecen a fechas diferentes.
DROP INDEX IF EXISTS "Combinacion_semanaId_loteId_sectorId_variedadId_key";

CREATE UNIQUE INDEX "Combinacion_fecha_loteId_sectorId_variedadId_key"
ON "Combinacion"("fecha", "loteId", "sectorId", "variedadId");
