/**
 * comun.js — Piezas compartidas por las pantallas de juego.
 *
 * Capa: ui/juegos.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EXISTE
 * ---------------------------------------------------------------------------
 * Memory, Sprint y Escape Room tienen tableros muy distintos, pero comparten
 * el armazón: cabecera con el nombre de la actividad, marcador con aciertos y
 * fallos, barra de progreso, cronómetro y la pantalla de realimentación.
 *
 * Si cada vista construyera eso por su cuenta, un cambio en el formato del
 * marcador (por ejemplo, añadir "intentos") obligaría a editar tres ficheros y
 * es casi seguro que uno se quedaría atrás. Aquí se hace una vez.
 *
 * La regla se mantiene: este módulo pinta, pero NO decide. Toda la lógica está
 * en los motores de `src/games/`.
 *
 * @module ui/juegos/comun
 */

import { crear } from '../../utils/dom.js';
import { tiempo, numero } from '../../utils/formato.js';
import { icono } from '../iconos.js';

/* ==========================================================================
   MARCADOR
   ========================================================================== */

/**
 * Bloque de marcador de un motor.
 *
 * @param {object} estado  Estado del motor (el mismo para los tres juegos).
 * @param {{acciones?: Array, extra?: Array}} [opciones]
 * @returns {HTMLElement}
 */
export function marcadorMotor(estado, opciones = {}) {
  const datos = [
    { etiqueta: 'Aciertos', valor: numero(estado.aciertos || 0), acento: 'acento' },
    { etiqueta: 'Fallos', valor: numero(estado.fallos || 0) },
    { etiqueta: 'Puntos', valor: numero(estado.puntos || 0) },
  ];

  // `indice`/`total` significan cosas distintas en cada juego, así que la
  // etiqueta la pone quien lo usa.
  if (opciones.progreso) datos.push(opciones.progreso);

  return crear('div', { class: 'marcador-motor' }, [
    crear('div', { class: 'marcador-motor__acciones' }, datos.map((dato) =>
      crear('div', { class: 'marcador-motor__dato' }, [
        crear('span', { class: 'marcador-motor__etiqueta', texto: dato.etiqueta }),
        crear('span', {
          class: ['marcador-motor__valor', dato.acento && `marcador-motor__valor--${dato.acento}`],
          texto: dato.valor,
        }),
      ])
    )),
    opciones.acciones?.length
      ? crear('div', { class: 'marcador-motor__acciones' }, opciones.acciones)
      : null,
  ]);
}

/* ==========================================================================
   PROGRESO
   ========================================================================== */

/**
 * Barra de progreso por segmentos.
 *
 * Los segmentos (y no una barra continua) porque en los tres juegos la unidad
 * de avance es un elemento concreto: una pareja, una pregunta, una fase. Ver
 * "pregunta 4 de 10" es más útil que ver un 40 % sin contexto.
 *
 * @param {object} estado
 * @param {string} [etiqueta]  Qué es un segmento ('pregunta', 'fase'...).
 * @returns {HTMLElement}
 */
export function progresoSegmentos(estado, etiqueta = 'paso') {
  const total = Math.max(estado.total || 0, 1);
  const actual = Math.min(estado.indice + 1, total);

  return crear('div', { class: 'progreso' }, [
    crear('div', { class: 'progreso__cabecera' }, [
      crear('span', {
        class: 'progreso__texto',
        texto: `${actual} / ${total}`,
      }),
      crear('span', { class: 'progreso__etiqueta', texto: `${etiqueta}s` }),
    ]),
    crear('div', {
      class: 'progreso__segmentos',
      role: 'progressbar',
      'aria-valuenow': String(estado.indice),
      'aria-valuemin': '0',
      'aria-valuemax': String(total),
      'aria-label': `${etiqueta} ${actual} de ${total}`,
    }, Array.from({ length: total }, (_, indice) => {
      const clase = indice < estado.indice
        ? 'progreso__segmento progreso__segmento--completado'
        : indice === estado.indice && !estado.terminado
          ? 'progreso__segmento progreso__segmento--actual'
          : 'progreso__segmento';
      return crear('span', { class: clase });
    })),
  ]);
}

