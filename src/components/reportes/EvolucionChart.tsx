"use client";

import { useMemo } from "react";

export type EvolucionItem = {
  etiqueta: string;
  anio: number;
  semana: number;
  fc: number;
  fa: number;
  total: number;
};

type EvolucionChartProps = {
  data: EvolucionItem[];
};

const formatoNumero = new Intl.NumberFormat("es-PE");

function crearPath(
  data: EvolucionItem[],
  valor: "fc" | "fa",
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
  valor: "fc" | "fa",
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
  const width = Math.max(760, data.length * 92);
  const height = 330;
  const paddingX = 54;
  const paddingTop = 34;
  const paddingBottom = 74;

  const maximo = useMemo(() => {
    return Math.max(1, ...data.flatMap((item) => [item.fc, item.fa]));
  }, [data]);

  const marcasY = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((ratio) =>
      Math.round(maximo * ratio)
    );
  }, [maximo]);

  const pathFC = crearPath(
    data,
    "fc",
    width,
    height,
    paddingX,
    paddingTop,
    paddingBottom,
    maximo
  );

  const pathFA = crearPath(
    data,
    "fa",
    width,
    height,
    paddingX,
    paddingTop,
    paddingBottom,
    maximo
  );

  const puntosFC = obtenerPuntos(
    data,
    "fc",
    width,
    height,
    paddingX,
    paddingTop,
    paddingBottom,
    maximo
  );

  const puntosFA = obtenerPuntos(
    data,
    "fa",
    width,
    height,
    paddingX,
    paddingTop,
    paddingBottom,
    maximo
  );

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
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-[#10231A]">
            Evolución FC / FA
          </h3>
          <p className="text-sm font-semibold text-slate-500">
            Agrupado por semana según los filtros aplicados.
          </p>
        </div>

        <div className="flex gap-3 text-sm font-black">
          <span className="inline-flex items-center gap-2 text-[#0B7A3B]">
            <span className="h-3 w-3 rounded-full bg-[#0B7A3B]" />
            FC
          </span>

          <span className="inline-flex items-center gap-2 text-[#2563EB]">
            <span className="h-3 w-3 rounded-full bg-[#2563EB]" />
            FA
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[330px]"
        style={{ width }}
        role="img"
        aria-label="Gráfico de evolución de FC y FA"
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

        <path
          d={pathFC}
          fill="none"
          stroke="#0B7A3B"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d={pathFA}
          fill="none"
          stroke="#2563EB"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {puntosFC.map((punto) => (
          <g key={`fc-${punto.item.anio}-${punto.item.semana}`}>
            <circle cx={punto.x} cy={punto.y} r="5" fill="#0B7A3B">
              <title>
                {punto.item.etiqueta} · FC: {formatoNumero.format(punto.item.fc)}
              </title>
            </circle>
          </g>
        ))}

        {puntosFA.map((punto) => (
          <g key={`fa-${punto.item.anio}-${punto.item.semana}`}>
            <circle cx={punto.x} cy={punto.y} r="5" fill="#2563EB">
              <title>
                {punto.item.etiqueta} · FA: {formatoNumero.format(punto.item.fa)}
              </title>
            </circle>
          </g>
        ))}

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
                S{item.semana}
              </text>
              <text
                x={x}
                y={height - paddingBottom + 43}
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