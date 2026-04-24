const MS_POR_DIA = 24 * 60 * 60 * 1000;

export type SemanaCalculada = {
  anio: number;
  numero: number;
  fechaInicio: Date;
  fechaFin: Date;
};

function crearFechaUTC(anio: number, mesIndexadoDesdeCero: number, dia: number) {
  return new Date(Date.UTC(anio, mesIndexadoDesdeCero, dia, 12, 0, 0));
}

function agregarDias(fecha: Date, dias: number) {
  return new Date(fecha.getTime() + dias * MS_POR_DIA);
}

export function parsearFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) {
    return crearFechaUTC(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      fecha.getUTCDate()
    );
  }

  const partes = fecha.split("-").map(Number);

  if (partes.length !== 3 || partes.some((parte) => Number.isNaN(parte))) {
    throw new Error("La fecha debe tener formato YYYY-MM-DD.");
  }

  const [anio, mes, dia] = partes;

  return crearFechaUTC(anio, mes - 1, dia);
}

export function formatearFechaInput(fecha: Date): string {
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getUTCDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

export function obtenerFechaHoyInput(): string {
  return formatearFechaInput(new Date());
}

export function obtenerPrimerLunesDelAnioParaSemana2(anio: number): Date {
  const primeroEnero = crearFechaUTC(anio, 0, 1);
  const diaSemana = primeroEnero.getUTCDay();

  let diasHastaLunes = (8 - diaSemana) % 7;

  if (diasHastaLunes === 0) {
    diasHastaLunes = 7;
  }

  return agregarDias(primeroEnero, diasHastaLunes);
}

export function calcularSemana(fechaEntrada: string | Date): SemanaCalculada {
  const fecha = parsearFecha(fechaEntrada);
  const anio = fecha.getUTCFullYear();

  const primeroEnero = crearFechaUTC(anio, 0, 1);
  const inicioSemana2 = obtenerPrimerLunesDelAnioParaSemana2(anio);

  if (fecha < inicioSemana2) {
    return {
      anio,
      numero: 1,
      fechaInicio: primeroEnero,
      fechaFin: agregarDias(inicioSemana2, -1)
    };
  }

  const diferenciaDias = Math.floor(
    (fecha.getTime() - inicioSemana2.getTime()) / MS_POR_DIA
  );

  const numero = 2 + Math.floor(diferenciaDias / 7);
  const fechaInicio = agregarDias(inicioSemana2, (numero - 2) * 7);

  return {
    anio,
    numero,
    fechaInicio,
    fechaFin: agregarDias(fechaInicio, 6)
  };
}

export function obtenerRangoSemana(anio: number, numero: number): SemanaCalculada {
  if (numero <= 1) {
    const primeroEnero = crearFechaUTC(anio, 0, 1);
    const inicioSemana2 = obtenerPrimerLunesDelAnioParaSemana2(anio);

    return {
      anio,
      numero: 1,
      fechaInicio: primeroEnero,
      fechaFin: agregarDias(inicioSemana2, -1)
    };
  }

  const inicioSemana2 = obtenerPrimerLunesDelAnioParaSemana2(anio);
  const fechaInicio = agregarDias(inicioSemana2, (numero - 2) * 7);

  return {
    anio,
    numero,
    fechaInicio,
    fechaFin: agregarDias(fechaInicio, 6)
  };
}