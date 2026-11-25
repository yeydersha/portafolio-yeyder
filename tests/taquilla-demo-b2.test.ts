/**
 * C2 — Pruebas puras de validación, reducer, selectores, vistas y persistencia
 * de la demo de Taquilla de Cine. Sin frameworks: `node:test` + `node:assert`.
 */

import { test } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

import { createSeedState } from "../src/data/taquilla-cine-demo/seed";
import {
  DEMO_STATE_VERSION,
  DEMO_TODAY,
  type TaquillaDemoState,
} from "../src/data/taquilla-cine-demo/types";
import { formatCOP, pricePesosToCents } from "../src/lib/taquilla-cine-demo/pricing";
import {
  DEMO_ID_PREFIXES,
  firstIssueMessage,
  validateCompraInput,
  validateDemoId,
  validateDemoState,
  validateFechaCompra,
  validateFuncionInput,
  validatePeliculaInput,
  validateReporteRange,
  validateDateText,
  validateTimeText,
} from "../src/lib/taquilla-cine-demo/validation";
import {
  applyDemoAction,
  type TaquillaDemoAction,
} from "../src/lib/taquilla-cine-demo/reducer";
import {
  selectBoletosVendidos,
  selectComprasConFuncion,
  selectCuposDisponibles,
  selectFuncionesAgotadas,
  selectFuncionesConTitulo,
  selectFuncionesPocosCupos,
  selectPeliculas,
  selectReporteVentas,
  selectResumenTaquilla,
  summarizeSales,
  toBogotaDayKey,
} from "../src/lib/taquilla-cine-demo/selectors";
import {
  TAQUILLA_STORAGE_KEY,
  clearTaquillaState,
  isTaquillaHydrationResolved,
  loadTaquillaState,
  resetTaquillaHydrationGate,
  saveTaquillaState,
  type TaquillaStorageLike,
} from "../src/lib/taquilla-cine-demo/storage";
import {
  buildPeliculasView,
  filterPeliculas,
  sortPeliculas,
} from "../src/lib/taquilla-cine-demo/peliculas-view";
import {
  buildFuncionesView,
  filterFunciones,
  sortFunciones,
} from "../src/lib/taquilla-cine-demo/funciones-view";
import {
  buildComprasView,
  filterCompras,
} from "../src/lib/taquilla-cine-demo/compras-view";
import {
  RANGO_REPORTE_POR_DEFECTO,
  buildReporteView,
  buildReporteViewFromInputs,
} from "../src/lib/taquilla-cine-demo/reportes-view";

class FakeStorage implements TaquillaStorageLike {
  readonly values = new Map<string, string>();
  blocked = false;

