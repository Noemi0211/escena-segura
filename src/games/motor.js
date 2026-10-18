/**
 * motor.js — CONTRATO COMÚN de los tres juegos.
 *
 * Capa: games.
 *
 * ---------------------------------------------------------------------------
 * EL CONCEPTO CENTRAL DEL PROYECTO
 * ---------------------------------------------------------------------------
 * La regla de oro de la arquitectura es: «los motores no conocen el contenido
 * y los datos no conocen los motores». Este fichero es donde se traduce esa
 * regla en código.
 *
 * Memory, Sprint y Escape Room se parecen en todo menos en sus reglas. Lo que
 * hacen es lo mismo con esos datos:
 *
 *   1. RECIBIR una unidad temática y un identificador de juego.
 *   2. PREPARAR una partida: una lista de elementos o fases barajados.
 *   3. EXPONER un estado consultable por la interfaz.
 *   4. ACEPTAR una acción de quien está jugando (elegir, responder, avanzar).
 *   5. AVISAR de los cambios mediante `suscribir()`, sin que la interfaz tenga
 *      que preguntar.
 *
 * Si los tres cumplen esa forma, la interfaz no necesita un `if` por juego para
 * el ciclo de partida: usa el mismo `motor` y solo cambia lo que se pinta. Y
 * una unidad temática nueva no requiere tocar ningún motor.
 *
 * ---------------------------------------------------------------------------
 * ESTADO NORMALIZADO
 * ---------------------------------------------------------------------------
 * Cada motor mantiene un estado con SIEMPRE estas claves, para que `src/ui/`
 * pueda leerlas sin preguntar de qué juego se trata:
 *
 *   {
 *     id, juego, unidad, titulo, instruccion,
 *     fase:        'preparando' | 'jugando' | 'terminado',
 *     indice:      elemento o fase actual (0-based),
 *     total:       cuántos hay en total,
 *     aciertos, fallos, puntos,
 *     tiempoRestante,  // segundos, o null si el juego no usa reloj
 *     terminado, terminadoCorrectamente,
 *     mensaje,     // texto de realimentación de la última acción, o null
 *   }
 *
 * `indice` y `total` son la clave: hacen que un Cronómetro, una barra de
 * progreso o un "pregunta 3 de 10" sirvan para los tres juegos sin código
 * específico.
 *
 * ---------------------------------------------------------------------------
 * CÓMO SE USA
 * ---------------------------------------------------------------------------
 *   const motor = crearMotor('sprint', unidad);
 *   const cancelar = motor.suscribir((estado) => pintar(estado));
 *   motor.iniciar({ semilla: 1234 });   // opcional: partida reproducible
 *   motor.responder('pregunta-1:o2');
 *   // ...
 *   motor.finalizar();
 *   cancelar();
 *
 * @module games/motor
 */

import { REGLAS, MEDALLAS, JUEGOS } from '../config.js';
import {
  construirVariantesMemory,
  construirMazoSprint,
  construirEscenarios,
} from '../utils/generadores.js';

/* ==========================================================================
   ESTADO INICIAL
   ========================================================================== */

/**
 * Estado base con todas las claves garantizadas.
 * Cada motor lo copia con `crearEstado()` y sobrescribe lo que necesite.
 *
 * @param {object} extra
 * @returns {object}
 */
export function crearEstado(extra = {}) {
  return {
    id: null,
    juego: null,
    unidad: null,
    titulo: '',
    instruccion: '',
    fase: 'preparando',
    indice: 0,
    total: 0,
    aciertos: 0,
    fallos: 0,
    puntos: 0,
    tiempoRestante: null,
    terminado: false,
    terminadoCorrectamente: false,
    mensaje: null,
    detalle: null,
    ...extra,
  };
}

/* ==========================================================================
   MEDALLAS
   ========================================================================== */

/**
 * Calcula la medalla que corresponde a un porcentaje de aciertos.
 *
 * @param {number} porcentaje  0..100
 * @returns {{id: string, nombre: string, descripcion: string}|null}
 */
