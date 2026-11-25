/**
 * C1 — Dataset 100% ficticio de la demo de Taquilla de Cine.
 *
 * Los seis títulos, nueve funciones y ocho compras son inventados. Los IDs
 * usan prefijos `demo-*` y los clientes se llaman `Cliente Demo A` a `H`.
 * Los cupos y los totales históricos se derivan con los cálculos puros de C1;
 * no se escriben a mano para que la semilla no pueda quedar incoherente.
 */

import {
  DEMO_STATE_VERSION,
  DEMO_TODAY,
  type DemoCompra,
  type DemoFuncion,
  type DemoPelicula,
  type TaquillaDemoState,
} from "./types";
import {
  calculateAvailableAfterCapacityChange,
  calculatePurchaseTotalCents,
  countSoldTickets,
} from "../../lib/taquilla-cine-demo/pricing";

type SeedFuncion = Omit<DemoFuncion, "cuposDisponibles">;
type SeedCompra = Omit<DemoCompra, "totalCentavos">;

const PELICULAS: DemoPelicula[] = [
  { id: "demo-pel-001", titulo: "Viaje a la Luna Demo", genero: "Ciencia ficción", duracionMin: 108, clasificacion: "A" },
  { id: "demo-pel-002", titulo: "El Pueblo de Papel", genero: "Drama", duracionMin: 124, clasificacion: "B" },
  { id: "demo-pel-003", titulo: "Dinosaurios de Barranquilla", genero: "Animación", duracionMin: 96, clasificacion: "A" },
  { id: "demo-pel-004", titulo: "Misterio en la Sala Cuatro", genero: "Suspenso", duracionMin: 112, clasificacion: "C" },
  { id: "demo-pel-005", titulo: "Ritmos del Caribe Demo", genero: "Musical", duracionMin: 101, clasificacion: "B" },
  { id: "demo-pel-006", titulo: "Cuentos del Bosque Demo", genero: "Fantasía", duracionMin: 88, clasificacion: "D" },
];

const FUNCIONES: SeedFuncion[] = [
  { id: "demo-fun-001", peliculaId: "demo-pel-001", fecha: "2026-11-25", hora: "10:30", sala: "1", precioCentavos: 1800000, cuposTotales: 10 },
  { id: "demo-fun-002", peliculaId: "demo-pel-002", fecha: "2026-11-25", hora: "13:15", sala: "2", precioCentavos: 2200000, cuposTotales: 3 },
  { id: "demo-fun-003", peliculaId: "demo-pel-003", fecha: "2026-11-26", hora: "16:00", sala: "3", precioCentavos: 1500000, cuposTotales: 8 },
  { id: "demo-fun-004", peliculaId: "demo-pel-004", fecha: "2026-11-26", hora: "19:30", sala: "4", precioCentavos: 2500000, cuposTotales: 12 },
  { id: "demo-fun-005", peliculaId: "demo-pel-005", fecha: "2026-11-27", hora: "11:45", sala: "1", precioCentavos: 2000000, cuposTotales: 7 },
  { id: "demo-fun-006", peliculaId: "demo-pel-001", fecha: "2026-11-28", hora: "14:20", sala: "2", precioCentavos: 1875050, cuposTotales: 9 },
  { id: "demo-fun-007", peliculaId: "demo-pel-002", fecha: "2026-11-29", hora: "17:10", sala: "3", precioCentavos: 2200000, cuposTotales: 15 },
  { id: "demo-fun-008", peliculaId: "demo-pel-003", fecha: "2026-11-30", hora: "20:00", sala: "4", precioCentavos: 1500000, cuposTotales: 20 },
  { id: "demo-fun-009", peliculaId: "demo-pel-004", fecha: "2026-11-30", hora: "09:00", sala: "1", precioCentavos: 2525075, cuposTotales: 14 },
];

const COMPRAS: SeedCompra[] = [
  { id: "demo-com-001", funcionId: "demo-fun-001", nombreCliente: "Cliente Demo A", cantidadBoletos: 2, fechaCompra: "2026-11-24T09:15:00-05:00" },
  { id: "demo-com-002", funcionId: "demo-fun-002", nombreCliente: "Cliente Demo B", cantidadBoletos: 3, fechaCompra: `${DEMO_TODAY}T10:20:00-05:00` },
  { id: "demo-com-003", funcionId: "demo-fun-003", nombreCliente: "Cliente Demo C", cantidadBoletos: 1, fechaCompra: `${DEMO_TODAY}T18:40:00-05:00` },
  { id: "demo-com-004", funcionId: "demo-fun-004", nombreCliente: "Cliente Demo D", cantidadBoletos: 4, fechaCompra: "2026-11-26T12:05:00-05:00" },
  { id: "demo-com-005", funcionId: "demo-fun-005", nombreCliente: "Cliente Demo E", cantidadBoletos: 5, fechaCompra: "2026-11-27T15:30:00-05:00" },
  { id: "demo-com-006", funcionId: "demo-fun-006", nombreCliente: "Cliente Demo F", cantidadBoletos: 5, fechaCompra: "2026-11-28T19:10:00-05:00" },
  { id: "demo-com-007", funcionId: "demo-fun-008", nombreCliente: "Cliente Demo G", cantidadBoletos: 2, fechaCompra: "2026-11-29T08:45:00-05:00" },
  { id: "demo-com-008", funcionId: "demo-fun-009", nombreCliente: "Cliente Demo H", cantidadBoletos: 3, fechaCompra: "2026-12-01T16:25:00-05:00" },
];

/**
 * Devuelve un estado nuevo e independiente en cada llamada.
 * El orden de los arreglos es fijo y no hay reloj, azar ni datos externos.
 */
export function createSeedState(): TaquillaDemoState {
  const compras: DemoCompra[] = COMPRAS.map((compra) => {
    const funcion = FUNCIONES.find((candidate) => candidate.id === compra.funcionId);
    if (!funcion) {
      throw new Error(`Compra demo con función inexistente: ${compra.funcionId}`);
    }
    return {
      ...compra,
      totalCentavos: calculatePurchaseTotalCents(
        funcion.precioCentavos,
        compra.cantidadBoletos,
      ),
    };
  });

  const funciones: DemoFuncion[] = FUNCIONES.map((funcion) => ({
    ...funcion,
    cuposDisponibles: calculateAvailableAfterCapacityChange(
      funcion.cuposTotales,
      countSoldTickets(compras, funcion.id),
    ),
  }));

  return {
    version: DEMO_STATE_VERSION,
    peliculas: PELICULAS.map((pelicula) => ({ ...pelicula })),
    funciones,
    compras,
  };
}
