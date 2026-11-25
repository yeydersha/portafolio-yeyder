/**
 * C2 — Lógica pura de la futura pantalla de Compras.
 * Ordena `fecha_compra DESC, id DESC`, filtra por cliente/película/rango de
 * día local Bogotá y deriva los KPIs de la lista filtrada. Sin JSX ni efectos.
 */

import type { TaquillaDemoState } from "../../data/taquilla-cine-demo/types";
import { formatCOP } from "./pricing";
import {
  selectComprasConFuncion,
  selectCuposDisponibles,
  selectFuncionesConTitulo,
  summarizeSales,
  toBogotaDayKey,
  type CompraConFuncion,
  type ResumenTaquilla,
} from "./selectors";
import { DEMO_ID_PREFIXES } from "./validation";

export interface CompraViewItem extends CompraConFuncion {
  diaBogota: string;
  precioFormateado: string;
  totalFormateado: string;
}

export interface ComprasView extends ResumenTaquilla {
  items: readonly CompraViewItem[];
  total: number;
  esVacio: boolean;
  mensajeVacio: string;
}

export type EstadoOpcionCompra = "disponible" | "pocos" | "agotada";

export interface OpcionCompra {
  id: string;
  tituloPelicula: string;
  fecha: string;
  hora: string;
  sala: string;
  precioCentavos: number;
  cuposDisponibles: number;
  estado: EstadoOpcionCompra;
  puedeComprar: boolean;
  etiqueta: string;
}

const LIMITE_POCOS_CUPOS = 5;

/** Opciones del selector: agotadas incluidas, con la etiqueta del original. */
export function buildOpcionesCompra(
  state: TaquillaDemoState,
): OpcionCompra[] {
  return selectFuncionesConTitulo(state).map((funcion) => {
    const cuposDisponibles = selectCuposDisponibles(state, funcion.id);
    const estado: EstadoOpcionCompra =
      cuposDisponibles === 0
        ? "agotada"
        : cuposDisponibles <= LIMITE_POCOS_CUPOS
          ? "pocos"
          : "disponible";
    const sufijo =
      estado === "agotada" ? " (AGOTADA)" : estado === "pocos" ? " (POCOS)" : "";
    return {
      id: funcion.id,
      tituloPelicula: funcion.tituloPelicula,
      fecha: funcion.fecha,
      hora: funcion.hora,
      sala: funcion.sala,
      precioCentavos: funcion.precioCentavos,
      cuposDisponibles,
      estado,
      puedeComprar: cuposDisponibles > 0,
      etiqueta: `${funcion.tituloPelicula} · ${funcion.fecha} ${funcion.hora} · Sala ${funcion.sala} · ${formatCOP(funcion.precioCentavos)} · ${cuposDisponibles} cupos${sufijo}`,
    };
  });
}

/** ID determinista derivado del estado; sin reloj, azar ni almacenamiento. */
export function nextCompraId(state: TaquillaDemoState): string {
  let mayor = 0;
  const ids = [
    ...state.peliculas.map((item) => item.id),
    ...state.funciones.map((item) => item.id),
    ...state.compras.map((item) => item.id),
  ];
  for (const id of ids) {
    const coincidencia = /^demo-com-(\d+)$/.exec(id);
    if (coincidencia) mayor = Math.max(mayor, Number(coincidencia[1]));
  }
  return `${DEMO_ID_PREFIXES.compra}${String(mayor + 1).padStart(3, "0")}`;
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Filtro sobre el detalle ya ordenado. El rango es inclusivo y compara el día
 * local Bogotá extraído del timestamp con offset `-05:00`.
 */
export function filterCompras(
  items: readonly CompraConFuncion[],
  options: { query?: string; fechaDesde?: string; fechaHasta?: string } = {},
): CompraConFuncion[] {
  const busqueda = normalizeText(options.query ?? "");
  const desde = options.fechaDesde ?? "";
  const hasta = options.fechaHasta ?? "";
  if (desde && hasta && desde > hasta) return [];

  return items.filter((item) => {
    const dia = toBogotaDayKey(item.fechaCompra);
    if (desde && dia < desde) return false;
    if (hasta && dia > hasta) return false;
    if (!busqueda) return true;
    return [item.nombreCliente, item.tituloPelicula, item.sala].some((campo) =>
      normalizeText(campo).includes(busqueda),
    );
  });
}

export function buildComprasView(
  state: TaquillaDemoState,
  options: { query?: string; fechaDesde?: string; fechaHasta?: string } = {},
): ComprasView {
  const filtradas = filterCompras(selectComprasConFuncion(state), options);
  const items = filtradas.map((compra) => ({
    ...compra,
    diaBogota: toBogotaDayKey(compra.fechaCompra),
    precioFormateado: formatCOP(compra.precioUnitarioCentavos),
    totalFormateado: formatCOP(compra.totalCentavos),
  }));
  const esVacio = items.length === 0;
  return {
    ...summarizeSales(filtradas),
    items,
    total: items.length,
    esVacio,
    mensajeVacio:
      state.compras.length === 0
        ? "No hay compras registradas."
        : "No hay compras que coincidan con los filtros.",
  };
}