export function medallaPara(porcentaje) {
  const encontrada = MEDALLAS.find((medalla) => porcentaje >= medalla.minimo);
  return encontrada || null;
}

/**
 * Porcentaje de aciertos, redondeado y acotado a 0..100.
 *
 * @param {number} aciertos
 * @param {number} intentos
 * @returns {number}
 */
export function calcularPorcentaje(aciertos, intentos) {
  if (!intentos || intentos <= 0) return 0;
  const porcentaje = (aciertos / intentos) * 100;
  return Math.max(0, Math.min(100, Math.round(porcentaje)));
}

/* ==========================================================================
   RELOJ
   ========================================================================== */

/**
 * Reloj por callback, sin `setInterval` espalhado por los motores.
 *
 * Motivo de existir: los tres juegos necesitan un temporizador, pero con
 * reglas distintas (fase a fase en Escape, por pregunta en Sprint, y en Memory
 * solo un aviso). Unificarlo aquí evita tres implementaciones y tres sitios
 * donde dejar un `setInterval` sin limpiar, que es la causa habitual de las
 * fugas que hacen que la aplicación "se ponga lenta" al encadenar partidas.
 *
 * Se apoya en `requestAnimationFrame` con un acumulado en lugar de
 * `setInterval(…, 1000)`, porque este último se retrasa en segundo plano y hace
 * que un contador de 30 s tarde 35.
 *
 * @param {{alTick: (segundos: number) => void, alAgotar: () => void}} opciones
 * @returns {{arrancar: (segundos: number) => void, detener: () => void, restante: () => number}}
 */
export function crearReloj({ alTick, alAgotar }) {
  let restante = 0;
  let idFrame = null;
  let ultimoInstante = 0;
  let terminado = false;
  /** Fracción de segundo pendiente de consumir. Evita perder tiempo al redondear. */
  let acumulado = 0;

  function bucle(ahora) {
    if (terminado) return;
    if (!ultimoInstante) ultimoInstante = ahora;

    // Milisegundos transcurridos desde el último frame, convertidos a segundos.
    const transcurrido = (ahora - ultimoInstante) / 1000;
    ultimoInstante = ahora;

    // Se consume el acumulador en pasos de 1 s: así `alTick` recibe siempre
    // enteros y no se pierde tiempo por redondeo de coma flotante.
    acumulado += transcurrido;
    while (acumulado >= 1) {
      acumulado -= 1;
      restante -= 1;
      alTick(restante);
    }

    if (restante <= 0) {
      restante = 0;
      detener();
      alAgotar();
      return;
    }

    idFrame = requestAnimationFrame(bucle);
  }

  function detener() {
    terminado = true;
    if (idFrame !== null) {
      cancelAnimationFrame(idFrame);
      idFrame = null;
    }
    acumulado = 0;
    ultimoInstante = 0;
  }

  return {
    arrancar(segundos) {
      detener();
      terminado = false;
      restante = Math.max(0, Math.floor(segundos) || 0);
      acumulado = 0;
      if (restante <= 0) {
        alAgotar();
        return;
      }
      idFrame = requestAnimationFrame(bucle);
    },
    detener,
    restante: () => restante,
  };
}

/* ==========================================================================
   BASE DE UN MOTOR
   ========================================================================== */

/**
 * Factoría común: crea el esqueleto (estado, suscriptores, notificación y
 * guardado) que comparten los tres motores, y delega el contenido específico
 * en una implementación.
 *
 * Reduce el problema de fondo: sin esto, cada motor reimplementaría el
 * `suscribir`/`notificar` a su manera, y cualquier cambio en cómo se avisa a la
 * interfaz obligaba a tocar tres ficheros.
 *
 * @param {object} opciones
 * @param {string} opciones.juego    Identificador (`memory`, `sprint`, `escape`).
 * @param {string} opciones.titulo   Título por defecto.
 * @param {(estado: object) => void} [opciones.alIniciar]  Prepara la partida.
 * @param {(estado: object) => void} [opciones.alResponder] Aplica una acción.
 * @param {object} [opciones.reglas]  Reglas por defecto del juego.
 * @returns {object} Motor normalizado.
 */
