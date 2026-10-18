/**
 * indice.js — Registro de las pantallas de juego.
 *
 * Capa: ui.
 *
 * ---------------------------------------------------------------------------
 * EL TERCER LUGAR DONDE NO HAY QUE TOCAR NADA
 * ---------------------------------------------------------------------------
 * El registro de unidades (`src/data/index.js`) es donde se declara QUÉ
 * thematicas existen. Este es donde se declara CÓMO se pinta cada juego. Un
 * cuarto juego se añade con una entrada aquí y con su motor en
 * `src/games/`; ni `app.js` ni las vistas de unidades necesitan enterarse.
 *
 * @module ui/juegos/indice
 */

import { vistaMemory } from './memory-vista.js';
import { vistaSprint } from './sprint-vista.js';
import { vistaEscape } from './escape-vista.js';

/** @type {Map<string, Function>} */
const PANTALLAS = new Map([
  ['memory', vistaMemory],
  ['sprint', vistaSprint],
  ['escape', vistaEscape],
]);

/**
 * Indica si hay pantalla para un juego.
 * @param {string} idJuego
 * @returns {boolean}
 */
export function hayPantalla(idJuego) {
  return PANTALLAS.has(idJuego);
}

/**
 * Monta la pantalla de un juego.
 *
 * @param {HTMLElement} contenedor
 * @param {string} idJuego
 * @param {string} idUnidad
 * @param {object} unidad
 * @param {object} [opciones]
 * @returns {(() => void)|null} Función de limpieza, o `null` si no hay pantalla.
 */
export function montarJuego(contenedor, idJuego, idUnidad, unidad, opciones = {}) {
  const pantalla = PANTALLAS.get(idJuego);
  if (!pantalla) return null;
  return pantalla(contenedor, idUnidad, unidad, opciones);
}
