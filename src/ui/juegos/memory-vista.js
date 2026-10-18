/**
 * memory-vista.js — Pantalla del juego Memory.
 *
 * Capa: ui.
 *
 * ---------------------------------------------------------------------------
 * DÓNDE ESTÁ LA FRONTERA
 * ---------------------------------------------------------------------------
 * Este fichero NO sabe qué es un pictograma ni una clasificación. Recibe el
 * estado del motor y lo pinta. Toda la lógica —qué cartas forman pareja, cuándo
 * se resuelve el tablero, cuándo se ofrece la pista— está en
 * `src/games/memory.js`.
 *
 * Esa frontera es lo que permite que añadir una unidad formativa nueva no
 * obligue a escribir ni una línea de esta pantalla.
 *
 * ---------------------------------------------------------------------------
 * REPARTO DE RESPONSABILIDAD AL RESOLVER
 * ---------------------------------------------------------------------------
 * Al acertar, el motor marca la pareja como resuelta pero NO devuelve el turno:
 * la interfaz decide cuándo. Aquí se congela un instante para que quien juega
 * vea qué dos cartas se emparejaron y no pase directamente a la siguiente. Ver
 * el emparejamiento es parte del aprendizaje, no un efecto decorativo.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ DELEGACIÓN DE EVENTOS
 * ---------------------------------------------------------------------------
 * El tablero se recrea entero en cada repintado, así que los botones no pueden
 * llevar escuchadores propios: habría que añadirlos y quitarlos en cada
 * cambio, con el riesgo de acumular escuchadores y acabar con una partida que
 * responde dos veces por pulsación. Un único escuchador en el contenedor
 * resuelve el problema de raíz.
 *
 * @module ui/juegos/memory-vista
 */

import { crear, reemplazar, delegar } from '../../utils/dom.js';
import { crearMemory, ESTADO_CARTA } from '../../games/memory.js';
import { escenarioJuego, marcadorMotor, progresoSegmentos, realimentacion } from './comun.js';
import { crearEnlace } from '../router.js';
import { RUTAS } from '../../config.js';
import { icono } from '../iconos.js';
import { numero } from '../../utils/formato.js';
import { barajar } from '../../utils/aleatorio.js';

/** Milisegundos que se deja ver el emparejamiento antes de habilitar el turno. */
const RETARDO_EMPAREJAMIENTO = 550;
const RETARDO_PRESENTACION = 5000;

/**
 * Dibuja el contenido de una carta, sea texto o imagen.
 *
 * @param {object} contenido  `{tipo, valor, alt}` de `resolverContenido()`.
 * @returns {HTMLElement}
 */
function caraContenido(contenido) {
  if (!contenido) return crear('span', { class: 'carta-memory__icono', html: icono('rombo') });

  if (contenido.tipo === 'imagen') {
    // `alt` es obligatorio: una carta que solo enseña una imagen necesita texto
    // alternativo, o no la/leerá quien use lector de pantalla.
    return crear('img', {
      class: 'carta-memory__imagen',
      src: contenido.valor,
      alt: contenido.alt || 'Imagen de la carta',
      loading: 'lazy',
    });
  }

  return crear('span', { class: 'carta-memory__tipo', texto: contenido.valor });
}

/**
 * Una carta del tablero.
 *
 * @param {object} carta  Carta de `motor.tablero()`.
 * @param {string} etiqueta  Nombre de la columna, para el lector de pantalla.
 * @returns {HTMLElement}
 */
function elementoCarta(carta, etiqueta, mostrarPrevia) {
  const clases = ['carta-memory'];
  if (mostrarPrevia) clases.push('carta-memory--vista-previa');
  if (carta.situacion === ESTADO_CARTA.RESUELTA) clases.push('carta-memory--resuelta');
  if (carta.situacion === ESTADO_CARTA.SELECCIONADA) clases.push('carta-memory--volteada');
  if (carta.situacion === ESTADO_CARTA.FALLADA) clases.push('carta-memory--fallo');

  // Una carta resuelta se deshabilita de verdad, no solo visualmente, para que
  // el teclado tampoco la alcance.
  const resuelta = carta.situacion === ESTADO_CARTA.RESUELTA;

  return crear(
    'button',
    {
      class: clases,
      type: 'button',
      dataset: { carta: carta.id },
      disabled: resuelta,
      'aria-disabled': mostrarPrevia ? 'true' : 'false',
      'aria-pressed': carta.situacion === ESTADO_CARTA.SELECCIONADA ? 'true' : 'false',
      'aria-label': resuelta
        ? `${etiqueta}: ${carta.etiqueta}. Pareja ya encontrada.`
        : mostrarPrevia
          ? `${etiqueta}: ${carta.etiqueta}. Observa la ficha antes de empezar.`
          : `${etiqueta}: ${carta.etiqueta}. Pulsa para elegir.`,
    },
    [
      crear('span', { class: 'carta-memory__cara carta-memory__cara--dorso', 'aria-hidden': 'true' }, [
        crear('span', { html: icono('rombo') }),
        crear('span', { texto: '?' }),
      ]),
      crear('span', { class: 'carta-memory__cara carta-memory__cara--anverso' }, [
        crear('span', { class: 'solo-lectores', texto: carta.etiqueta }),
        caraContenido(carta.contenido),
      ]),
    ]
  );
}