  getItem(key: string): string | null {
    if (this.blocked) throw new Error("Storage bloqueado");
    return this.values.has(key) ? (this.values.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    if (this.blocked) throw new Error("Storage bloqueado");
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    if (this.blocked) throw new Error("Storage bloqueado");
    this.values.delete(key);
  }
}

function funcion(state: TaquillaDemoState, id: string) {
  const found = state.funciones.find((item) => item.id === id);
  assert.ok(found, `función ${id} inexistente`);
  return found;
}

function compra(state: TaquillaDemoState, id: string) {
  const found = state.compras.find((item) => item.id === id);
  assert.ok(found, `compra ${id} inexistente`);
  return found;
}

function peliculaInput(titulo = "Película Nueva Demo") {
  return {
    titulo,
    genero: "Drama",
    duracionMin: 95,
    clasificacion: "B",
  };
}

function aplicar(
  state: TaquillaDemoState,
  action: TaquillaDemoAction,
): { state: TaquillaDemoState; changed: boolean; error?: string } {
  const antes = JSON.stringify(state);
  const resultado = applyDemoAction(state, action);
  assert.equal(JSON.stringify(state), antes, "el estado de entrada fue mutado");
  assert.equal(validateDemoState(resultado.state).ok, true, "el estado resultante no es válido");
  return resultado;
}

// ---------------------------------------------------------------------------
// Validadores
// ---------------------------------------------------------------------------

test("1. los validadores usan el contrato ok/value/issues y recortan texto", () => {
  const resultado = validatePeliculaInput({
    titulo: "  Viaje Demo  ",
    genero: " Ciencia ficción ",
    duracionMin: 100,
    clasificacion: " A ",
  });
  assert.equal(resultado.ok, true);
  if (resultado.ok) {
    assert.deepEqual(resultado.value, {
      titulo: "Viaje Demo",
      genero: "Ciencia ficción",
      duracionMin: 100,
      clasificacion: "A",
    });
  }

  const invalido = validatePeliculaInput({ ...peliculaInput("   "), genero: "" });
  assert.equal(invalido.ok, false);
  if (!invalido.ok) {
    assert.ok(invalido.issues.some((issue) => issue.field === "titulo"));
    assert.ok(invalido.issues.some((issue) => issue.field === "genero"));
    assert.ok(firstIssueMessage(invalido).length > 0);
  }
});

test("2. los validadores rechazan claves calculadas, límites y formatos", () => {
  assert.equal(
    validatePeliculaInput({ ...peliculaInput(), id: "demo-pel-999", duracionMin: 0 }).ok,
    false,
  );
  assert.equal(validatePeliculaInput({ ...peliculaInput(), duracionMin: 1.5 }).ok, false);
  assert.equal(
    validatePeliculaInput({ ...peliculaInput(), titulo: "x".repeat(151) }).ok,
    false,
  );
  assert.equal(validateDateText("2026-02-30", "fecha", []), undefined);
  assert.equal(validateDateText("2024-02-29", "fecha", []), "2024-02-29");
  assert.equal(validateTimeText("24:00"), undefined);
  assert.equal(validateTimeText("23:59"), "23:59");
  assert.equal(validateFechaCompra(`${DEMO_TODAY}T10:00:00Z`), undefined);
  assert.equal(
    validateFechaCompra(`${DEMO_TODAY}T10:00:00-05:00`),
    `${DEMO_TODAY}T10:00:00-05:00`,
  );
  assert.equal(validateDemoId("pel-001", DEMO_ID_PREFIXES.pelicula).ok, false);
  assert.equal(validateDemoId("demo-pel-001", DEMO_ID_PREFIXES.pelicula).ok, true);
});

test("3. la validación de estado exige versión, referencias, cupos y totales", () => {
  const seed = createSeedState();
  assert.equal(validateDemoState(seed).ok, true);

  const versionCero = { ...seed, version: 0 };
  assert.equal(validateDemoState(versionCero).ok, false);

  const referenciaRota = createSeedState();
  referenciaRota.funciones[0] = { ...referenciaRota.funciones[0], peliculaId: "demo-pel-999" };
  assert.equal(validateDemoState(referenciaRota).ok, false);

  const cuposRotos = createSeedState();
  cuposRotos.funciones[0] = { ...cuposRotos.funciones[0], cuposDisponibles: 999 };
  assert.equal(validateDemoState(cuposRotos).ok, false);

  const totalRoto = createSeedState();
  totalRoto.compras[0] = { ...totalRoto.compras[0], totalCentavos: 3600001 };
  assert.equal(validateDemoState(totalRoto).ok, false);

  const idDuplicado = createSeedState();
  idDuplicado.peliculas[1] = { ...idDuplicado.peliculas[1], id: idDuplicado.peliculas[0].id };
  assert.equal(validateDemoState(idDuplicado).ok, false);
});

// ---------------------------------------------------------------------------
// Reducer: alta, edición y borrado
// ---------------------------------------------------------------------------

test("4. CREAR_PELICULA usa el ID de la acción y RESET devuelve la semilla", () => {
  const seed = createSeedState();
  const creada = aplicar(seed, {
    type: "CREAR_PELICULA",
    id: "demo-pel-007",
    input: peliculaInput(),
  });
  assert.equal(creada.changed, true);
  assert.equal(creada.error, undefined);
  assert.equal(creada.state.peliculas.length, 7);
  assert.equal(creada.state.peliculas[6].id, "demo-pel-007");
  assert.equal(creada.state.peliculas[6].titulo, "Película Nueva Demo");

  const repetida = aplicar(seed, {
    type: "CREAR_PELICULA",
    id: "demo-pel-001",
    input: peliculaInput(),
  });
  assert.equal(repetida.changed, false);
  assert.ok(repetida.error && repetida.error.length > 0);

  const reinicio = aplicar(creada.state, { type: "RESET" });
  assert.equal(reinicio.changed, true);
  assert.deepEqual(reinicio.state, seed);
  assert.equal(aplicar(seed, { type: "RESET" }).changed, false);
});

test("5. EDITAR_PELICULA conserva las funciones y ELIMINAR respeta dependencias", () => {
  const seed = createSeedState();
  const editada = aplicar(seed, {
    type: "EDITAR_PELICULA",
    id: "demo-pel-001",
    input: peliculaInput("Viaje Editado Demo"),
  });
  assert.equal(editada.changed, true);
  assert.equal(editada.state.funciones.length, seed.funciones.length);
  assert.equal(
    selectFuncionesConTitulo(editada.state).find((item) => item.id === "demo-fun-001")
      ?.tituloPelicula,
    "Viaje Editado Demo",
  );

  const conFunciones = aplicar(seed, { type: "ELIMINAR_PELICULA", id: "demo-pel-001" });
  assert.equal(conFunciones.changed, false);
  assert.match(conFunciones.error ?? "", /funciones asociadas/);

  const sinFunciones = aplicar(seed, { type: "ELIMINAR_PELICULA", id: "demo-pel-006" });
  assert.equal(sinFunciones.changed, true);
  assert.equal(sinFunciones.state.peliculas.length, 5);

  const inexistente = aplicar(seed, { type: "ELIMINAR_PELICULA", id: "demo-pel-999" });
  assert.equal(inexistente.changed, false);
});

test("6. CREAR_FUNCION convierte pesos a centavos e inicializa cupos", () => {
  const seed = createSeedState();
  const creada = aplicar(seed, {
    type: "CREAR_FUNCION",
    id: "demo-fun-010",
    input: {
      peliculaId: "demo-pel-006",
      fecha: "2026-12-02",
      hora: "21:00",
      sala: "5",
      precioPesos: 19950.5,
      cuposTotales: 12,
    },
  });
  assert.equal(creada.changed, true);
  const nueva = funcion(creada.state, "demo-fun-010");
  assert.equal(nueva.precioCentavos, pricePesosToCents(19950.5));
  assert.equal(nueva.cuposDisponibles, 12);
  assert.equal(
    selectFuncionesConTitulo(creada.state).find((item) => item.id === "demo-fun-010")
      ?.tituloPelicula,
    "Cuentos del Bosque Demo",
  );

  const precioInvalido = aplicar(seed, {
    type: "CREAR_FUNCION",
    id: "demo-fun-011",
    input: {
      peliculaId: "demo-pel-006",
      fecha: "2026-12-02",
      hora: "21:00",
      sala: "5",
      precioPesos: 12.345,
      cuposTotales: 5,
    },
  });
  assert.equal(precioInvalido.changed, false);

  const referenciaInvalida = validateFuncionInput(
    {
      peliculaId: "demo-pel-999",
      fecha: "2026-12-02",
      hora: "21:00",
      sala: "5",
      precioPesos: 100,
      cuposTotales: 5,
    },
    seed,
  );
  assert.equal(referenciaInvalida.ok, false);
});

test("7. EDITAR_FUNCION conserva vendidos y bloquea cambios incompatibles", () => {
  const seed = createSeedState();
  const vendidos = selectBoletosVendidos(seed, "demo-fun-001");
  assert.equal(vendidos, 2);

  const reducir = aplicar(seed, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: {
      peliculaId: "demo-pel-001",
      fecha: "2026-11-25",
      hora: "10:30",
      sala: "1",
      precioPesos: 25000,
      cuposTotales: 1,
    },
  });
  assert.equal(reducir.changed, false);
  assert.match(reducir.error ?? "", /cupos ya vendidos/);

  const editada = aplicar(seed, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: {
      peliculaId: "demo-pel-001",
      fecha: "2026-12-03",
      hora: "08:15",
      sala: "7",
      precioPesos: 25000,
      cuposTotales: 6,
    },
  });
  assert.equal(editada.changed, true);
  assert.equal(funcion(editada.state, "demo-fun-001").cuposDisponibles, 4);
  assert.equal(funcion(editada.state, "demo-fun-001").precioCentavos, 2500000);
  assert.equal(compra(editada.state, "demo-com-001").totalCentavos, 3600000);

