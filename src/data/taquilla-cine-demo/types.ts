/**
 * C1 — Contrato de datos de la demo de Taquilla de Cine.
 *
 * Los tipos se reescriben en el portafolio a partir del plan C0. No se importa
 * código del proyecto académico original. Los identificadores internos usan
 * prefijos `demo-*` y todos los importes se guardan como enteros en centavos.
 */

/** Versión del estado persistible de esta demo. */
export const DEMO_STATE_VERSION = 1 as const;
export type TaquillaDemoStateVersion = typeof DEMO_STATE_VERSION;

/** Fecha fija de referencia de la semilla; nunca se deriva del reloj del equipo. */
export const DEMO_TODAY = "2026-11-25" as const;

export type TaquillaDemoView = "peliculas" | "funciones" | "compras" | "taquilla";

export type TaquillaDialog =
  | { kind: "pelicula"; id?: string }
  | { kind: "funcion"; id?: string }
  | { kind: "compra" }
  | { kind: "delete"; entity: "pelicula" | "funcion"; id: string }
  | { kind: "reset" }
  | null;

export interface DemoPelicula {
  id: string;
  titulo: string;
  genero: string;
  /** Entero positivo en minutos; límite original de INTEGER. */
  duracionMin: number;
  clasificacion: string;
}

export interface DemoFuncion {
  id: string;
  peliculaId: string;
  /** Texto estable `YYYY-MM-DD`; no depende de la zona horaria del navegador. */
  fecha: string;
  /** Texto estable `HH:mm`. */
  hora: string;
  sala: string;
  /** Precio unitario en centavos COP enteros, nunca en pesos decimales. */
  precioCentavos: number;
  cuposTotales: number;
  /** Valor derivado: cuposTotales - boletosVendidos. Nunca se edita directamente. */
  cuposDisponibles: number;
}

export interface DemoCompra {
  id: string;
  funcionId: string;
  nombreCliente: string;
  cantidadBoletos: number;
  /** Snapshot histórico en centavos COP; no se recalcula si cambia el precio. */
  totalCentavos: number;
  /** ISO 8601 con offset fijo `-05:00`, generado por una acción determinista. */
  fechaCompra: string;
}

export interface TaquillaDemoState {
  version: TaquillaDemoStateVersion;
  peliculas: DemoPelicula[];
  funciones: DemoFuncion[];
  compras: DemoCompra[];
}
