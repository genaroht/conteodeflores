"use client";

import { useMemo, useState } from "react";

export type EvolucionItem = {
  etiqueta: string;
  anio: number;
  semana: number;
  plantas: number;
  fc: number;
  fa: number;
  cuaja: number;
  total: number;
  promedioFc: number;
  promedioFa: number;
  promedioCuaja: number;
};

type EvolucionChartProps = {
  data: EvolucionItem[];
};

type SerieKey = "fc" | "fa" | "cuaja";

type Serie = {
  key: SerieKey;
  nombre: string;
  color: string;
  promedioKey: "promedioFc" | "promedioFa" | "promedioCuaja";
};

const SERIES: Serie[] = [
  {
    key: "fc",
    nombre: "FC",
    color: "#0B7A3B",
    promedioKey: "promedioFc"
  },
  {
    key: "fa",
    nombre: "FA",
    color: "#2563EB",
    promedioKey: "promedioFa"
  },
  {
    key: "cuaja",
    nombre: "Cuaja",
    color: "#F59E0B",
    promedioKey: "promedioCuaja"
  }
];

const formatoNumero = new Intl.NumberFormat("es-PE");
const formatoPromedio = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2
});

function crearPath(
  data: EvolucionItem[],
  valor: SerieKey,
  width: number,
  height: number,
  paddingX: number,
  paddingTop: number,
  paddingBottom: number,
  maximo: number
) {
  const altoGrafico = height - paddingTop - paddingBottom;
  const anchoGrafico = width - paddingX * 2;

  return data
    .map((item, index) => {
      const x =
        data.length === 1
          ? width / 2
          : paddingX + (index * anchoGrafico) / (data.length - 1);

      const y =
        paddingTop + altoGrafico - (item[valor] / Math.max(maximo, 1)) * altoGrafico;

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function obtenerPuntos(
  data: EvolucionItem[],
  valor: SerieKey,
  width: number,
  height: number,
  paddingX: number,
  paddingTop: number,
  paddingBottom: number,
  maximo: number
) {
  const altoGrafico = height - paddingTop - paddingBottom;
  const anchoGrafico = width - paddingX * 2;

  return data.map((item, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX + (index * anchoGrafico) / (data.length - 1);

    const y =
      paddingTop + altoGrafico - (item[valor] / Math.max(maximo, 1)) * altoGrafico;

    return {
      x,
      y,
      item
    };
  });
}

export function EvolucionChart({ data }: EvolucionChartProps) {
  const [seriesVisibles, setSeriesVisibles] = useState<Record<SerieKey, boolean>>({
    fc: true,
    fa: true,
    cuaja: true
  });

  const width = Math.max(860, data.length * 122);
  const height = 370;
  const paddingX = 64;
  const paddingTop = 34;
  const paddingBottom = 112;

  const seriesActivas = useMemo(() => {
    return SERIES.filter((serie) => seriesVisibles[serie.key]);
  }, [seriesVisibles]);

  const maximo = useMemo(() => {
    if (seriesActivas.length === 0) {
      return 1;
    }

    return Math.max(
      1,
      ...data.flatMap((item) => seriesActivas.map((serie) => item[serie.key]))
    );
  }, [data, seriesActivas]);

  const marcasY = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((ratio) =>
      Math.round(maximo * ratio)
    );
  }, [maximo]);

  function alternarSerie(key: SerieKey) {
    setSeriesVisibles((actual) => ({
      ...actual,
      [key]: !actual[key]
    }));
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#B8CFC4] bg-white p-8 text-center">
        <p className="font-black text-[#10231A]">
          No hay datos para graficar.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Filtra por lote, variedad o rango de fechas para ver la evolución.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#DDE7E1] bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-[#10231A]">
            Evolución FC / FA / Cuaja
          </h3>
          <p className="text-sm font-semibold text-slate-500">
            Agrupado por semana según los filtros aplicados.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm font-black">
          {SERIES.map((serie) => (
            <label
              key={serie.key}
              className="inline-flex cursor-pointer items-center gap-2"
              style={{ color: serie.color }}
            >
              <input
                type="checkbox"
                checked={seriesVisibles[serie.key]}
                onChange={() => alternarSerie(serie.key)}
                className="h-4 w-4 accent-[#0B7A3B]"
              />
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: serie.color }}
              />
              {serie.nombre}
            </label>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[370px]"
        style={{ width }}
        role="img"
        aria-label="Gráfico de evolución de FC, FA y Cuaja"
      >
        <rect x="0" y="0" width={width} height={height} rx="18" fill="#ffffff" />

        {marcasY.map((marca) => {
          const altoGrafico = height - paddingTop - paddingBottom;
          const y =
            paddingTop +
            altoGrafico -
            (marca / Math.max(maximo, 1)) * altoGrafico;

          return (
            <g key={marca}>
              <line
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="#E5EDE8"
                strokeWidth="1"
              />
              <text
                x={paddingX - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fontWeight="700"
                fill="#64748B"
              >
                {formatoNumero.format(marca)}
              </text>
            </g>
          );
        })}

        {seriesActivas.map((serie) => (
          <path
            key={`path-${serie.key}`}
            d={crearPath(
              data,
              serie.key,
              width,
              height,
              paddingX,
              paddingTop,
              paddingBottom,
              maximo
            )}
            fill="none"
            stroke={serie.color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {seriesActivas.map((serie) =>
          obtenerPuntos(
            data,
            serie.key,
            width,
            height,
            paddingX,
            paddingTop,
            paddingBottom,
            maximo
          ).map((punto) => (
            <g key={`${serie.key}-${punto.item.anio}-${punto.item.semana}`}>
              <circle cx={punto.x} cy={punto.y} r="5" fill={serie.color}>
                <title>
                  {`${punto.item.etiqueta} · Plantas: ${formatoNumero.format(
                    punto.item.plantas
                  )} · ${serie.nombre}: ${formatoNumero.format(
                    punto.item[serie.key]
                  )} · Promedio ${serie.nombre}: ${formatoPromedio.format(
                    punto.item[serie.promedioKey]
                  )}`}
                </title>
              </circle>
            </g>
          ))
        )}

        {data.map((item, index) => {
          const anchoGrafico = width - paddingX * 2;
          const x =
            data.length === 1
              ? width / 2
              : paddingX + (index * anchoGrafico) / (data.length - 1);

          return (
            <g key={`label-${item.anio}-${item.semana}`}>
              <line
                x1={x}
                x2={x}
                y1={height - paddingBottom}
                y2={height - paddingBottom + 6}
                stroke="#94A3B8"
              />
              <text
                x={x}
                y={height - paddingBottom + 25}
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                fill="#10231A"
              >
                Semana {item.semana}
              </text>
              <text
                x={x}
                y={height - paddingBottom + 43}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#64748B"
              >
                Plantas: {formatoNumero.format(item.plantas)}
              </text>
              <text
                x={x}
                y={height - paddingBottom + 61}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#64748B"
              >
                {item.anio}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
