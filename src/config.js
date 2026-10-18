/**
 * config.js — Constantes de la aplicación.
 *
 * Capa: raíz. Sin DOM, sin lógica de negocio, sin datos formativos.
 *
 * Por qué existe un módulo de constantes: el nombre de la aplicación, el texto
 * de autoría, los tiempos por defecto o el número de medallas aparecen en
 * varios sitios (cabecera, resultados, exportación). Si cada uno los escribe por
 * su cuenta, el día que se cambia uno se olvidan los demás. Aquí hay una sola
 * fuente de verdad.
 *
 * Ningún módulo de datos debe leer de aquí: esta es configuración de la
 * APLICACIÓN, no contenido formativo.
 *
 * @module config
 */

/** Identificador de la aplicación, usado en storage y en los títulos. */
export const NOMBRE_APP = 'Escena Segura';

/** Descripción corta para el pie y para el `meta` de la página. */
export const DESCRIPCION_APP =
  'Recurso interactivo para clasificar emergencias y reconocer riesgos en el trabajo de emergencias.';

/**
 * Autoría y licencia. Se muestra en el pie de TODAS las pantallas y es
 * requisito de la licencia CC BY-NC-SA 4.0 del material de partida.
 */
export const CREDITOS =
  'Material para el aula de TES, creado por Noemí Celaya Mingot con ayuda de la IA';

/** Licencia declarativa, por si en el futuro se muestra como etiqueta. */
export const LICENCIA = 'CC BY-NC-SA 4.0';

/** Autoría. */
export const AUTORIA = 'Noemí Celaya Mingot';

/* -------------------------------------------------------------------------
   RUTAS
   ---------------------------------------------------------------------- */

/**
 * Rutas de la aplicación. El enrutador es de hash (`#/ruta`) a propósito:
 * funciona igual en un servidor propio, en una carpeta de un hosting
 * compartido o abriendo el fichero desde un USB, sin reglas de reescritura.
 */
export const RUTAS = Object.freeze({
  INICIO: '#/',
  UNIDAD: '#/unidad',
  JUEGO: '#/juego',
  RESULTADO: '#/resultado',
  // El repaso guardado de la última partida. Va aparte de RESULTADO porque no
  // necesita partida en memoria: se reconstruye desde `localStorage`, así que
  // sobrevive a cerrar el navegador.
  REVISION: '#/repaso',
  PROGRESO: '#/progreso',
  ACERCA_DE: '#/acerca-de',
  NO_ENCONTRADO: '#/no-encontrado',
});

/** Claves de los tres juegos. Deben coincidir con los `id` de `src/games/`. */
export const JUEGOS = Object.freeze({
  MEMORY: 'memory',
  SPRINT: 'sprint',
  ESCAPE: 'escape',
});

/** Nombre visible de cada juego, en el orden en que se presentan. */
export const NOMBRES_JUEGOS = Object.freeze([
  { id: JUEGOS.MEMORY, nombre: 'Memory', descripcion: 'Empareja concepto y definición.' },
  { id: JUEGOS.SPRINT, nombre: 'Sprint', descripcion: 'Responde lo más rápido posible.' },
  { id: JUEGOS.ESCAPE, nombre: 'Escape Room', descripcion: 'Decide fase a fase en un escenario.' },
]);

/* -------------------------------------------------------------------------
   JUEGO
   ---------------------------------------------------------------------- */

/** Reglas por defecto de cada juego. Los motores aportan su propia lógica. */
export const REGLAS = Object.freeze({
  memory: {
    /** Segundos para resolver un par. */
    tiempoPareja: 30,
    /** Intentos fallidos antes de revelar la solución. */
    intentosParaAyuda: 3,
    /** Puntos por pareja resuelta. */
    puntosPareja: 10,
    /** Bonus extra si el tablero se completa sin un solo fallo. */
    bonusPerfecto: 20,
  },
  sprint: {
    /** Segundos por pregunta. */
    tiempoPregunta: 20,
    /** Puntos base por acierto correcto. */
    puntosAcierto: 100,
    /** Puntos extra por responder antes de que termine el tiempo. */
    puntosVelocidad: 50,
    /** Puntos que resta cada fallo, para que equivocarse siempre cueste. */
    puntosFallo: 25,
    /** Número de preguntas por partida. */
    cantidad: 10,
  },
  escape: {
    /** Segundos totales de un escenario. */
    tiempoEscenario: 300,
    /** Segundos por fase. */
    tiempoFase: 60,
    /** Puntos por fase superada. */
    puntosFase: 10,
  },
});

/** Rangos de puntuación que conceden medalla, de mayor a menor. */
export const MEDALLAS = Object.freeze([
  { id: 'bronce', nombre: 'Bronce', minimo: 50, descripcion: 'Participación básica en la actividad.' },
  { id: 'plata', nombre: 'Plata', minimo: 75, descripcion: 'Buen dominio de la unidad.' },
  { id: 'oro', nombre: 'Oro', minimo: 90, descripcion: 'Dominio excelente de la unidad.' },
]);

/** Las medallas se conceden solo la primera vez que se alcanzan. */
export const MEDALLAS_UNICAS = true;

/**
 * Busca una medalla por su identificador.
 *
 * Motivo de existir: el almacenamiento guarda el IDENTIFICADOR de la medalla
 * (`'oro'`), no el objeto entero, para no duplicar en el disco unos datos que
 * solo cambian con el código. Quien la muestra necesita el nombre, así que
 * cualquier vista que pinte una medalla debe pasar por aquí. Devolver el id tal
 * cual haría que la insignia dijera "Medalla undefined".
 *
 * @param {string|null|undefined} id
 * @returns {object|null} Entrada de `MEDALLAS`, o `null`.
 */
export function medallaPorId(id) {
  return MEDALLAS.find((medalla) => medalla.id === id) || null;
}

/* -------------------------------------------------------------------------
   ACCESIBILIDAD
   ---------------------------------------------------------------------- */

/** Clase que se añade a `<html>` mientras la persona navega con teclado. */
export const CLASE_NAVEGACION_TECLADO = 'navegando-con-teclado';

/** Puntos de corte responsive, en píxeles CSS. */
export const PUNTOS_CORTE = Object.freeze({
  MOVIL: 480,
  TABLET: 900,
  ESCRITORIO: 1280,
});

/* -------------------------------------------------------------------------
   MODO DESARROLLO
   ---------------------------------------------------------------------- */

/**
 * Auditoría de contenido al arrancar.
 *
 * Qué avisa: si algún `enlazadoPor` de una configuración no resuelve, si hay
 * ids duplicados o si algún escenario tiene dos opciones correctas. Es el error
 * de contenido más habitual y el más difícil de ver sin ejecutar el juego.
 *
 * Por qué un interruptor manual y no `import.meta.env`: ese objeto es una
 * convención de Vite y este proyecto NO usa empaquetador. En JavaScript nativo
 * `import.meta.env` no existe, así que consultarlo daría `undefined` y daría
 * una falsa sensación de detección automática. Es preferible que quien despliega
 * decide conscientemente.
 *
 * Coste: unos pocos milisegundos, porque solo lee datos ya cargados.
 *
 * Recomendación: déjalo en `true` siempre. En clase, si una actividad falla, el
 * primer aviso de la consola suele señalar el `enlazadoPor` equivocado.
 */
export const AUDITAR_DATOS = true;
