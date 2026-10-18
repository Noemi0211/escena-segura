/**
 * memory.js — MOTOR DEL MEMORY.
 *
 * Capa: games. LÓGICA DE JUEGO ÚNICAMENTE: ni una línea de CSS, ni una
 * búsqueda en el DOM, ni el nombre de ninguna unidad temática.
 *
 * ---------------------------------------------------------------------------
 * QUÉ HACE
 * ---------------------------------------------------------------------------
 * Recibe los PARES que `construirParesMemory()` ya ha resuelto y gestiona el
 * clásico juego de emparejar: dos mitades de tablero, una carta de la columna
 * izquierda y otra de la derecha. Al elegir dos cartas comprueba si son el
 * mismo par; si lo son, quedan fijadas; si no, se vuelven a ocultar.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ES REUTILIZABLE PARA UNA UNIDAD NUEVA
 * ---------------------------------------------------------------------------
 * Aquí no aparece ni un solo texto de tema formativo. El motor solo sabe que
 * existe una lista de pares y que cada par tiene `id`, `etiquetaIzquierda` y
 * `etiquetaDerecha`. Si mañana se añade una unidad "Prevención de incendios" con
 * la misma estructura, este fichero funciona sin una sola modificación.
 *
 * ---------------------------------------------------------------------------
 * DOS DETALLES DE DISEÑO QUE IMPORTAN
 * ---------------------------------------------------------------------------
 * 1. EL TABLERO SE BARAJA UNA SOLA VEZ. El orden de las columnas se calcula al
 *    iniciar la partida y se guarda en el cierre del motor. Si se calculara al
 *    pintar, el tablero se rebarajaría en cada repintado y sería imposible
 *    pulsar dos cartas seguidas: es un fallo clásico de este juego.
 *
 * 2. EL ESTADO ES UN OBJETO PLANO. `resueltos` es un ARRAY, no un `Set`, porque
 *    el estado se guarda en `localStorage` y se exporta. Un `Set` se
 *    serializaría como `{}` y el progreso se perdería al recargar. Las
 *    estructuras que no sobreviven a `JSON.stringify` viven en el cierre.
 *
 * @module games/memory
 */

import { crearMotorBase, reglasDe, calcularPorcentaje, medallaPara } from './motor.js';
import { construirVariantesMemory } from '../utils/generadores.js';
import { barajar, conSemilla } from '../utils/aleatorio.js';

/* ==========================================================================
   TABLERO
   ========================================================================== */

/** Situación de una carta en el tablero. La interfaz decide el aspecto. */
export const ESTADO_CARTA = Object.freeze({
  OCULTA: 'oculta',
  SELECCIONADA: 'seleccionada',
  RESUELTA: 'resuelta',
  FALLADA: 'fallada',
});

/**
 * Convierte la lista de pares en las dos columnas del tablero.
 *
 * Cada columna se baraja por separado. Barajar la lista conjunta haría que los
 * dos lados de un par quedaran casi siempre contiguos y el juego se resolvería
 * solo, sin exigir atención.
 *
 * @param {Array<object>} pares
 * @param {number} [semilla]
 * @returns {{izquierda: object[], derecha: object[]}}
 */
export function construirColumnas(pares, semilla) {
  return conSemilla(semilla, () => {
    const crear = (par, lado) => ({
      id: `${par.id}:${lado}`,
      lado,
      etiqueta: lado === 'izquierda' ? par.etiquetaIzquierda : par.etiquetaDerecha,
      contenido: lado === 'izquierda' ? par.izquierda : par.derecha,
      emparejaCon: par.id,
    });

    return {
      izquierda: barajar(pares).map((par) => crear(par, 'izquierda')),
      derecha: barajar(pares).map((par) => crear(par, 'derecha')),
    };
  });
}

/* ==========================================================================
   MOTOR
   ========================================================================== */

