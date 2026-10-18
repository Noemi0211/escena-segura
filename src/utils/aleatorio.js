/**
 * aleatorio.js — Utilidades de aleatoriedad.
 *
 * Capa: utils.
 *
 * Por qué existe como módulo y no como `Math.random()` en los motores:
 *   · los motores necesitan barajar, elegir N elementos sin repetir y
 *     seleccionar distractores; esa lógica es IDÉNTICA en Memory, Sprint y
 *     Escape Room, y también lo será en las nuevas unidades formativas;
 *   · centralizarla permite inyectar una semilla para depurar o para
 *     reproducir una partida exacta (útil en la revisión del profesorado).
 *
 * Interfaz de generator injectable:
 *  aleatorio.conSemilla(1234) -> genera() devuelve enteros reproducibles.
 */

/**
 * Indica si el valor recibido es una semilla válida.
 *
 * Motivo de existir: `crearGenerador(undefined)` hace `undefined >>> 0`, que
 * en JavaScript equivale a `0`. Sin esta comprobación, llamar a
 * `conSemilla(semillaNoIndicada, ...)` produciría SIEMPRE la misma partida
 * (semilla 0), es decir, el juego parecería estar roto o "amarrado".
 *
 * @param {*} semilla
 * @returns {boolean}
 */
export function esSemillaValida(semilla) {
  return Number.isInteger(semilla) && semilla >= 0 && semilla <= 0xffffffff;
}

/**
 * Generador pseudoaleatorio determinista (Mulberry32).
 * Rápido, 32 bits, calidad suficiente para barajados de elementos formativos.
 *
 * @param {number} semilla
 * @returns {() => number} Función que devuelve flotantes en [0, 1).
 */
export function crearGenerador(semilla) {
  let estado = semilla >>> 0;
  return function generar() {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generador por defecto. Envolvente de Math.random para poder sustituirlo.
 * @type {() => number}
 */
let generadorActual = () => Math.random();

/**
 * Sustituye el generador activo (para pruebas o partidas reproducibles).
 *
 * @param {() => number|null} generador  `null` restaura Math.random.
 */
export function usarGenerador(generador) {
  generadorActual = typeof generador === 'function' ? generador : () => Math.random();
}

/**
 * Activa un generador con semilla durante la ejecución de `accion`.
 *
 * Si la semilla NO es válida, la acción se ejecuta con el generador actual
 * (aleatoriedad real). Es el comportamiento correcto: "sin semilla" debe
 * significar "partida nueva impredecible", nunca "partida siempre igual".
 *
 * @template T
 * @param {number|undefined|null} semilla
 * @param {() => T} accion
 * @returns {T}
 */
export function conSemilla(semilla, accion) {
  if (!esSemillaValida(semilla)) {
    return accion();
  }
  const anterior = generadorActual;
  generadorActual = crearGenerador(semilla);
  try {
    return accion();
  } finally {
    generadorActual = anterior;
  }
}

/** Devuelve un entero en [0, maximo). */
export function entero(maximo) {
  return Math.floor(generadorActual() * maximo);
}

/** Devuelve un entero en [minimo, maximo] (ambos incluidos). */
export function enteroEntre(minimo, maximo) {
  return minimo + entero(maximo - minimo + 1);
}

/** Devuelve un booleano con probabilidad `probabilidad` (0..1). */
export function probabilidad(probabilidad) {
  return generadorActual() < probabilidad;
}

/** Elige un elemento al azar de un array. Devuelve `undefined` si está vacío. */
export function elegirUno(elementos) {
  if (!elementos || elementos.length === 0) return undefined;
  return elementos[entero(elementos.length)];
}

/**
 * Devuelve una copia barajada del array (Fisher-Yates).
 * No muta el original: los datos de src/data/ nunca deben alterarse.
 *
 * @template T
 * @param {T[]} elementos
 * @returns {T[]}
 */
export function barajar(elementos) {
  const copia = Array.isArray(elementos) ? [...elementos] : [];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = entero(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Toma `cantidad` elementos distintos al azar, sin repetir.
 *
 * @template T
 * @param {T[]} elementos
 * @param {number} cantidad
 * @returns {T[]} Como máximo `cantidad` elementos (menos si el array es corto).
 */
export function muestra(elementos, cantidad) {
  return barajar(elementos).slice(0, Math.max(0, cantidad));
}

/**
 * Elige `cantidad` distractores, excluyendo los ids indicados.
 * Función CRÍTICA: garantiza que la respuesta correcta nunca sea un distractor,
 * algo que en un juego formativo sería un fallo metodológico grave.
 *
 * @template {{id: string}} T
 * @param {T[]} universo        Todos los candidatos a distractor.
 * @param {string[]} excluidos   Ids que no deben aparecer (la respuesta correcta).
 * @param {number} cantidad
 * @returns {T[]}
 */
export function distractores(universo, excluidos = [], cantidad = 3) {
  const conjuntoExcluidos = new Set(excluidos);
  const candidatos = universo.filter((elemento) => !conjuntoExcluidos.has(elemento.id));
  return muestra(candidatos, cantidad);
}

/**
 * Reparte elementos en `numeroGrupos` grupos del tamaño más parecido posible.
 * Útil para organizar cartas de Memory en filas balanceadas.
 *
 * @template T
 * @param {T[]} elementos
 * @param {number} numeroGrupos
 * @returns {T[][]}
 */
export function repartir(elementos, numeroGrupos) {
  const barajados = barajar(elementos);
  const grupos = Array.from({ length: Math.max(1, numeroGrupos) }, () => []);
  const tamanoBase = Math.floor(barajados.length / Math.max(1, numeroGrupos));

  barajados.forEach((elemento, indice) => {
    const grupo = Math.floor(indice / tamanoBase);
    grupos[Math.min(grupo, grupos.length - 1)].push(elemento);
  });
  return grupos;
}
