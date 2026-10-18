/**
 * router.js — Enrutador por hash.
 *
 * Capa: ui.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ HASH Y NO RUTAS DE SERVIDOR
 * ---------------------------------------------------------------------------
 * Las rutas son `#/unidad/clasificacion`, no `/unidad/clasificacion`. Con rutas
 * de servidor, abrir la aplicación en un USB, en una subcarpeta de un hosting
 * compartido o tras un `file://` exigiría reglas de reescritura en el servidor.
 * Con hash funciona siempre, sin configuración, y es la opción correcta cuando
 * no hay un proceso de despliegue con control del servidor.
 *
 * ---------------------------------------------------------------------------
 * FORMATO
 * ---------------------------------------------------------------------------
 *   #/                          Inicio
 *   #/unidad/<id>               Ficha de una unidad temática
 *   #/juego/<idUnidad>/<idJuego>  Partida
 *   #/resultado/<idUnidad>/<idJuego>  Resultados
 *   #/progreso                  Progreso del alumnado
 *   #/acerca-de                 Autoría y licencia
 *
 * El enrutador no sabe qué es una unidad ni un juego: solo trocea la ruta y se
 * la pasa a la vista correspondiente. Quien decide es `app.js`, que sí conoce el
 * registro de unidades.
 *
 * @module ui/router
 */

import { crear } from '../utils/dom.js';
import { RUTAS } from '../config.js';

/* ==========================================================================
   ENLACES
   ========================================================================== */

/**
 * Crea un enlace interno de navegación.
 *
 * Se usa `<a href="#/...">` y no `<button>` a propósito: un enlace se puede
 * abrir en una pestaña nueva, se puede copiar y se reconoce como navegación.
 * Para acciones que no cambian de pantalla (cambiar el tema, jugar) sí se usa
 * `<button>`.
 *
 * @param {string} ruta    Ruta con hash, p. ej. `'#/unidad/riesgos'`.
 * @param {string|Array|HTMLElement} contenido  Texto o nodos hijos.
 * @param {string} [clase]
 * @param {object} [atributos]  Atributos extra (`aria-*`, `title`...).
 * @returns {HTMLElement} `<a>`.
 */
export function crearEnlace(ruta, contenido, clase, atributos = {}) {
  const hijos = Array.isArray(contenido) ? contenido : [contenido];
  return crear(
    'a',
    { ...atributos, href: ruta, class: clase, 'data-ruta': ruta },
    hijos
  );
}

/**
 * Marca como "página actual" el enlace cuya ruta coincide con la actual.
 *
 * `aria-current="page"` es lo que permite a una persona que use lector de
 * pantalla saber dónde está. Es un detalle pequeño con mucho valor.
 *
 * @param {string[]} rutas  Rutas candidatas a marcar.
 */
export function marcarEnlaceActual(rutas) {
  const actual = rutaActual();
  for (const elemento of document.querySelectorAll('[data-ruta]')) {
    const coincide = rutas.some((ruta) => ruta === actual) && elemento.dataset.ruta === actual;
    if (coincide) elemento.setAttribute('aria-current', 'page');
    else elemento.removeAttribute('aria-current');
  }
}

/* ==========================================================================
   ANÁLISIS DE LA RUTA
   ========================================================================== */

/**
 * Trocea la ruta actual.
 *
 * @param {string} [hash]  Hash a analizar; por defecto, el del navegador.
 * @returns {{nombre: string, segmentos: string[]}}
 */
export function analizarRuta(hash = window.location.hash) {
  const limpio = (hash || '').replace(/^#\/?/, '');
  const segmentos = limpio.split('/').filter(Boolean);
  return { nombre: segmentos[0] || 'inicio', segmentos };
}

/** Ruta completa actual, normalizada y con barra final garantizada. */
export function rutaActual() {
  return window.location.hash || RUTAS.INICIO;
}

/**
 * Navega a una ruta.
 * @param {string} ruta
 */
export function navegar(ruta) {
  if (ruta === rutaActual()) {
    // Forzar el repintado si se navega a la ruta en la que ya se está.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = ruta;
}

/* ==========================================================================
   REGISTRO DE VISTAS
   ========================================================================== */

/** @type {Map<string, (segmentos: string[]) => Promise|void>} */
const vistas = new Map();

/**
 * Registra una vista.
 *
 * @param {string} nombre  Primer segmento de la ruta (`inicio`, `unidad`...).
 * @param {(segmentos: string[], ruta: string) => (Promise<void>|void)} vista
 */
export function registrarVista(nombre, vista) {
  vistas.set(nombre, vista);
}

/* ==========================================================================
   ARRANQUE
   ========================================================================== */

/** Evita que dos navegaciones simultáneas se pisen. */
let navegando = false;

/**
 * Resuelve la ruta actual y monta la vista correspondiente.
 * @param {string[]} segmentos
 */
async function resolver(segmentos) {
  const vista = vistas.get(segmentos[0] || 'inicio');
  if (!vista) {
    await vistas.get('no-encontrado')?.(['ruta-desconocida']);
    return;
  }
  await vista(segmentos, rutaActual());
}

/**
 * Arranca el enrutador.
 *
 * Se registra un único manejador de `hashchange` y se resuelve la ruta inicial
 * de forma inmediata. Que el navegador aplique la ruta inicial y a las
 * posteriores por el mismo camino evita tener dos versiones del mismo código.
 *
 * @param {(errores: string[]) => void} [alAuditar]  Recibe los errores internos.
 * @param {() => void} [alNavegar]  Se llama con la ruta ya montada, para lo que
 *   depende de dónde se está: resaltar el enlace actual, refrescar el progreso.
 */
export function iniciarEnrutador(alAuditar, alNavegar) {
  async function alCambiar() {
    if (navegando) return;
    navegando = true;
    try {
      const { segmentos } = analizarRuta();
      await resolver(segmentos);
    } catch (error) {
      console.error('[router] Error al montar la vista:', error);
      alAuditar?.([`Error al montar la vista: ${error?.message || error}`]);
    } finally {
      navegando = false;
      // También en caso de error: si la vista no llega a montarse, el enlace
      // activo y el progreso deben reflejar igualmente dónde está la persona.
      alNavegar?.();
    }
  }

  window.addEventListener('hashchange', alCambiar);

  // Si la URL no lleva hash, se pone la de inicio sin provocar un segundo
  // `hashchange`.
  if (!window.location.hash) {
    window.history.replaceState(null, '', RUTAS.INICIO);
  }

  alCambiar();
}