/**
 * Crea un motor de Memory listo para jugar.
 *
 * @param {object} unidad  Unidad temática de `src/data/`.
 * @param {object} [opciones] Opciones que se aplican en `iniciar()`.
 * @returns {object} Motor con la interfaz de `crearMotorBase` más `tablero()`
 *   y `resumen()`.
 */
export function crearMemory(unidad, opciones = {}) {
  const reglasPorDefecto = reglasDe('memory');

  /* --- Datos privados de la partida (fuera del estado) ------------------- */

  let pares = [];
  let variantes = [];
  let columnas = { izquierda: [], derecha: [] };
  /** Ids de las cartas justo seleccionadas. Como máximo dos. */
  let seleccion = [];
  /** Pares resaltados como fallidos, hasta el siguiente clic. */
  let fallados = new Set();
  /** Fallos seguidos, para decidir cuándo ofrecer la pista. */
  let intentosFallidos = 0;

  const motor = crearMotorBase({
    juego: 'memory',
    titulo: 'Memory',
    reglas: reglasPorDefecto,

    alIniciar(estado, opcionesInicio) {
      const semilla = opcionesInicio?.semilla;
      variantes = construirVariantesMemory(unidad, semilla);

      // Variante pedida; si no existe, la primera disponible.
      const pedida = opcionesInicio?.variante;
      const variante = variantes.find((v) => v.id === pedida) || variantes[0];

      pares = variante?.pares || [];
      columnas = construirColumnas(pares, semilla);
      seleccion = [];
      fallados = new Set();
      intentosFallidos = 0;

      estado.id = `${unidad?.id || 'unidad'}:memory`;
      estado.unidad = unidad;
      estado.titulo = variante?.titulo || 'Memory';
      estado.instruccion = variante?.instruccion || '';
      estado.varianteActual = variante?.id || null;
      estado.variantesDisponibles = variantes.map((v) => v.id);
      estado.total = pares.length;
      estado.indice = pares.length; // En Memory "indice" = pares ya resueltos.
      estado.resueltos = [];
      estado.seleccion = [];
      estado.etiquetas = {
        izquierda: variante?.etiquetaIzquierda || 'A',
        derecha: variante?.etiquetaDerecha || 'B',
      };

      if (pares.length === 0) {
        estado.fase = 'terminado';
        estado.terminado = true;
        estado.terminadoCorrectamente = false;
        estado.mensaje = 'Esta unidad todavía no tiene tarjetas para esta variante.';
        return;
      }

      estado.fase = 'jugando';
      estado.mensaje = 'Elige dos fichas y comprueba si forman pareja.';
    },

    alResponder(estado, idCarta) {
      if (estado.terminado || pares.length === 0) return;
      const carta = [...columnas.izquierda, ...columnas.derecha]
        .find((elemento) => elemento.id === idCarta);
      if (!carta || estado.resueltos.includes(carta.emparejaCon)) return;
      if (estado.seleccion.includes(idCarta)) return;
      if (seleccion.length >= 2) return;

      // Al elegir una carta nueva se olvida el resaltado del fallo anterior.
      fallados = new Set();

      seleccion.push(idCarta);
      estado.seleccion = [...seleccion];

      if (seleccion.length < 2) {
        estado.mensaje = 'Ahora elige otra ficha.';
        // La explicación del par anterior se retira al empezar uno nuevo: si se
        // dejara, la caja de realimentación anunciaría la del par ya resuelto
        // junto al mensaje de "elige otra ficha", que no van juntos.
        estado.detalle = null;
        return;
      }

      const [primera, segunda] = seleccion;
      const cartasElegidas = [...columnas.izquierda, ...columnas.derecha]
        .filter((elemento) => seleccion.includes(elemento.id));
      seleccion = [];
      estado.seleccion = [];

      if (cartasElegidas[0].emparejaCon === cartasElegidas[1].emparejaCon) {
        const idPar = cartasElegidas[0].emparejaCon;
        estado.resueltos = [...estado.resueltos, idPar];
        estado.aciertos += 1;
        estado.puntos += estado.reglas.puntosPareja ?? 10;
        estado.indice = estado.resueltos.length;
        estado.mensaje = '¡Pareja correcta!';
        estado.detalle = { explicacion: explicacionDe(idPar) };
        intentosFallidos = 0;
      } else {
        estado.fallos += 1;
        intentosFallidos += 1;
        fallados = new Set([primera, segunda]);
        const intentosParaPista = (estado.reglas.intentosParaAyuda || 3) - intentosFallidos;
        estado.mensaje =
          intentosParaPista > 0
            ? `No son pareja. Vuelven a ocultarse. (${intentosParaPista} ${intentosParaPista === 1 ? 'intento' : 'intentos'} antes de la pista)`
            : 'No son pareja. Mira el pictograma, la palabra o el símbolo: es lo que distingue una carta de otra.';
        estado.detalle = null;
      }

      if (estado.resueltos.length === pares.length) {
        estado.fase = 'terminado';
        estado.terminado = true;
        estado.terminadoCorrectamente = estado.fallos === 0;
        estado.mensaje = '¡Tablero completo!';
        estado.puntos += estado.fallos === 0 ? 20 : 0; // Bonus por tablero sin fallos.
      }
    },
  });

  /**
   * Explicación formativa del par recién resuelto.
   * @param {string} idPar
   * @returns {string}
   */
  function explicacionDe(idPar) {
    return pares.find((p) => p.id === idPar)?.explicacion || '';
  }

  /**
   * Tablero listo para pintar: las dos columnas con el estado de cada carta ya
   * calculado. La interfaz solo tiene que elegir colores y texto.
   *
   * @returns {{izquierda: object[], derecha: object[], resueltas: number}}
   */
  motor.tablero = () => {
    const estado = motor.estado();
    const resueltos = new Set(estado.resueltos);
    const seleccionadas = new Set(estado.seleccion);

    const decorar = (columna) =>
      columna.map((carta) => {
        let situacion = ESTADO_CARTA.OCULTA;
        if (resueltos.has(carta.emparejaCon)) situacion = ESTADO_CARTA.RESUELTA;
        else if (seleccionadas.has(carta.id)) situacion = ESTADO_CARTA.SELECCIONADA;
        else if (fallados.has(carta.id)) situacion = ESTADO_CARTA.FALLADA;
        return { ...carta, situacion };
      });

    return {
      izquierda: decorar(columnas.izquierda),
      derecha: decorar(columnas.derecha),
      resueltas: resueltos.size,
    };
  };

  /**
   * Revisión del tablero: un bloque por pareja, con el emparejamiento correcto y
   * su explicación.
   *
   * En Memory el alumno no se equivoca "una pregunta": se equivoca un
   * emparejamiento, y lo que hay que revisar es qué dos cartas iban juntas. Por
   * eso la revisión se plantea por pares y no por intentos fallidos, que además
   * serían ruido: el mismo error se repite muchas veces.
   *
   * @returns {object[]}
   */
  motor.revision = () => {
    const estado = motor.estado();
    return pares.map((par, indice) => ({
      numero: indice + 1,
      titulo: `${estado.etiquetas.izquierda} ↔ ${estado.etiquetas.derecha}`,
      acierto: estado.resueltos.includes(par.id),
      izquierda: par.izquierda,
      derecha: par.derecha,
      explicacion: par.explicacion || '',
    }));
  };

  /** Resumen de la partida, listo para la pantalla de resultados. */
  motor.resumen = () => {
    const estado = motor.estado();
    const porcentaje = calcularPorcentaje(estado.aciertos, pares.length || 1);
    return {
      juego: 'memory',
      titulo: estado.titulo,
      aciertos: estado.aciertos,
      fallos: estado.fallos,
      puntos: estado.puntos,
      total: pares.length,
      porcentaje,
      medalla: medallaPara(porcentaje),
      completado: estado.terminado,
      revision: motor.revision(),
    };
  };

  /** Inicio inmediato con las opciones recibidas al crear el motor. */
  if (opciones && Object.keys(opciones).length > 0) motor.iniciar(opciones);

  return motor;
}
