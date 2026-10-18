/**
 * storage.js — Persistencia en LocalStorage.
 *
 * Capa: utils (transversal).
 *
 * Requisitos del proyecto cubiertos aquí:
 *   · puntuación máxima
 *   · actividades completadas
 *   · medallas obtenidas
 *   · progreso por temática
 *   · estadísticas básicas de uso
 *
 * Decisiones de diseño:
 *
 * 1. ESPACIADO DE NOMBRES + VERSIÓN. Todas las claves empiezan por
 *    `escena-segura:v1:`. Al subir la versión del esquema se cambia el
 *    prefijo y se conserva el anterior para poder migrar, de modo que un
 *    alumno no pierde su progreso al desplegar una actualización.
 *
 * 2. NUNCA LANZAR EXCEPCIONES. El almacenamiento puede estar lleno, bloqueado
 *    por privacidad o deshabilitado (navegación privada en algunos casos).
 *    Si falla, la aplicación DEBE seguir funcionando en memoria. Un fallo de
 *    guardado no puede impedir dar clase.
 *
 * 3. ESQUEMA NORMALIZADO. El estado se guarda como un único documento JSON
 *    versionado en lugar de docenas de claves sueltas: más rápido de leer,
 *    más fácil de migrar y de depurar.
 *
 * 4. SIN DATOS PERSONALES. No se guarda nombre, ni email, ni identificador de
 *    alumno. Solo progreso. Es una decisión de privacidad, no un descuido.
 *
 * @module utils/storage
 */

/** Prefijo de todas las claves. Cambiarlo = migrar esquema. */
const PREFIJO = 'escena-segura:v1:';
const CLAVE_ESTADO = `${PREFIJO}estado`;

/** Esquema por defecto: se usa cuando no hay nada guardado o hay datos viejos. */
const ESTADO_INICIAL = Object.freeze({
  version: 1,

  /** Mejor marca por juego. Clave: `${idTematica}/${idJuego}`. */
  mejoresPuntuaciones: {},

  /** Actividades superadas al menos una vez. Misma clave que mejoresPuntuaciones. */
  actividadesCompletadas: {},

  /** Medallas por clave de actividad. */
  medallas: {},

  /** Progreso por temática. Clave: `idTematica`. */
  progresoTematicas: {},

  /** Estadísticas de uso agregadas (no trazas por partida). */
  estadisticas: {
    partidasIniciadas: 0,
    partidasTerminadas: 0,
    intentos: 0,
    respuestasTotales: 0,
    aciertosTotales: 0,
    ultimaPartida: null,
  },

  /**
   * Revisión de la ÚLTIMA partida de cada actividad: qué se respondió, cuál
   * era la correcta y por qué.
   *
   * Clave: `${idTematica}/${idJuego}`. Se guarda solo la última, no un
   * historial: el repaso sirve para lo que acabas de hacer, y guardar todas las
   * partidas multiplicaría los bytes sin aportar nada que un alumno use. Además
   * evita cualquier sombra de traza sobre qué ha fallingado cada persona
   * (§4, cero datos personales).
   *
   * Límite de tamaño: se recorta a los 40 ítems más recientes. Un Sprint son 10
   * preguntas, pero un Escape Room largo podría pasarse, y un `localStorage`
   * lleno hace que `escribirEstado()` falle en silencio y se pierda TODO el
   * progreso, no solo la revisión.
   */
  revisiones: {},

  /** Preferencias de la interfaz. */
  preferencias: {
    tema: 'automatico', // 'automatico' | 'oscuro' | 'claro'
  },
});

/** Máximo de ítems de revisión guardados por actividad. */
const MAXIMO_ITEMS_REVISION = 40;

/** Clon profundo del estado inicial (el original está congelado). */
function crearEstadoInicial() {
  return JSON.parse(JSON.stringify(ESTADO_INICIAL));
}

/**
 * Caché en memoria. Evita releer/parsear LocalStorage en cada consulta y sirve
 * de copia de seguridad cuando el almacenamiento real no está disponible.
 * @type {object|null}
 */
