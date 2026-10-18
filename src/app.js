/**
 * app.js — Punto de entrada y composición.
 *
 * Capa: raíz.
 *
 * ---------------------------------------------------------------------------
 * QUÉ HACE ESTE FICHERO, Y QUÉ NO
 * ---------------------------------------------------------------------------
 * Solo tres cosas:
 *   1. montar el armazón (cabecera, contenido, pie);
 *   2. registrar las rutas;
 *   3. auditar los datos al arrancar.
 *
 * No sabe cómo se juega a nada, ni qué contiene una unidad, ni cómo se pinta
 * un Memory. Todo eso vive en `src/games/`, `src/data/` y `src/ui/`.
 *
 * Esa es la prueba de que la arquitectura funciona: este fichero no habría
 * cambiado al añadir la tercera unidad temática, ni al añadir un cuarto juego.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ HAY UN `RESULTADO` EN MEMORIA
 * ---------------------------------------------------------------------------
 * Navegar a `#/resultado/...` directamente con el botón "atrás" del navegador
 * o recargando la URL debe funcionar. Se guarda el último resumen en una
 * variable de módulo (`ultimaPartida`) porque los datos viven en los motores, y
 * los motores mueren al salir de la pantalla. Esa caché es deliberadamente
 * efímera: al recargar sin caché se muestra la pantalla de unidad, no un
 * resultado inventado.
 *
 * @module app
 */

import { crear } from './utils/dom.js';
import { montarArmazon, pintarVista, pintarMigas, actualizarProgresoCabecera } from './ui/layout.js';
import { registrarVista, iniciarEnrutador, navegar, marcarEnlaceActual } from './ui/router.js';
import { RUTAS, AUDITAR_DATOS, NOMBRE_APP } from './config.js';
import { icono } from './ui/iconos.js';
import { obtenerUnidad, auditarTodasLasUnidades, unidades } from './data/index.js';
import { registrarInicio, aplicarTemaPreferido, estadisticasGlobales } from './utils/storage.js';
import { vistaInicio } from './ui/vistas/inicio.js';
import { vistaUnidad } from './ui/vistas/unidad.js';
import { vistaProgreso } from './ui/vistas/progreso.js';
import { vistaAcercaDe } from './ui/vistas/acerca-de.js';
import { vistaNoEncontrado } from './ui/vistas/no-encontrado.js';
import { vistaResultado } from './ui/vistas/resultado.js';
import { vistaRepaso } from './ui/vistas/repaso-pantalla.js';
import { montarJuego, hayPantalla } from './ui/juegos/indice.js';

/**
 * Rutas de la cabecera, para marcar la sección actual.
 *
 * Se repiten aquí porque `ENLACES_CABECERA` es privado de `layout.js`, que es el
 * módulo que sabe cómo se pinta la cabecera pero no cuándo se navega. Es una
 * lista de tres rutas; duplicarla evita una dependencia circular entre ambos.
 */
const RUTAS_CABECERA = [RUTAS.INICIO, RUTAS.PROGRESO, RUTAS.ACERCA_DE];

/** Resumen de la última partida terminada, para la pantalla de resultado. */
let ultimaPartida = null;

/** Función de limpieza de la pantalla de juego activa. */
let limpiarJuego = null;

/* ==========================================================================
   ARRANQUE
   ========================================================================== */

/**
 * Inicializa la aplicación completa.
 */
export function iniciar() {
  aplicarTemaPreferido();

  const raiz = document.getElementById('aplicacion');
  if (!raiz) {
    console.error('[app] No se encuentra #aplicacion en el documento.');
    return;
  }

  // El progreso global se calcula una vez; se refleja en la cabecera.
  montarArmazon(raiz, { progreso: progresoGlobal() });

  registrarRutas();
  iniciarEnrutador(
    (errores) => {
      for (const error of errores) console.error(`[app] ${error}`);
    },
    // El enlace de la sección actual y la barra de progreso se refrescan en
    // CADA navegación, no solo al arrancar: quien está en la pantalla de un
    // juego tiene que seguir viendo "Mi progreso" resaltado y el porcentaje
    // correcto después de completar una actividad.
    alNavegar
  );

  if (AUDITAR_DATOS) auditar();
}

/** Se ejecuta tras montar cada vista, con la ruta ya activa. */
function alNavegar() {
  marcarEnlaceActual(RUTAS_CABECERA);
  // Sin este argumento la barra vuelve a 0 %: el porcentaje se recalcula en cada
  // navegación porque al terminar una actividad el progreso ha cambiado.
  actualizarProgresoCabecera(progresoGlobal());
}

/** Fracción de actividades completadas, en porcentaje. */
function progresoGlobal() {
  const { completadas, total } = calcularProgresoGlobal();
  return total === 0 ? 0 : Math.round((completadas / total) * 100);
}

/** Activities completadas y total posible. */
function calcularProgresoGlobal() {
  const estadisticas = estadisticasGlobales();
  return {
    completadas: estadisticas.actividadesCompletadas || 0,
    total: unidades.length * 3,
  };
}

