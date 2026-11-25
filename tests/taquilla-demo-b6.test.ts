/**
 * C6 — Contratos de Compras simuladas y reportes de taquilla.
 *
 * El arnés del portafolio no incluye React Testing Library: aquí se comprueban
 * los contratos puros que alimentan ambas vistas, la integración de sus archivos
 * en `TaquillaDemo`, la fecha local de Bogotá y los límites de aislamiento.
 * Los clics, el foco y el diseño responsive se verifican en navegador.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import * as assert from "node:assert/strict";

import { createSeedState } from "../src/data/taquilla-cine-demo/seed";
import { DEMO_TODAY, type TaquillaDemoState } from "../src/data/taquilla-cine-demo/types";
import { bogotaDayKey, fechaCompraBogota } from "../src/lib/taquilla-cine-demo/bogota-time";
import {
  buildComprasView,
  buildOpcionesCompra,
  nextCompraId,
} from "../src/lib/taquilla-cine-demo/compras-view";
import { formatCOP } from "../src/lib/taquilla-cine-demo/pricing";
import { applyDemoAction } from "../src/lib/taquilla-cine-demo/reducer";
import { buildReporteViewFromInputs } from "../src/lib/taquilla-cine-demo/reportes-view";
import {
  selectCuposDisponibles,
  selectResumenTaquilla,
} from "../src/lib/taquilla-cine-demo/selectors";
import {
  TAQUILLA_STORAGE_KEY,
  clearTaquillaState,
  loadTaquillaState,
  resetTaquillaHydrationGate,
  saveTaquillaState,
  type TaquillaStorageLike,
} from "../src/lib/taquilla-cine-demo/storage";
import {
  firstIssueMessage,
  validateCompraInput,
  validateFuncionInput,
  type CompraInput,
} from "../src/lib/taquilla-cine-demo/validation";

const FECHA_COMPRA = "2026-11-25T20:00:00-05:00";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function input(
  overrides: Partial<Record<keyof CompraInput, unknown>> = {},
): Record<string, unknown> {
  return {
    funcionId: "demo-fun-001",
    nombreCliente: "Cliente Demo I",
    cantidadBoletos: 3,
    ...overrides,
  };
}

function valido(overrides: Partial<Record<keyof CompraInput, unknown>> = {}): CompraInput {
  const resultado = validateCompraInput(input(overrides), createSeedState());
  assert.ok(resultado.ok);
  return resultado.value;
}

function mensaje(overrides: Partial<CompraInput>): string {
  const resultado = validateCompraInput(input(overrides), createSeedState());
  assert.ok(!resultado.ok);
  return firstIssueMessage(resultado);
}

function registrar(
  state: TaquillaDemoState,
  overrides: Partial<Record<keyof CompraInput, unknown>> = {},
  id = "demo-com-009",
  fechaCompra = FECHA_COMPRA,
) {
  return applyDemoAction(state, {
    type: "REGISTRAR_COMPRA",
    id,
    fechaCompra,
    // La acción viaja sin validar: es el reducer quien debe rechazarla.
    input: input(overrides) as unknown as CompraInput,
  });
}

function funcion(state: TaquillaDemoState, id: string) {
  const encontrada = state.funciones.find((item) => item.id === id);
  assert.ok(encontrada);
  return encontrada;
}

function compra(state: TaquillaDemoState, id: string) {
  const encontrada = state.compras.find((item) => item.id === id);
  assert.ok(encontrada);
  return encontrada;
}

function almacenFalso(): TaquillaStorageLike & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => void datos.set(clave, valor),
    removeItem: (clave) => void datos.delete(clave),
  };
}

// ---------------------------------------------------------------------------
// Disponibilidad y selección de funciones
// ---------------------------------------------------------------------------

test("C6 · listado de funciones disponibles para comprar", () => {
  const opciones = buildOpcionesCompra(createSeedState());
  assert.equal(opciones.length, 9);
  assert.deepEqual(
    opciones.map((opcion) => opcion.id),
    [
      "demo-fun-001",
      "demo-fun-002",
      "demo-fun-003",
      "demo-fun-004",
      "demo-fun-005",
      "demo-fun-006",
      "demo-fun-007",
      "demo-fun-009",
      "demo-fun-008",
    ],
  );
  assert.equal(opciones.filter((opcion) => opcion.puedeComprar).length, 8);
  assert.match(opciones[0].etiqueta, /Viaje a la Luna Demo/);
  assert.ok(opciones[0].etiqueta.includes(formatCOP(1800000)));
  assert.equal(opciones[0].precioCentavos, 1800000);
});

test("C6 · identificación de funciones agotadas sin ocultarlas", () => {
  const opciones = buildOpcionesCompra(createSeedState());
  const agotada = opciones.find((opcion) => opcion.id === "demo-fun-002");
  assert.ok(agotada);
  assert.equal(agotada.estado, "agotada");
  assert.equal(agotada.cuposDisponibles, 0);
  assert.equal(agotada.puedeComprar, false);
  assert.match(agotada.etiqueta, /\(AGOTADA\)/);
  assert.equal(selectCuposDisponibles(createSeedState(), "demo-fun-002"), 0);
});

test("C6 · identificación de funciones con pocos cupos", () => {
  const opciones = buildOpcionesCompra(createSeedState());
  const pocos = opciones.filter((opcion) => opcion.estado === "pocos");
  assert.deepEqual(
    pocos.map((opcion) => opcion.id),
    ["demo-fun-005", "demo-fun-006"],
  );
  assert.deepEqual(
    pocos.map((opcion) => opcion.cuposDisponibles),
    [2, 4],
  );
  for (const opcion of pocos) {
    assert.match(opcion.etiqueta, /\(POCOS\)/);
    assert.equal(opcion.puedeComprar, true);
  }
});

// ---------------------------------------------------------------------------
// Registro de compras y validaciones
// ---------------------------------------------------------------------------

test("C6 · compra válida con ID determinista y fecha preparada por la acción", () => {
  const estado = createSeedState();
  assert.equal(nextCompraId(estado), "demo-com-009");
  assert.equal(fechaCompraBogota("2026-11-25T17:34:12Z"), "2026-11-25T12:34:12-05:00");

  const resultado = registrar(estado);
  assert.equal(resultado.changed, true);
  assert.equal(resultado.error, undefined);
  assert.equal(compra(resultado.state, "demo-com-009").totalCentavos, 5400000);
  assert.equal(compra(resultado.state, "demo-com-009").fechaCompra, FECHA_COMPRA);
  assert.equal(resultado.state.compras.length, 9);
  assert.equal(nextCompraId(resultado.state), "demo-com-010");
});

test("C6 · compra con cantidad cero se rechaza", () => {
  assert.equal(mensaje({ cantidadBoletos: 0 }), "El valor debe estar entre 1 y 2147483647");
});

test("C6 · compra con cantidad negativa se rechaza", () => {
  assert.equal(mensaje({ cantidadBoletos: -1 }), "El valor debe estar entre 1 y 2147483647");
});

test("C6 · compra con cantidad decimal se rechaza", () => {
  assert.equal(mensaje({ cantidadBoletos: 1.5 }), "El valor debe ser un entero seguro");
});

test("C6 · compra superior a los cupos disponibles se rechaza", () => {
  assert.equal(
    mensaje({ funcionId: "demo-fun-005", cantidadBoletos: 3 }),
    "Se solicitaron 3 boletos, pero solo hay 2 disponibles",
  );
});

test("C6 · compra sobre función agotada se rechaza", () => {
  assert.equal(
    mensaje({ funcionId: "demo-fun-002", cantidadBoletos: 1 }),
    "La función seleccionada está agotada",
  );
});

test("C6 · cliente vacío se rechaza", () => {
  assert.equal(mensaje({ nombreCliente: "   " }), "El campo es obligatorio");
});

test("C6 · cliente con longitud inválida se rechaza", () => {
  assert.equal(
    mensaje({ nombreCliente: "x".repeat(151) }),
    "El campo no puede superar 150 caracteres",
  );
  assert.ok(valido({ nombreCliente: "x".repeat(150) }));
});

test("C6 · total monetario correcto en centavos y COP", () => {
  const resultado = registrar(createSeedState(), {
    funcionId: "demo-fun-006",
    cantidadBoletos: 2,
  });
  const registrada = compra(resultado.state, "demo-com-009");
  assert.equal(registrada.totalCentavos, 3750100);
  const item = buildComprasView(resultado.state).items.find(
    (entrada) => entrada.id === "demo-com-009",
  );
  assert.ok(item);
  assert.equal(item.totalFormateado, formatCOP(3750100));
  assert.equal(item.precioFormateado, formatCOP(1875050));
});

test("C6 · total fuera del límite monetario se rechaza sin mutar el estado", () => {
  const estado = createSeedState();
  const funcionInput = validateFuncionInput(
    {
      peliculaId: "demo-pel-001",
      fecha: "2026-12-10",
      hora: "20:00",
      sala: "9",
      precioPesos: 9999999999.99,
      cuposTotales: 2,
    },
    estado,
  );
  assert.ok(funcionInput.ok);
  const conFuncion = applyDemoAction(estado, {
    type: "CREAR_FUNCION",
    id: "demo-fun-010",
    input: funcionInput.value,
  }).state;

  const resultado = registrar(
    conFuncion,
    { funcionId: "demo-fun-010", cantidadBoletos: 2 },
    "demo-com-009",
  );
  assert.equal(resultado.changed, false);
  assert.match(resultado.error ?? "", /El total de la compra supera el límite de 9999999999\.99 COP/);
  assert.deepEqual(resultado.state, conFuncion);
});

test("C6 · descuento correcto de cupos en una sola transición", () => {
  const estado = createSeedState();
  assert.equal(funcion(estado, "demo-fun-001").cuposDisponibles, 8);
  const resultado = registrar(estado, { cantidadBoletos: 3 });
  assert.equal(funcion(resultado.state, "demo-fun-001").cuposDisponibles, 5);
  assert.equal(selectCuposDisponibles(resultado.state, "demo-fun-001"), 5);
  assert.equal(resultado.state.compras.length, 9);
});

test("C6 · compra rechazada no modifica cupos ni historial", () => {
  const estado = createSeedState();
  const antes = selectResumenTaquilla(estado);
  const resultado = registrar(estado, { cantidadBoletos: 9 });
  assert.equal(resultado.changed, false);
  assert.match(resultado.error ?? "", /solo hay 8 disponibles/);
  assert.deepEqual(resultado.state, estado);
  assert.deepEqual(selectResumenTaquilla(resultado.state), antes);
});

test("C6 · el importe histórico se conserva si cambia el precio de la función", () => {
  const registrada = registrar(createSeedState(), { cantidadBoletos: 1 }).state;
  assert.equal(compra(registrada, "demo-com-009").totalCentavos, 1800000);

  const funcionInput = validateFuncionInput(
    {
      peliculaId: "demo-pel-001",
      fecha: "2026-11-25",
      hora: "10:30",
      sala: "1",
      precioPesos: 9999,
      cuposTotales: 10,
    },
    registrada,
    "demo-fun-001",
  );
  assert.ok(funcionInput.ok);
  const editada = applyDemoAction(registrada, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: funcionInput.value,
  }).state;

  assert.equal(compra(editada, "demo-com-009").totalCentavos, 1800000);
  const reporte = buildReporteViewFromInputs(editada, DEMO_TODAY, DEMO_TODAY);
  const detalle = reporte.detalles.find((item) => item.compraId === "demo-com-009");
  assert.ok(detalle);
  assert.equal(detalle.precioUnitarioCentavos, 999900);
  assert.equal(detalle.totalCentavos, 1800000);
});

// ---------------------------------------------------------------------------
// Historial y reporte
// ---------------------------------------------------------------------------

test("C6 · historial ordenado por fecha de compra y después por ID", () => {
  const tarde = "2026-12-01T20:00:00-05:00";
  const primera = registrar(
    createSeedState(),
    { funcionId: "demo-fun-007", cantidadBoletos: 1 },
    "demo-com-009",
    tarde,
  ).state;
  const segunda = registrar(
    primera,
    { funcionId: "demo-fun-007", cantidadBoletos: 1 },
    "demo-com-010",
    tarde,
  ).state;
  assert.deepEqual(
    buildComprasView(segunda).items.slice(0, 3).map((item) => item.id),
    ["demo-com-010", "demo-com-009", "demo-com-008"],
  );
});

test("C6 · reporte por fechas con KPIs del mismo conjunto filtrado", () => {
  const reporte = buildReporteViewFromInputs(createSeedState(), "2026-11-26", "2026-11-28");
  assert.equal(reporte.valido, true);
  assert.deepEqual(
    reporte.detalles.map((item) => item.compraId),
    ["demo-com-006", "demo-com-005", "demo-com-004"],
  );
  assert.equal(reporte.cantidadCompras, 3);
  assert.equal(reporte.boletosVendidos, 14);
  assert.equal(reporte.totalRecaudadoCentavos, 29375250);
  assert.equal(reporte.totalRecaudadoFormateado, formatCOP(29375250));
});

test("C6 · rango invertido muestra error y no inventa resultados", () => {
  const reporte = buildReporteViewFromInputs(createSeedState(), "2026-11-30", "2026-11-25");
  assert.equal(reporte.valido, false);
  assert.equal(reporte.issues[0]?.message, "La fecha inicial no puede ser posterior a la fecha final");
  assert.equal(reporte.detalles.length, 0);
  assert.equal(reporte.cantidadCompras, 0);
  assert.equal(reporte.boletosVendidos, 0);
  assert.equal(reporte.totalRecaudadoCentavos, 0);
  const vista = source("src/components/taquilla-cine-demo/TaquillaReportesView.tsx");
  assert.match(vista, /role="alert"/);
  assert.match(vista, /buildReporteViewFromInputs/);
});

test("C6 · rango sin compras muestra 0 compras, 0 boletos y $0", () => {
  const reporte = buildReporteViewFromInputs(createSeedState(), "2027-01-01", "2027-01-31");
  assert.equal(reporte.valido, true);
  assert.equal(reporte.esVacio, true);
  assert.equal(reporte.cantidadCompras, 0);
  assert.equal(reporte.boletosVendidos, 0);
  assert.equal(reporte.totalRecaudadoCentavos, 0);
  assert.equal(reporte.totalRecaudadoFormateado, formatCOP(0));
  assert.equal(reporte.mensajeVacio, "No hay ventas registradas en el rango seleccionado.");
});

test("C6 · KPIs y detalle coinciden después de una compra", () => {
  const estado = registrar(createSeedState()).state;
  const reporte = buildReporteViewFromInputs(estado, DEMO_TODAY, DEMO_TODAY);
  assert.equal(reporte.cantidadCompras, reporte.detalles.length);
  assert.equal(
    reporte.boletosVendidos,
    reporte.detalles.reduce((suma, item) => suma + item.cantidadBoletos, 0),
  );
  assert.equal(
    reporte.totalRecaudadoCentavos,
    reporte.detalles.reduce((suma, item) => suma + item.totalCentavos, 0),
  );
  assert.equal(reporte.totalRecaudadoCentavos, 13500000);
  assert.equal(reporte.totalRecaudadoFormateado, formatCOP(reporte.totalRecaudadoCentavos));
});

test("C6 · una compra actualiza historial, cupos y taquilla sin recargar", () => {
  const estado = registrar(createSeedState()).state;
  assert.equal(buildComprasView(estado).total, 9);
  assert.equal(funcion(estado, "demo-fun-001").cuposDisponibles, 5);
  const reporte = buildReporteViewFromInputs(estado, DEMO_TODAY, DEMO_TODAY);
  assert.ok(reporte.detalles.some((item) => item.compraId === "demo-com-009"));

  const demo = source("src/components/taquilla-cine-demo/TaquillaDemo.tsx");
  assert.match(demo, /activeView === "compras"/);
  assert.match(demo, /<TaquillaComprasView/);
  assert.match(demo, /activeView === "taquilla"/);
  assert.match(demo, /<TaquillaReportesView/);
});

// ---------------------------------------------------------------------------
// Persistencia, reinicio y fecha local
// ---------------------------------------------------------------------------

test("C6 · compra, cupos y reporte persisten tras recargar", () => {
  const almacen = almacenFalso();
  resetTaquillaHydrationGate();
  assert.equal(loadTaquillaState(almacen).status, "empty");
  const estado = registrar(createSeedState()).state;
  assert.equal(saveTaquillaState(estado, almacen), true);
  resetTaquillaHydrationGate();
  const cargado = loadTaquillaState(almacen);
  assert.equal(cargado.status, "ok");
  assert.ok(cargado.status === "ok");
  assert.equal(compra(cargado.state, "demo-com-009").totalCentavos, 5400000);
  assert.equal(funcion(cargado.state, "demo-fun-001").cuposDisponibles, 5);
  const reporte = buildReporteViewFromInputs(cargado.state, DEMO_TODAY, DEMO_TODAY);
  assert.ok(reporte.detalles.some((item) => item.compraId === "demo-com-009"));
  assert.deepEqual([...almacen.datos.keys()], [TAQUILLA_STORAGE_KEY]);
  assert.equal(almacen.datos.has("yeyder.fiore.demo.v1"), false);
  clearTaquillaState(almacen);
  assert.equal(almacen.datos.size, 0);
});

test("C6 · reiniciar restaura nueve funciones y ocho compras ficticias", () => {
  const estado = registrar(createSeedState()).state;
  const reiniciado = applyDemoAction(estado, { type: "RESET" }).state;
  assert.equal(reiniciado.funciones.length, 9);
  assert.equal(reiniciado.compras.length, 8);
  assert.equal(funcion(reiniciado, "demo-fun-001").cuposDisponibles, 8);
  assert.equal(selectResumenTaquilla(reiniciado).totalRecaudadoCentavos, 51650475);
  assert.equal(buildComprasView(reiniciado).total, 8);
  assert.equal(buildReporteViewFromInputs(reiniciado, DEMO_TODAY, "2026-11-30").detalles.length, 6);
  assert.match(source("src/components/taquilla-cine-demo/TaquillaDemo.tsx"), /setResetSerial/);
});

test("C6 · «Hoy» usa Bogotá UTC-05:00, cambia de día y no depende del dispositivo", () => {
  const antesDelCambio = "2026-11-25T04:59:59Z";
  const despuesDelCambio = "2026-11-25T05:00:00Z";
  assert.equal(bogotaDayKey(antesDelCambio), "2026-11-24");
  assert.equal(bogotaDayKey(despuesDelCambio), "2026-11-25");
  assert.equal(bogotaDayKey("fecha-invalida"), "");
  assert.equal(fechaCompraBogota(despuesDelCambio), "2026-11-25T00:00:00-05:00");

  const modulo = join(process.cwd(), ".b0-tests/src/lib/taquilla-cine-demo/bogota-time.js");
  const script = `
    const h = require(${JSON.stringify(modulo)});
    process.stdout.write(JSON.stringify([
      h.bogotaDayKey("2026-11-25T04:59:59Z"),
      h.bogotaDayKey("2026-11-25T05:00:00Z"),
      h.fechaCompraBogota("2026-11-25T17:34:12Z")
    ]));
  `;
  const salidas = ["Pacific/Kiritimati", "Etc/GMT+12"].map((tz) => {
    const proceso = spawnSync(process.execPath, ["-e", script], {
      env: { ...process.env, TZ: tz },
      encoding: "utf8",
    });
    assert.equal(proceso.status, 0, proceso.stderr);
    return proceso.stdout;
  });
  assert.equal(salidas[0], salidas[1]);
  assert.deepEqual(JSON.parse(salidas[0]), [
    "2026-11-24",
    "2026-11-25",
    "2026-11-25T12:34:12-05:00",
  ]);

  const reportes = source("src/components/taquilla-cine-demo/TaquillaReportesView.tsx");
  const compras = source("src/components/taquilla-cine-demo/TaquillaComprasView.tsx");
  const diario = source("src/lib/taquilla-cine-demo/bogota-time.ts");
  assert.match(reportes, /onClick=\{aplicarHoy\}/);
  assert.match(reportes, /bogotaDayKey\(new Date\(\)\)/);
  assert.match(compras, /fechaCompraBogota\(new Date\(\)\)/);
  assert.match(diario, /getUTCFullYear\(|getUTCHours\(/);
  assert.doesNotMatch(diario, /\.getHours\(|\.getDate\(/);
});