let estadoEnMemoria = null;

/** Indica si LocalStorage es realmente utilizable en este navegador. */
let almacenamientoDisponible = null;

/**
 * Comprueba si LocalStorage está disponible y es escribible.
 * La prueba escribe y borra una clave: `localStorage.length` no es fiable
 * porque puede estar disponible pero lanzar al escribir (cuota, modo privado).
 *
 * @returns {boolean}
 */
function comprobarAlmacenamiento() {
  if (almacenamientoDisponible !== null) return almacenamientoDisponible;
  try {
    const clavePrueba = `${PREFIJO}__prueba__`;
    window.localStorage.setItem(clavePrueba, '1');
    window.localStorage.removeItem(clavePrueba);
    almacenamientoDisponible = true;
  } catch {
    almacenamientoDisponible = false;
  }
  return almacenamientoDisponible;
}

/**
 * Fusiona en profundidad el estado guardado sobre el estado inicial.
 * Así, un documento guardado con una versión anterior recibe por omisión los
 * campos nuevos, sin perder lo que ya tenía el alumno.
 *
 * @param {object} base
 * @param {object} relleno
 * @returns {object}
 */
function fusionar(base, relleno) {
  const salida = { ...base };
  for (const [clave, valor] of Object.entries(relleno || {})) {
    if (valor === undefined || valor === null) continue;
    const esObjeto =
      typeof valor === 'object' && valor !== null && !Array.isArray(valor) &&
      typeof salida[clave] === 'object' && salida[clave] !== null && !Array.isArray(salida[clave]);
    salida[clave] = esObjeto ? fusionar(salida[clave], valor) : valor;
  }
  return salida;
}

/**
 * Lee el estado completo de la aplicación.
 *
 * @returns {object} Estado normalizado (nunca `null`).
 */
export function leerEstado() {
  if (estadoEnMemoria) return estadoEnMemoria;

  if (!comprobarAlmacenamiento()) {
    estadoEnMemoria = crearEstadoInicial();
    return estadoEnMemoria;
  }

  try {
    const bruto = window.localStorage.getItem(CLAVE_ESTADO);
    estadoEnMemoria = bruto
      ? fusionar(crearEstadoInicial(), JSON.parse(bruto))
      : crearEstadoInicial();
  } catch {
    // JSON corrupto: se descarta y se empieza limpio. Perder progreso es
    // preferible a dejar la aplicación inutilizable.
    estadoEnMemoria = crearEstadoInicial();
  }
  return estadoEnMemoria;
}

/**
 * Escribe el estado completo. Silencia errores de cuota.
 *
 * @param {object} estado
 * @returns {boolean} `true` si se ha guardado en disco.
 */