  const cambiarPelicula = aplicar(seed, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: {
      peliculaId: "demo-pel-003",
      fecha: "2026-11-25",
      hora: "10:30",
      sala: "1",
      precioPesos: 18000,
      cuposTotales: 10,
    },
  });
  assert.equal(cambiarPelicula.changed, false);
  assert.match(cambiarPelicula.error ?? "", /película de una función que tiene compras/);
});

test("8. ELIMINAR_FUNCION bloquea funciones con compras", () => {
  const seed = createSeedState();
  const conCompras = aplicar(seed, { type: "ELIMINAR_FUNCION", id: "demo-fun-001" });
  assert.equal(conCompras.changed, false);
  assert.match(conCompras.error ?? "", /compras asociadas/);

  const sinCompras = aplicar(seed, { type: "ELIMINAR_FUNCION", id: "demo-fun-007" });
  assert.equal(sinCompras.changed, true);
  assert.equal(sinCompras.state.funciones.length, 8);
  assert.equal(sinCompras.state.compras.length, 8);
});

// ---------------------------------------------------------------------------
// Reducer: compras y cupos
// ---------------------------------------------------------------------------

test("9. REGISTRAR_COMPRA usa ID y fecha de la acción y descuenta cupos", () => {
  const seed = createSeedState();
  const fechaCompra = "2026-11-25T20:00:00-05:00";
  const registrada = aplicar(seed, {
    type: "REGISTRAR_COMPRA",
    id: "demo-com-009",
    fechaCompra,
    input: {
      funcionId: "demo-fun-001",
      nombreCliente: "Cliente Demo I",
      cantidadBoletos: 3,
    },
  });
  assert.equal(registrada.changed, true);
  const nueva = compra(registrada.state, "demo-com-009");
  assert.equal(nueva.fechaCompra, fechaCompra);
  assert.equal(nueva.totalCentavos, 5400000);
  assert.equal(funcion(registrada.state, "demo-fun-001").cuposDisponibles, 5);
  assert.equal(registrada.state.compras.length, 9);
});

