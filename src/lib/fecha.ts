const FECHA_INPUT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function pad2(valor: number) {
  return String(valor).padStart(2, "0");
}

export function crearFechaUtcMediodia(fecha: string) {
  if (!FECHA_INPUT_REGEX.test(fecha)) {
    throw new Error("La fecha debe tener formato YYYY-MM-DD.");
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);

  return new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
}

export function obtenerFechaInput(fecha: Date | string) {
  if (fecha instanceof Date) {
    return `${fecha.getUTCFullYear()}-${pad2(fecha.getUTCMonth() + 1)}-${pad2(
      fecha.getUTCDate()
    )}`;
  }

  if (FECHA_INPUT_REGEX.test(fecha)) {
    return fecha;
  }

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate()
  )}`;
}

export function formatearFechaEsPe(fecha: Date | string) {
  const fechaInput = obtenerFechaInput(fecha);

  if (!fechaInput) {
    return "-";
  }

  const [anio, mes, dia] = fechaInput.split("-");

  return `${Number(dia)}/${Number(mes)}/${anio}`;
}
