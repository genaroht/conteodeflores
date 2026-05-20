-- Guarda la fecha como DATE real, sin hora.
-- Evita desfases de zona horaria y evita que 18/05 y 19/05 se mezclen visualmente.
DROP INDEX IF EXISTS "Combinacion_fecha_loteId_sectorId_variedadId_key";

UPDATE "Combinacion"
SET "fecha" = DATE_TRUNC('day', "fecha");

ALTER TABLE "Combinacion"
ALTER COLUMN "fecha" TYPE DATE USING "fecha"::date;

CREATE UNIQUE INDEX "Combinacion_fecha_loteId_sectorId_variedadId_key"
ON "Combinacion"("fecha", "loteId", "sectorId", "variedadId");