test("10. compras rechazadas no producen efectos: agotada, exceso e ID repetido", () => {
  const seed = createSeedState();
  const agotada = aplicar(seed, {
    type: "REGISTRAR_COMPRA",
    id: "demo-com-009",
    fechaCompra: `${DEMO_TODAY}T20:00:00-05:00`,
    input: {
      funcionId: "demo-fun-002",
      nombreCliente: "Cliente Demo I",
      cantidadBoletos: 1,
    },
  });
  assert.equal(agotada.changed, false);
  assert.match(agotada.error ?? "", /agotada/);
  assert.deepEqual(agotada.state, seed);

  const exceso = aplicar(seed, {
    type: "REGISTRAR_COMPRA",
    id: "demo-com-009",
    fechaCompra: `${DEMO_TODAY}T20:00:00-05:00`,
    input: {
      funcionId: "demo-fun-005",
      nombreCliente: "Cliente Demo I",
      cantidadBoletos: 3,
    },
  });
  assert.equal(exceso.changed, false);
  assert.match(exceso.error ?? "", /solo hay 2 disponibles/);

  const repetido = aplicar(seed, {
    type: "REGISTRAR_COMPRA",
    id: "demo-com-001",
    fechaCompra: `${DEMO_TODAY}T20:00:00-05:00`,
    input: {
      funcionId: "demo-fun-001",
      nombreCliente: "Cliente Demo I",
      cantidadBoletos: 1,
    },
  });
  assert.equal(repetido.changed, false);
  assert.match(repetido.error ?? "", /ID ya existe/);

  const fechaMala = aplicar(seed, {
    type: "REGISTRAR_COMPRA",
    id: "demo-com-009",
    fechaCompra: `${DEMO_TODAY}T20:00:00Z`,
    input: {
      funcionId: "demo-fun-001",
      nombreCliente: "Cliente Demo I",
      cantidadBoletos: 1,
    },
  });
  assert.equal(fechaMala.changed, false);
  assert.match(fechaMala.error ?? "", /offset fijo/);

  const validacion = validateCompraInput(
    { funcionId: "demo-fun-001", nombreCliente: "Cliente Demo I", cantidadBoletos: 1 },
    seed,
  );
  assert.equal(validacion.ok, true);
});