/**
 * Tablero con las dos columnas.
 *
 * @param {object} estado
 * @param {object} tablero  De `motor.tablero()`.
 * @returns {HTMLElement}
 */
function pintarTablero(tablero, ordenCartas, mostrarPrevia) {
  const porId = new Map([...tablero.izquierda, ...tablero.derecha]
    .map((carta) => [carta.id, carta]));
  const todas = ordenCartas.map((id) => porId.get(id)).filter(Boolean);
  const etiquetaGeneral = 'Tablero de fichas';

  return crear(
    'div',
    { class: 'rejilla rejilla-memory', role: 'group', 'aria-label': etiquetaGeneral },
    todas.map((carta, indice) => elementoCarta(carta, `Ficha ${indice + 1}`, mostrarPrevia))
  );
}

/**
 * Panel de fin de partida.
 *
 * @param {object} motor
 * @param {string} idUnidad
 * @returns {HTMLElement}
 */
function panelFinal(motor, idUnidad) {
  const resumen = motor.resumen();

  return crear('div', { class: 'caja-error caja-error--correcto' }, [
    crear('h2', { class: 'caja-error__titulo', texto: '¡Tablero completo!' }),
    crear('p', {
      class: 'caja-error__detalle',
      texto: `${resumen.aciertos} parejas correctas · ${resumen.fallos} errores · ${numero(resumen.puntos)} puntos`,
    }),
    crear('div', { class: 'vista-acciones' }, [
      crearEnlace(`${RUTAS.RESULTADO}/${idUnidad}/memory`, 'Ver resultado', 'boton boton--primario'),
      crearEnlace(
        `${RUTAS.JUEGO}/${idUnidad}/memory`,
        'Jugar otra vez',
        'boton boton--secundario',
        { on: { click: () => window.location.reload() } }
      ),
      crearEnlace(`${RUTAS.UNIDAD}/${idUnidad}`, 'Volver a la unidad', 'boton boton--fantasma'),
    ]),
  ]);
}

/**
 * Monta la pantalla de Memory dentro de un contenedor.
 *
 * @param {HTMLElement} contenedor  Nodo donde se pinta.
 * @param {string} idUnidad
 * @param {object} unidad
 * @param {{variante?: string, alTerminar?: Function}} [opciones]
 * @returns {() => void} Función de limpieza.
 */
export function vistaMemory(contenedor, idUnidad, unidad, opciones = {}) {
  const motor = crearMemory(unidad);
  motor.iniciar({ variante: opciones.variante });
  const tableroInicial = motor.tablero();
  const ordenCartas = barajar([...tableroInicial.izquierda, ...tableroInicial.derecha])
    .map((carta) => carta.id);

  let mostrarPrevia = true;
  let cerrojo = true;

  function repintar(estado) {
    const tablero = motor.tablero();

    reemplazar(
      contenedor,
      escenarioJuego({
        titulo: estado.titulo,
        subtitulo: estado.instruccion,
        resumen: marcadorMotor(estado, {
          progreso: {
            etiqueta: 'Parejas',
            valor: `${estado.resueltos.length}/${estado.total}`,
          },
        }),
        mapa: progresoSegmentos(
          { ...estado, indice: estado.resueltos.length },
          'pareja'
        ),
        retro: realimentacion({
          titulo: mostrarPrevia
            ? 'Observa las parejas: el juego empieza en 5 segundos.'
            : estado.mensaje,
          texto: estado.detalle?.explicacion || '',
          tipo: estado.detalle || estado.terminado ? 'correcto' : 'info',
        }),
        diario: estado.terminado ? panelFinal(motor, idUnidad) : null,
      })
    );

    // El tablero se añade después del marcador, en su propia zona, para poder
    // repintarlo sin reconstruir el encabezado.
    const zona = crear(
      'div',
      { class: 'zona-tablero' },
      pintarTablero(tablero, ordenCartas, mostrarPrevia)
    );
    contenedor.querySelector('.escenario-juego')?.appendChild(zona);
  }

  delegar(contenedor, 'click', '.carta-memory', (evento, carta) => {
    if (mostrarPrevia || cerrojo || carta.disabled) return;
    if (motor.estado().seleccion.includes(carta.dataset.carta)) return;

    const seleccionAntes = motor.estado().seleccion.length;
    const resueltosAntes = motor.estado().resueltos.length;
    motor.responder(carta.dataset.carta);
    const resueltosDespues = motor.estado().resueltos.length;

    if (seleccionAntes === 1 || resueltosDespues > resueltosAntes) {
      cerrojo = true;
      setTimeout(() => {
        cerrojo = false;
        repintar(motor.estado());
      }, RETARDO_EMPAREJAMIENTO);
    }
  });

  const desuscribir = motor.suscribir((estado) => {
    repintar(estado);
    if (estado.terminado) opciones.alTerminar?.(motor.resumen());
  });

  repintar(motor.estado());
  const temporizadorPresentacion = setTimeout(() => {
    mostrarPrevia = false;
    cerrojo = false;
    repintar(motor.estado());
  }, RETARDO_PRESENTACION);

  return () => {
    clearTimeout(temporizadorPresentacion);
    desuscribir();
  };
}