/**
 * Auditoría de contenido al arrancar.
 *
 * Avisa en consola de los errores de datos ANTES de que se-usen en clase. Ver
 * `auditarUnidad()`: la comprobación final construye cada actividad con los
 * generadores reales, que es como se detecta un `enlazadoPor` mal escrito.
 */
function auditar() {
  const problemas = auditarTodasLasUnidades();
  if (problemas.length === 0) {
    console.info(
      `[${NOMBRE_APP}] Auditoría de contenido: ${unidades.length} unidades correctas.`
    );
    return;
  }

  console.warn(`[${NOMBRE_APP}] Se han encontrado ${problemas.length} problemas de contenido:`);
  for (const problema of problemas) {
    console.warn(`  · [${problema.unidad}] ${problema.problema}`);
  }
}

/* ==========================================================================
   RUTAS
   ========================================================================== */

/** Registra todas las vistas del enrutador. */
function registrarRutas() {
  registrarVista('inicio', () => {
    limpiarJuegoActivo();
    pintarMigas([]);
    vistaInicio();
  });

  registrarVista('unidad', (segmentos) => {
    limpiarJuegoActivo();
    vistaUnidad(segmentos);
  });

  registrarVista('juego', (segmentos) => {
    vistaJuego(segmentos);
  });

  registrarVista('resultado', (segmentos) => {
    limpiarJuegoActivo();
    vistaResultado(segmentos, ultimaPartida);
  });

  // El repaso guardado no necesita la partida en memoria: sale de
  // `localStorage`, así que sobrevive a recargar y a cerrar el navegador.
  registrarVista('repaso', (segmentos) => {
    limpiarJuegoActivo();
    vistaRepaso(segmentos);
  });

  registrarVista('progreso', () => {
    limpiarJuegoActivo();
    vistaProgreso();
  });

  registrarVista('acerca-de', () => {
    limpiarJuegoActivo();
    vistaAcercaDe();
  });

  registrarVista('no-encontrado', () => {
    limpiarJuegoActivo();
    vistaNoEncontrado();
  });
}

/**
 * Monta la pantalla de un juego.
 *
 * @param {string[]} segmentos  `[1]` = id de unidad, `[2]` = id de juego.
 */
function vistaJuego(segmentos) {
  const idUnidad = segmentos[1];
  const idJuego = segmentos[2];
  const unidad = obtenerUnidad(idUnidad);

  if (!unidad || !hayPantalla(idJuego)) {
    navegar(RUTAS.NO_ENCONTRADO);
    return;
  }

  limpiarJuegoActivo();
  pintarMigas([
    { texto: 'Inicio', ruta: RUTAS.INICIO },
    { texto: unidad.nombre, ruta: `${RUTAS.UNIDAD}/${idUnidad}` },
    { texto: nombreDeJuego(idJuego) },
  ]);

  registrarInicio(idUnidad, idJuego);

  const contenedor = crear('div');
  limpiarJuego = montarJuego(contenedor, idJuego, idUnidad, unidad, {
    alTerminar: (resumen) => {
      // Se guarda el resultado en memoria para poder mostrarlo al terminar.
      ultimaPartida = { ...resumen, unidad: idUnidad, juego: idJuego };
    },
  });

  pintarVista(contenedor);
}

/** Nombre legible de un juego. */
function nombreDeJuego(idJuego) {
  const nombres = { memory: 'Memory', sprint: 'Sprint', escape: 'Escape Room' };
  return nombres[idJuego] || idJuego;
}

/** Libera la pantalla de juego anterior, si la hubiera. */
function limpiarJuegoActivo() {
  if (typeof limpiarJuego === 'function') limpiarJuego();
  limpiarJuego = null;
}

/* ==========================================================================
   ERRORES GLOBALES
   ========================================================================== */

/**
 * Muestra un aviso si la aplicación se rompe.
 *
 * Sin esto, un error deja la pantalla en blanco y quien está en clase no tiene
     forma de saber si la aplicación se ha colgado o si la pestaña se ha cerrado.
 */
function vigilarErroresGlobales() {
  window.addEventListener('error', (evento) => {
    console.error('[app] Error no controlado:', evento.error || evento.message);
    mostrarAvisoGlobal('Se ha producido un error. Prueba a recargar la página.');
  });

  window.addEventListener('unhandledrejection', (evento) => {
    console.error('[app] Promesa rechazada sin capturar:', evento.reason);
  });
}

/**
 * Inserta un aviso visible en la parte superior.
 * @param {string} texto
 */
function mostrarAvisoGlobal(texto) {
  if (document.querySelector('.aviso-global')) return;

  document.body.prepend(
    crear('div', { class: 'caja-error aviso-global', role: 'alert' }, [
      crear('span', { class: 'caja-error__icono', html: icono('aviso'), 'aria-hidden': 'true' }),
      crear('p', { class: 'caja-error__titulo', texto }),
    ])
  );
}

/* ==========================================================================
   ARRANQUE AUTOMÁTICO
   ========================================================================== */

vigilarErroresGlobales();
iniciar();
