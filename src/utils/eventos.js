/**
 * eventos.js — Buscador de eventos interno (patrón "publisher / subscriber").
 *
 * Capa: utils.
 *
 * Para qué sirve, en concreto, en esta aplicación:
 * un motor de juego no debe conocer la interfaz, pero la interfaz necesita
 * enterarse de que la partida ha terminado para mostrar la pantalla de
 * resultados. Sin este módulo, el motor tendría que llamar a vistas concretas
 * (acoplamiento) o la interfaz tendría que sondear el estado (sondeo).
 * Con el bus, ambos lados dependen solo de `eventos.js`.
 *
 * Analogía: es la línea de comunicación del centro coordinador. Los motores
 * "emiten" y la interfaz "escucha", sin conocerse entre sí.
 *
 * @module utils/eventos
 */

/**
 * @typedef {object} Suscriptor
 * @property {string} [nombre]  Identificador para poder unsubscribe() legible.
 * @property {(datos: object) => void} manejador
 */

/** @type {Map<string, Set<Function>>} */
const suscriptores = new Map();

/**
 * Emite un evento. No propaga excepciones: un suscriptor defectuoso no puede
 * romper el flujo de la partida ni la navegación.
 *
 * @param {string} tipo
 * @param {object} [datos]
 */
export function emitir(tipo, datos = {}) {
  const conjunto = suscriptores.get(tipo);
  if (!conjunto) return;

  for (const manejador of [...conjunto]) {
    try {
      manejador(datos);
    } catch (error) {
      console.error(`[eventos] fallo en un suscriptor de "${tipo}":`, error);
    }
  }
}

/**
 * Se suscribe a un evento.
 *
 * @param {string} tipo
 * @param {(datos: object) => void} manejador
 * @returns {() => void} Función para cancelar la suscripción.
 *
 * @example
 *   const cancelar = suscribir('partida:fin', ({ puntuacion }) => {...});
 */
export function suscribir(tipo, manejador) {
  if (!suscriptores.has(tipo)) suscriptores.set(tipo, new Set());
  suscriptores.get(tipo).add(manejador);

  return function cancelar() {
    suscriptores.get(tipo)?.delete(manejador);
  };
}

/**
 * Se suscribe a un evento y se cancela automáticamente al descargar la vista.
 * Las vistas lo usan para no dejar suscripciones huérfanas: sin esto, al
 * navegar mucho se acumularían manejadores y la aplicación se ralentizaría.
 *
 * @param {string} tipo
 * @param {(datos: object) => void} manejador
 * @returns {() => void}
 */
export function suscribirHastaDestruir(tipo, manejador) {
  const cancelar = suscribir(tipo, manejador);
  if (typeof window === 'undefined') return cancelar;

  const alDestruir = () => cancelar();
  window.addEventListener('vista:destruir', alDestruir, { once: true });
  return cancelar;
}

/**
 * Elimina todos los suscriptores de un tipo, o de todos los tipos.
 * Solo para pruebas y para `app.js` al reiniciar la aplicación.
 *
 * @param {string} [tipo]
 */
export function limpiar(tipo) {
  if (tipo) suscriptores.delete(tipo);
  else suscriptores.clear();
}

/* ==========================================================================
   CATÁLOGO DE EVENTOS
   --------------------------------------------------------------------------
   Nombres estables: son el CONTRATO entre motores e interfaz. Si se cambia un
   nombre, hay que actualizar todos los emisores y todos los suscriptores.
   Se exportan como constantes para que un error de tipografía no rompa nada.
   ========================================================================== */
export const EVENTOS = Object.freeze({
  /** El alumno entra en un juego. {idTematica, idJuego} */
  PARTIDA_INICIO: 'partida:inicio',
  /** El motor notifica cada respuesta. {correcta, indice, total} */
  PARTIDA_RESPUESTA: 'partida:respuesta',
  /** La partida termina. {idTematica, idJuego, puntuacion, maximo, ...} */
  PARTIDA_FIN: 'partida:fin',
  /** Se desbloquea una fase o actividad. {idTematica, idJuego} */
  PROGRESO: 'progreso:actualizado',
  /** Una vista va a desmontarse: aquí se limpian suscripciones y temporizadores. */
  VISTA_DESTRUIR: 'vista:destruir',
  /** Cambio de preferencia de interfaz (tema). {tema} */
  PREFERENCIA: 'preferencia:cambio',
});
