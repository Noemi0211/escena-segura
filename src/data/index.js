/**
 * index.js — REGISTRO DE UNIDADES FORMATIVAS.
 *
 * Capa: DATOS. Este archivo es el ÚNICO punto donde se declara qué thematicas
 * existen. Ni las vistas, ni los motores, ni el enrutador conocen nombres de
 * unidades: preguntan aquí.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ UN REGISTRO Y NO UNA BÚSQUEDA AUTOMÁTICA
 * ---------------------------------------------------------------------------
 * Se podría recorrer el sistema de ficheros buscando `src/data/*.js`, pero
 * los navegadores no lo permiten. Un registro explícito aporta dos ventajas
 * decisivas para este proyecto:
 *
 *   1. ORDEN Y VISIBILIDAD. La pantalla principal se construye recorriendo el
 *      registro, así que añadir una unidad nueva es añadir una línea aquí y su
 *      fichero. No hay que tocar ninguna vista.
 *   2. CONTROL DE PUBLICACIÓN. Una unidad se publica cuando se añade aquí. Si
 *      alguien deja un `.docx` suelto o un fichero a medio escribir, la
 *      aplicación no lo carga nunca.
 *
 * ---------------------------------------------------------------------------
 * AÑADIR UNA UNIDAD NUEVA (Checklist)
 * ---------------------------------------------------------------------------
 *  1. Crear `src/data/<id>.js` exportando un objeto con el CONTRATO DE DATOS
 *     (misma forma que clasificacion.js, riesgos.js o pictogramas.js).
 *  2. Añadir el `import` y el objeto al array `unidades` de este archivo.
 *  3. Nada más. La pantalla principal, el menú de juegos, el progreso, las
 *     medallas y los tres motores funcionan sin tocar una sola línea más.
 *
 * ---------------------------------------------------------------------------
 * GARANTÍAS QUE ESTE MÓDULO ESTABLECE
 * ---------------------------------------------------------------------------
 * · Orden estable por el campo `orden` (nunca por el orden de los imports).
 * · Detección de `id` duplicados: un error costaría el progreso guardado.
 * · Auditoría de integridad de cada unidad al arrancar (ver `auditarUnidad`).
 * · Metadatos derivados (resumen de contenido) para las vistas.
 *
 * @module data
 */

import clasificacion from './clasificacion.js';
import riesgos from './riesgos.js';
import pictogramas from './pictogramas.js';

import { auditarUnidad, resumirUnidad } from '../utils/generadores.js';

/**
 * Colección completa de thematicas activas.
 * El array se congela: nadie puede añadir una unidad por accidente en tiempo
 * de ejecución.
 *
 * @type {ReadonlyArray<object>}
 */
export const unidades = Object.freeze(
  [clasificacion, riesgos, pictogramas].sort((a, b) => (a.orden || 0) - (b.orden || 0))
);

/**
 * Mapa id -> unidad, para acceso directo por parámetro de ruta.
 * Se construye una sola vez al cargar el módulo.
 *
 * @type {Map<string, object>}
 */
const indicePorId = new Map(unidades.map((unidad) => [unidad.id, unidad]));

/**
 * Devuelve una unidad por su identificador.
 *
 * @param {string} id
 * @returns {object|null} `null` si no existe (el enrutador muestra un aviso).
 */
export function obtenerUnidad(id) {
  return indicePorId.get(id) || null;
}

/**
 * Indica si una unidad existe.
 *
 * @param {string} id
 * @returns {boolean}
 */
export function existeUnidad(id) {
  return indicePorId.has(id);
}

/**
 * Devuelve todas las unidades con su resumen de contenido ya calculado.
 * Las vistas lo usan para mostrar "N casos · M pictogramas" sin recalcularlo.
 *
 * @returns {Array<object>} Copias ligeras `{...unidad, resumen}`.
 */
export function listarUnidadesConResumen() {
  return unidades.map((unidad) => ({ ...unidad, resumen: resumirUnidad(unidad) }));
}

/**
 * Audita todas las unidades y devuelve los problemas encontrados.
 *
 * Se ejecuta al arrancar SOLO en modo desarrollo. Es barato y protege frente
 * al error de contenido más habitual: un `id` mal escrito que rompe un
 * emparejamiento y produce una actividad con cartas irresolubles.
 *
 * @returns {{unidad: string, problema: string}[]}
 */
export function auditarTodasLasUnidades() {
  const problemas = [];

  // Ids duplicados entre unidades.
  const idsVistos = new Set();
  for (const unidad of unidades) {
    if (idsVistos.has(unidad.id)) {
      problemas.push({ unidad: unidad.id, problema: 'Id de unidad duplicado en el registro.' });
    }
    idsVistos.add(unidad.id);
  }

  for (const unidad of unidades) {
    for (const problema of auditarUnidad(unidad)) {
      problemas.push({ unidad: unidad.id, problema });
    }
  }

  return problemas;
}

/**
 * Número de actividades definidas en toda la aplicación.
 * Se muestra en la portada como indicador de amplitud del banco de actividades.
 *
 * @returns {number}
 */
export function totalActividades() {
  return unidades.length * 3; // Memory, Sprint y Escape Room por unidad.
}

export default {
  unidades,
  obtenerUnidad,
  existeUnidad,
  listarUnidadesConResumen,
  auditarTodasLasUnidades,
  totalActividades,
};