test("11. HYDRATE acepta estado válido y rechaza corrupto sin alterar el actual", () => {
  const seed = createSeedState();
  const modificado = applyDemoAction(seed, {
    type: "CREAR_PELICULA",
    id: "demo-pel-007",
    input: peliculaInput("Hidratada Demo"),
  }).state;
  const hidratado = aplicar(seed, { type: "HYDRATE", state: modificado });
  assert.equal(hidratado.changed, true);
  assert.equal(hidratado.state.peliculas.length, 7);

  const corrupto = createSeedState();
  corrupto.version = 0 as 1;
  const rechazado = aplicar(seed, { type: "HYDRATE", state: corrupto });
  assert.equal(rechazado.changed, false);
  assert.deepEqual(rechazado.state, seed);

  const desconocida = applyDemoAction(seed, { type: "NO_EXISTE" as "RESET" });
  assert.equal(desconocida.changed, false);
  assert.match(desconocida.error ?? "", /Acción no reconocida/);
});

test("12. el reducer no contiene reloj, azar, window, localStorage ni fetch", () => {
  const ruta = path.join(process.cwd(), "src", "lib", "taquilla-cine-demo", "reducer.ts");
  const fuente = fs.readFileSync(ruta, "utf8");
  assert.doesNotMatch(fuente, /Date\.now\(|new Date\(|Math\.random\(|\bwindow\.|localStorage\.|\bfetch\(/);
});

// ---------------------------------------------------------------------------
// Selectores, historiales y ordenamientos
// ---------------------------------------------------------------------------

test("13. los selectores ordenan como el original y derivan cupos del historial", () => {
  const seed = createSeedState();
  assert.deepEqual(
    selectPeliculas(seed).map((item) => item.id),
    Array.from({ length: 6 }, (_, i) => `demo-pel-00${i + 1}`),
  );
  assert.deepEqual(
    selectFuncionesConTitulo(seed).map((item) => item.id),
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
  assert.deepEqual(
    selectComprasConFuncion(seed).map((item) => item.id),
    ["demo-com-008", "demo-com-007", "demo-com-006", "demo-com-005", "demo-com-004", "demo-com-003", "demo-com-002", "demo-com-001"],
  );

  assert.equal(selectCuposDisponibles(seed, "demo-fun-002"), 0);
  assert.equal(selectCuposDisponibles(seed, "demo-fun-005"), 2);
  assert.equal(selectCuposDisponibles(seed, "demo-fun-007"), 15);
  assert.equal(selectCuposDisponibles(seed, "demo-fun-999"), 0);
  assert.equal(
    selectFuncionesAgotadas(seed).map((item) => item.id).join(","),
    "demo-fun-002",
  );
  assert.deepEqual(
    selectFuncionesPocosCupos(seed).map((item) => item.id),
    ["demo-fun-005", "demo-fun-006"],
  );
});

test("14. el resumen usa importes históricos y nunca el precio actual", () => {
  const seed = createSeedState();
  const resumen = selectResumenTaquilla(seed);
  assert.deepEqual(resumen, {
    cantidadCompras: 8,
    boletosVendidos: 25,
    totalRecaudadoCentavos: 51650475,
  });

  const editada = applyDemoAction(seed, {
    type: "EDITAR_FUNCION",
    id: "demo-fun-001",
    input: {
      peliculaId: "demo-pel-001",
      fecha: "2026-11-25",
      hora: "10:30",
      sala: "1",
      precioPesos: 99999,
      cuposTotales: 10,
    },
  }).state;
  assert.deepEqual(selectResumenTaquilla(editada), resumen);
  assert.equal(
    summarizeSales([
      { cantidadBoletos: 2, totalCentavos: 100 },
      { cantidadBoletos: 3, totalCentavos: 200 },
    ]).totalRecaudadoCentavos,
    300,
  );
});

test("15. el reporte filtra en rango inclusivo Bogotá y deriva KPIs del detalle", () => {
  const seed = createSeedState();
  const reporte = selectReporteVentas(seed, RANGO_REPORTE_POR_DEFECTO);
  assert.equal(reporte.detalles.length, 6);
  assert.deepEqual(reporte.resumen, {
    cantidadCompras: 6,
    boletosVendidos: 20,
    totalRecaudadoCentavos: 40475250,
  });

  const unDia = selectReporteVentas(seed, {
    fechaDesde: DEMO_TODAY,
    fechaHasta: DEMO_TODAY,
  });
  assert.deepEqual(unDia.resumen, {
    cantidadCompras: 2,
    boletosVendidos: 4,
    totalRecaudadoCentavos: 8100000,
  });

  const completo = selectReporteVentas(seed, {
    fechaDesde: "2026-11-24",
    fechaHasta: "2026-12-01",
  });
  assert.deepEqual(completo.resumen, selectResumenTaquilla(seed));

  const invertido = selectReporteVentas(seed, {
    fechaDesde: "2026-11-30",
    fechaHasta: "2026-11-25",
  });
  assert.equal(invertido.detalles.length, 0);
  assert.equal(invertido.resumen.totalRecaudadoCentavos, 0);
  assert.equal(compra(seed, "demo-com-008").fechaCompra.slice(0, 10), "2026-12-01");
  assert.equal(toBogotaDayKey("2026-11-25T23:59:59-05:00"), "2026-11-25");
});

// ---------------------------------------------------------------------------
// Helpers de vista
// ---------------------------------------------------------------------------

test("16. películas-view busca sin tildes, ordena y describe el estado vacío", () => {
  const seed = createSeedState();
  assert.equal(filterPeliculas(seed.peliculas, "ciencia ficcion").length, 1);
  assert.equal(filterPeliculas(seed.peliculas, "   ").length, 6);
  assert.deepEqual(
    sortPeliculas(seed.peliculas, "titulo", "asc").map((item) => item.id)[0],
    "demo-pel-006",
  );
  const vista = buildPeliculasView(seed, { query: "no-existe" });
  assert.equal(vista.total, 0);
  assert.equal(vista.esVacio, true);
  assert.match(vista.mensajeVacio, /coincidan/);
  assert.equal(buildPeliculasView(seed).total, 6);
});

test("17. funciones-view clasifica cupos y filtra por película", () => {
  const seed = createSeedState();
  const vista = buildFuncionesView(seed);
  assert.equal(vista.total, 9);
  assert.equal(vista.items.find((item) => item.id === "demo-fun-002")?.estadoCupos, "agotada");
  assert.equal(vista.items.find((item) => item.id === "demo-fun-005")?.estadoCupos, "pocos");
  assert.equal(vista.items.find((item) => item.id === "demo-fun-007")?.estadoCupos, "disponible");
  assert.equal(vista.items[0].precioFormateado.length > 0, true);
  assert.equal(filterFunciones(selectFuncionesConTitulo(seed), { peliculaId: "demo-pel-001" }).length, 2);
  assert.deepEqual(
    sortFunciones(selectFuncionesConTitulo(seed), "desc").map((item) => item.id)[0],
    "demo-fun-008",
  );
  assert.equal(buildFuncionesView(seed, { query: "zzz" }).esVacio, true);
});

test("18. compras-view filtra por día local y recalcula KPIs del subconjunto", () => {
  const seed = createSeedState();
  const vista = buildComprasView(seed, {
    fechaDesde: DEMO_TODAY,
    fechaHasta: DEMO_TODAY,
  });
  assert.equal(vista.total, 2);
  assert.equal(vista.boletosVendidos, 4);
  assert.equal(vista.totalRecaudadoCentavos, 8100000);
  assert.equal(vista.items[0].diaBogota, DEMO_TODAY);
  assert.equal(vista.items[0].totalFormateado, formatCOP(vista.items[0].totalCentavos));
  assert.equal(filterCompras(selectComprasConFuncion(seed), { query: "cliente demo h" }).length, 1);
  assert.equal(
    filterCompras(selectComprasConFuncion(seed), {
      fechaDesde: "2026-11-30",
      fechaHasta: "2026-11-25",
    }).length,
    0,
  );
  assert.equal(buildComprasView(seed).total, 8);
});

test("19. reportes-view valida entradas y mantiene detalle y KPIs coherentes", () => {
  const seed = createSeedState();
  const vista = buildReporteView(seed);
  assert.equal(vista.valido, true);
  assert.equal(vista.detalles.length, 6);
  assert.equal(vista.cantidadCompras, vista.detalles.length);
  assert.equal(vista.totalRecaudadoFormateado, formatCOP(vista.totalRecaudadoCentavos));

  const invertida = buildReporteViewFromInputs(seed, "2026-11-30", "2026-11-25");
  assert.equal(invertida.valido, false);
  assert.ok(invertida.issues.length > 0);
  assert.equal(invertida.detalles.length, 0);
  assert.equal(invertida.totalRecaudadoCentavos, 0);

  const sinVentas = buildReporteViewFromInputs(seed, "2026-01-01", "2026-01-31");
  assert.equal(sinVentas.valido, true);
  assert.equal(sinVentas.esVacio, true);
  assert.equal(sinVentas.cantidadCompras, 0);
  assert.equal(validateReporteRange("2026-11-25", "2026-11-25").ok, true);
});

// ---------------------------------------------------------------------------
// Persistencia
// ---------------------------------------------------------------------------

test("20. la clave es propia, distinta de Fiore y la escritura espera hidratación", () => {
  assert.equal(TAQUILLA_STORAGE_KEY, "yeyder.taquilla-cine.demo.v1");
  assert.notEqual(TAQUILLA_STORAGE_KEY, "yeyder.fiore.demo.v1");
  resetTaquillaHydrationGate();
  const storage = new FakeStorage();
  const seed = createSeedState();
  assert.equal(isTaquillaHydrationResolved(), false);
  assert.equal(saveTaquillaState(seed, storage), false);
  assert.equal(storage.values.size, 0);

  const carga = loadTaquillaState(storage);
  assert.equal(carga.status, "empty");
  assert.equal(isTaquillaHydrationResolved(), true);
  assert.equal(saveTaquillaState(seed, storage), true);
  assert.deepEqual([...storage.values.keys()], [TAQUILLA_STORAGE_KEY]);
  assert.deepEqual(JSON.parse(storage.values.get(TAQUILLA_STORAGE_KEY) as string), seed);
  clearTaquillaState(storage);
  assert.equal(storage.values.size, 0);
});

test("21. la hidratación recupera un estado válido y descarta corrupto o antiguo", () => {
  resetTaquillaHydrationGate();
  const storage = new FakeStorage();
  const valido = applyDemoAction(createSeedState(), {
    type: "CREAR_PELICULA",
    id: "demo-pel-007",
    input: peliculaInput("Persistida Demo"),
  }).state;
  storage.values.set(TAQUILLA_STORAGE_KEY, JSON.stringify(valido));
  const carga = loadTaquillaState(storage);
  assert.equal(carga.status, "ok");
  if (carga.status === "ok") assert.deepEqual(carga.state, valido);

  storage.values.set(TAQUILLA_STORAGE_KEY, "{JSON roto");
  assert.equal(loadTaquillaState(storage).status, "invalid");
  assert.equal(storage.values.has(TAQUILLA_STORAGE_KEY), false);

  const antiguo = { ...createSeedState(), version: 0 };
  storage.values.set(TAQUILLA_STORAGE_KEY, JSON.stringify(antiguo));
  assert.equal(loadTaquillaState(storage).status, "invalid");
  assert.equal(storage.values.has(TAQUILLA_STORAGE_KEY), false);

  const roto = createSeedState();
  roto.compras[0] = { ...roto.compras[0], funcionId: "demo-fun-999" };
  storage.values.set(TAQUILLA_STORAGE_KEY, JSON.stringify(roto));
  assert.equal(loadTaquillaState(storage).status, "invalid");
  assert.equal(storage.values.has(TAQUILLA_STORAGE_KEY), false);
});

test("22. almacenamiento bloqueado no detiene la demo y no expone la clave", () => {
  resetTaquillaHydrationGate();
  const storage = new FakeStorage();
  storage.blocked = true;
  const carga = loadTaquillaState(storage);
  assert.equal(carga.status, "empty");
  if (carga.status === "empty") assert.match(carga.reason ?? "", /bloqueado/);
  assert.equal(isTaquillaHydrationResolved(), true);
  assert.equal(saveTaquillaState(createSeedState(), storage), false);
  clearTaquillaState(storage);

  resetTaquillaHydrationGate();
  assert.equal(loadTaquillaState(null).status, "empty");
  assert.equal(saveTaquillaState(createSeedState(), null), false);
});

test("23. RESET tras hidratación invalida permite volver al estado inicial", () => {
  resetTaquillaHydrationGate();
  const storage = new FakeStorage();
  const carga = loadTaquillaState(storage);
  assert.equal(carga.status, "empty");
  const mutable = applyDemoAction(createSeedState(), {
    type: "ELIMINAR_PELICULA",
    id: "demo-pel-006",
  }).state;
  assert.equal(saveTaquillaState(mutable, storage), true);
  const reinicio = aplicar(mutable, { type: "RESET" });
  assert.equal(reinicio.changed, true);
  assert.deepEqual(reinicio.state, createSeedState());
  assert.equal(saveTaquillaState(reinicio.state, storage), true);
  assert.equal(DEMO_STATE_VERSION, 1);
});