export function escribirEstado(estado) {
  estadoEnMemoria = estado;
  if (!comprobarAlmacenamiento()) return false;
  try {
    window.localStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

/**
 * Aplica cambios parciales sobre el estado y lo persiste.
 * Es la ÚNICA forma de modificar el progreso en la aplicación.
 *
 * @param {(estado: object) => void} mutador  Recibe el estado a modificar.
 * @returns {object} El estado resultante.
 *
 * @example
 *   actualizarProgreso((e) => { e.estadisticas.intentos += 1 })
 */
export function actualizar(mutador) {
  const estado = leerEstado();
  mutador(estado);
  escribirEstado(estado);
  return estado;
}

/* ==========================================================================
   API DE ALTO NIVEL — la que usarán los motores y las vistas
   ========================================================================== */

/**
 * Registra el inicio de una partida.
 *
 * @param {string} idTematica
 * @param {string} idJuego
 */
export function registrarInicio(idTematica, idJuego) {
  actualizar((estado) => {
    estado.estadisticas.partidasIniciadas += 1;
    estado.estadisticas.intentos += 1;
    estado.estadisticas.ultimaPartida = { idTematica, idJuego, fecha: new Date().toISOString() };
  });
}

/**
 * Registra el resultado de una partida y actualiza máximos, medallas y progreso.
 *
 * @param {object} resultado
 * @param {string} resultado.idTematica
 * @param {string} resultado.idJuego
 * @param {number} resultado.puntuacion
 * @param {number} [resultado.maximo]      Puntuación máxima posible.
 * @param {number} [resultado.aciertos]
 * @param {number} [resultado.total]
 * @param {boolean} [resultado.superado]   Marca la actividad como completada.
 * @param {string} [resultado.medalla]     Id de medalla si se ha alcanzado.
 * @param {object[]} [resultado.revision] Repaso de la partida, si el motor lo produce.
 * @returns {{nuevaMarca: boolean, medallaNueva: boolean}}
 */
export function registrarResultado(resultado) {
  const clave = `${resultado.idTematica}/${resultado.idJuego}`;
  let nuevaMarca = false;
  let medallaNueva = false;

  actualizar((estado) => {
    const previo = estado.mejoresPuntuaciones[clave];
    const puntuacion = Number(resultado.puntuacion) || 0;

    if (previo === undefined || puntuacion > previo) {
      estado.mejoresPuntuaciones[clave] = puntuacion;
      nuevaMarca = true;
    }

    if (resultado.superado) {
      estado.actividadesCompletadas[clave] = true;
    }

    if (resultado.medalla) {
      const claveMedalla = clave;
      if (!estado.medallas[claveMedalla]) medallaNueva = true;
      estado.medallas[claveMedalla] = resultado.medalla;
    }

    // --- Progreso por temática ---
    const tema = estado.progresoTematicas[resultado.idTematica] || {
      partidas: 0,
      completadas: 0,
      mejorPuntuacion: 0,
    };
    tema.partidas += 1;
    if (resultado.superado) tema.completadas += 1;
    if (puntuacion > tema.mejorPuntuacion) tema.mejorPuntuacion = puntuacion;
    estado.progresoTematicas[resultado.idTematica] = tema;

    // --- Revisión de la partida ---
    // Se guarda la revisión que el motor haya producido, recortada por si acaso.
    // Sin esto el alumno termina la actividad sin ver nunca la respuesta
    // correcta de lo que falló, que es justo lo que le hace falta para repasar.
    if (Array.isArray(resultado.revision) && resultado.revision.length > 0) {
      estado.revisiones[clave] = resultado.revision.slice(-MAXIMO_ITEMS_REVISION);
    }

    // --- Estadísticas agregadas ---
    estado.estadisticas.partidasTerminadas += 1;
    if (resultado.total) {
      estado.estadisticas.respuestasTotales += resultado.total;
      estado.estadisticas.aciertosTotales += resultado.aciertos || 0;
    }
  });

  return { nuevaMarca, medallaNueva };
}

/**
 * Devuelve la mejor puntuación conocida para un juego.
 *
 * @param {string} idTematica
 * @param {string} idJuego
 * @returns {number} 0 si no hay registro.
 */
export function mejorPuntuacion(idTematica, idJuego) {
  return leerEstado().mejoresPuntuaciones[`${idTematica}/${idJuego}`] || 0;
}

/**
 * Indica si una actividad se ha completado alguna vez.
 *
 * @param {string} idTematica
 * @param {string} idJuego
 * @returns {boolean}
 */
export function estaCompletada(idTematica, idJuego) {
  return Boolean(leerEstado().actividadesCompletadas[`${idTematica}/${idJuego}`]);
}

/**
 * Devuelve la medalla de un juego, si la tiene.
 *
 * @param {string} idTematica
 * @param {string} idJuego
 * @returns {string|null}
 */
export function medallaDe(idTematica, idJuego) {
  return leerEstado().medallas[`${idTematica}/${idJuego}`] || null;
}

/**
 * Revisión guardada de la última partida de una actividad.
 *
 * @param {string} idTematica
 * @param {string} idJuego
 * @returns {object[]} Lista vacía si no hay partida guardada.
 */
export function revisionDe(idTematica, idJuego) {
  return leerEstado().revisiones[`${idTematica}/${idJuego}`] || [];
}

/**
 * Progreso de una temática.
 *
 * @param {string} idTematica
 * @returns {{partidas: number, completadas: number, mejorPuntuacion: number}}
 */
export function progresoDe(idTematica) {
  return (
    leerEstado().progresoTematicas[idTematica] || {
      partidas: 0,
      completadas: 0,
      mejorPuntuacion: 0,
    }
  );
}

/**
 * Estadísticas globales derivadas (calculadas, no almacenadas).
 *
 * @returns {{
 *   partidasIniciadas: number, partidasTerminadas: number, intentos: number,
 *   aciertos: number, respuestas: number, precision: number,
 *   actividadesCompletadas: number, medallas: number
 * }}
 */
export function estadisticasGlobales() {
  const estado = leerEstado();
  const { respuestasTotales, aciertosTotales } = estado.estadisticas;
  return {
    partidasIniciadas: estado.estadisticas.partidasIniciadas,
    partidasTerminadas: estado.estadisticas.partidasTerminadas,
    intentos: estado.estadisticas.intentos,
    respuestas: respuestasTotales,
    aciertos: aciertosTotales,
    precision: respuestasTotales > 0 ? aciertosTotales / respuestasTotales : 0,
    actividadesCompletadas: Object.keys(estado.actividadesCompletadas).length,
    medallas: Object.keys(estado.medallas).length,
  };
}

/* ==========================================================================
   PREFERENCIAS DE LA INTERFAZ
   ========================================================================== */

/**
 * Lee una preferencia.
 *
 * @param {string} clave
 * @param {*} [porDefecto]
 * @returns {*}
 */
export function obtenerPreferencia(clave, porDefecto = null) {
  const valor = leerEstado().preferencias?.[clave];
  return valor === undefined || valor === null ? porDefecto : valor;
}

/**
 * Guarda una preferencia.
 *
 * @param {string} clave
 * @param {*} valor
 */
export function guardarPreferencia(clave, valor) {
  actualizar((estado) => {
    estado.preferencias = { ...estado.preferencias, [clave]: valor };
  });
}

/* ==========================================================================
   MANTENIMIENTO
   ========================================================================== */

/**
 * Borra TODO el progreso. Lo usa el botón "Reiniciar progreso" del panel de
 * resultados, previa confirmación explícita del alumno.
 *
 * @returns {boolean} `true` si se ha borrado del almacenamiento.
 */
export function borrarProgreso() {
  estadoEnMemoria = crearEstadoInicial();
  if (!comprobarAlmacenamiento()) return false;
  try {
    window.localStorage.removeItem(CLAVE_ESTADO);
    return true;
  } catch {
    return false;
  }
}

/**
 * Exporta el progreso como texto JSON (copia de seguridad manual).
 *
 * @returns {string}
 */
export function exportarProgreso() {
  return JSON.stringify(leerEstado(), null, 2);
}

/**
 * Indica si el progreso se está guardando realmente o solo en memoria.
 * La interfaz debe avisar de ello para no engañar al alumnado.
 *
 * @returns {boolean}
 */
export function persistenciaActiva() {
  return comprobarAlmacenamiento();
}

/**
 * Aplica el tema preferido al elemento <html>.
 * Se ejecuta al arrancar y cada vez que el alumno cambia la preferencia.
 */
export function aplicarTemaPreferido() {
  const preferencia = obtenerPreferencia('tema', 'automatico');
  const oscuroDelSistema = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const temaEfectivo =
    preferencia === 'automatico' ? (oscuroDelSistema ? 'oscuro' : 'claro') : preferencia;

  document.documentElement.dataset.tema = temaEfectivo;
  return temaEfectivo;
}

/** Evidencia de que este módulo forma parte del arranque de la aplicación. */
export const versionEsquema = ESTADO_INICIAL.version;