export function crearMotorBase({ juego, titulo, alIniciar, alResponder, reglas = {} }) {
  let estado = crearEstado({ juego, titulo, reglas });
  const suscriptores = new Set();

  function notificar(motivo = 'cambio') {
    for (const suscriptor of suscriptores) {
      try {
        suscriptor(estado, motivo);
      } catch (error) {
        // Un error de pintado no debe tumbar la partida: se avisa y se sigue.
        console.error(`[${juego}] Error en un suscriptor de "${estado.id}":`, error);
      }
    }
  }

  return {
    /** Identificador del juego. */
    juego,

    /**
     * Registra una función que se llama en cada cambio de estado.
     * @param {(estado: object, motivo: string) => void} fn
     * @returns {() => void} Función para darse de baja.
     */
    suscribir(fn) {
      suscriptores.add(fn);
      return () => suscriptores.delete(fn);
    },

    /** Estado actual (solo lectura: los motores no deben mutarlo a mano). */
    estado: () => estado,

    /**
     * Avisa a los suscriptores sin pasar por `iniciar`/`responder`.
     *
     * Lo necesita el reloj: cada segundo que pasa cambia `tiempoRestante`, pero
     * eso NO es una acción de quien está jugando, así que no debe contar como
     * "respuesta" ni disparar los efectos asociados. El motor del reloj
     * muta el estado y llama a `avisar('tick')`.
     *
     * @param {string} [motivo]
     */
    avisar(motivo = 'cambio') {
      notificar(motivo);
    },

    /**
     * Prepara una partida.
     * @param {{variante?: string, semilla?: number, reglas?: object}} [opciones]
     * @returns {object} El estado ya preparado.
     */
    iniciar(opciones = {}) {
      const { variante, semilla, reglas: reglasPropias, ...resto } = opciones;
      estado = crearEstado({
        juego,
        titulo,
        reglas: { ...reglas, ...reglasPropias },
        variante,
        semilla,
        ...resto,
      });
      if (alIniciar) alIniciar(estado, opciones);
      notificar('inicio');
      return estado;
    },

    /**
     * Aplica la acción indicada por la interfaz. El motor decide si vale.
     * @param {string} [id]
     * @param {*} [extra]
     * @returns {object} Estado resultante.
     */
    responder(id, extra) {
      if (estado.terminado) return estado;
      if (alResponder) alResponder(estado, id, extra);
      notificar('respuesta');
      return estado;
    },

    /** Avanza sin responder (Escape Room: "pasar fase"). */
    avanzar(extra) {
      if (estado.terminado) return estado;
      if (alResponder) alResponder(estado, null, extra);
      notificar('avance');
      return estado;
    },

    /** Termina la partida y calcula el resumen. */
    finalizar() {
      if (estado.terminado) return estado;
      estado.terminado = true;
      estado.fase = 'terminado';
      estado.terminadoCorrectamente = (estado.fallos || 0) === 0;
      if (estado.tiempoRestante !== null) estado.tiempoRestante = 0;
      notificar('fin');
      return estado;
    },

    /** Restablece a la situación inicial sin perder la partida anterior. */
    reiniciar(opciones = {}) {
      const { variante, semilla, reglas: reglasPropias, ...resto } = opciones;
      estado = crearEstado({
        juego,
        titulo,
        reglas: { ...reglas, ...reglasPropias },
        variante,
        semilla,
        ...resto,
      });
      notificar('reinicio');
      return estado;
    },
  };
}

/* ==========================================================================
   HELPERS PARA LOS MOTORES
   ========================================================================== */

/** Reglas por defecto de un juego, con margen para sobrescribir. */
export function reglasDe(juego) {
  return { ...(REGLAS[juego] || {}) };
}

/** Identificadores válidos de juego. */
export const JUEGOS_VALIDOS = Object.freeze(Object.values(JUEGOS));

export { construirVariantesMemory, construirMazoSprint, construirEscenarios };
