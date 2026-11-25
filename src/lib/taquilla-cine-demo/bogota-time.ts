/**
 * C6 — Utilidades puras de fecha para la demo de Taquilla de Cine.
 *
 * Colombia usa UTC-05:00 sin horario de verano. Estas funciones NO consultan
 * la zona del dispositivo: leen componentes UTC del instante recibido y los
 * desplazan cinco horas. Solo se llaman desde eventos del usuario (pulsar
 * «Hoy» o confirmar una compra), nunca durante el render inicial.
 */

const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000;

interface PartesBogota {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  segundo: number;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

function aInstante(valor: string | Date): Date | null {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }
  if (typeof valor !== "string" || valor.trim() === "") return null;
  const milisegundos = Date.parse(valor);
  return Number.isNaN(milisegundos) ? null : new Date(milisegundos);
}

/** Desplaza el instante a UTC-05:00 y lee sus componentes con getters UTC. */
function partesBogota(valor: string | Date): PartesBogota | null {
  const instante = aInstante(valor);
  if (!instante) return null;
  const local = new Date(instante.getTime() + BOGOTA_OFFSET_MS);
  return {
    anio: local.getUTCFullYear(),
    mes: local.getUTCMonth() + 1,
    dia: local.getUTCDate(),
    hora: local.getUTCHours(),
    minuto: local.getUTCMinutes(),
    segundo: local.getUTCSeconds(),
  };
}

/** Día local `YYYY-MM-DD` de Bogotá; cadena vacía si el valor no es válido. */
export function bogotaDayKey(valor: string | Date): string {
  const partes = partesBogota(valor);
  if (!partes) return "";
  return `${String(partes.anio).padStart(4, "0")}-${dosDigitos(partes.mes)}-${dosDigitos(partes.dia)}`;
}

/** Timestamp con el offset fijo que acepta el reducer para `fechaCompra`. */
export function fechaCompraBogota(valor: string | Date): string {
  const partes = partesBogota(valor);
  if (!partes) return "";
  const dia = `${String(partes.anio).padStart(4, "0")}-${dosDigitos(partes.mes)}-${dosDigitos(partes.dia)}`;
  const hora = `${dosDigitos(partes.hora)}:${dosDigitos(partes.minuto)}:${dosDigitos(partes.segundo)}`;
  return `${dia}T${hora}-05:00`;
}