/* ==========================================================================
   CRONÓMETRO
   ========================================================================== */

/**
 * Barra de tiempo restante.
 *
 * Tres estados visuales, que es lo que permite percibir de un vistazo si hay
 * que apresurarse: normal, aviso (últimos 5 s) y alerta (últimos 3 s). El color
 * no es el único indicador: también cambia la cifra, porque no todas las
 * personas perciben el color igual.
 *
 * @param {number|null} restante  Segundos, o `null` si el juego no usa reloj.
 * @param {number} [total]        Segundos totales, para la barra.
 * @returns {HTMLElement|null}
 */
export function cronometro(restante, total) {
  if (restante === null || restante === undefined) return null;

  const segundos = Math.max(0, restante);
  const proporcion = total > 0 ? Math.min(1, segundos / total) : 0;
  const estadoVisual = segundos <= 3 ? 'alerta' : segundos <= 5 ? 'aviso' : '';

  return crear('div', { class: ['cronometro', estadoVisual && `cronometro--${estadoVisual}`] }, [
    crear('div', { class: 'cronometro__pila' }, [
      crear('div', {
        class: 'cronometro__relleno',
        style: `transform: scaleX(${proporcion})`,
      }),
    ]),
    crear('p', { class: 'cronometro__cifras' }, [
      crear('span', { html: icono('reloj'), 'aria-hidden': 'true' }),
      crear('strong', { texto: tiempo(segundos) }),
      crear('span', { class: 'solo-lectores', texto: 'de tiempo restante' }),
    ]),
  ]);
}

/* ==========================================================================
   REALIMENTACIÓN
   ========================================================================== */

/**
 * Caja de realimentación.
 *
 * @param {{titulo: string, texto: string, explicacion?: string,
 *          transferencia?: string, tipo?: 'correcto'|'error'|'info',
 *          acciones?: Array}} datos
 * @returns {HTMLElement|null}
 */
export function realimentacion({ titulo, texto, explicacion, transferencia, tipo = 'info', acciones }) {
  if (!titulo && !texto) return null;

  const iconoTipo = tipo === 'correcto' ? 'check' : tipo === 'error' ? 'cruz' : 'info';

  return crear('div', {
    class: ['realimentacion', `realimentacion--${tipo}`],
    role: tipo === 'info' ? 'status' : 'alert',
  }, [
    crear('span', { class: 'realimentacion__icono', html: icono(iconoTipo), 'aria-hidden': 'true' }),
    crear('div', { class: 'realimentacion__cuerpo' }, [
      titulo ? crear('p', { class: 'realimentacion__titulo', texto: titulo }) : null,
      texto ? crear('p', { class: 'realimentacion__texto', texto }) : null,
      explicacion ? crear('p', { class: 'realimentacion__explicacion' }, [
        crear('strong', { texto: 'Por qué: ' }),
        explicacion,
      ]) : null,
      transferencia ? crear('p', { class: 'realimentacion__explicacion' }, [
        crear('strong', { texto: 'En la práctica: ' }),
        transferencia,
      ]) : null,
      acciones?.length
        ? crear('div', { class: 'vista-acciones' }, acciones)
        : null,
    ]),
  ]);
}

/* ==========================================================================
   ENCUADRE DE JUEGO
   ========================================================================== */

/**
 * Contenedor estándar de una pantalla de juego.
 *
 * @param {{titulo: string, subtitulo?: string, retro?: HTMLElement,
 *          mapa?: HTMLElement, diario?: HTMLElement, resumen?: HTMLElement}} partes
 * @returns {HTMLElement}
 */
export function escenarioJuego(partes) {
  return crear('div', { class: 'escenario-juego' }, [
    crear('header', { class: 'vista-encabezado' }, [
      crear('p', { class: 'vista-eyebrow', texto: 'Actividad' }),
      crear('h1', { class: 'vista-titulo', texto: partes.titulo }),
      partes.subtitulo ? crear('p', { class: 'vista-descripcion', texto: partes.subtitulo }) : null,
    ]),
    partes.mapa || null,
    partes.resumen || null,
    partes.retro || null,
    partes.diario || null,
  ]);
}
