/**
 * escape-vista.js — Pantalla del juego Escape Room.
 *
 * Capa: ui.
 *
 * ---------------------------------------------------------------------------
 * DÓNDE ESTÁ LA FRONTERA
 * ---------------------------------------------------------------------------
 * La pantalla pinta; el motor decide. Aquí no se comprueba si una opción es
 * correcta ni se conceden puntos: solo se muestra lo que el motor ha resuelto.
 * Esa separación es la que permite que el escenario de una unidad nueva se vea
 * exactamente igual que el de otra, sin tocar este fichero.
 *
 * ---------------------------------------------------------------------------
 * EL DIARIO DE BORDA
 * ---------------------------------------------------------------------------
 * Cada fase respondida deja una línea en un registro con hora, decisión y si
 * fue correcta. No es un adorno: es el objeto de la actividad. Quien practica
 * esta actividad está entrenando la secuencia "situación → decisión →
 * consecuencia", y el diario deja ver esa secuencia después de haberla vivido
 * sin leer nada.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ NO SE PUEDE SALTAR UNA FASE
 * ---------------------------------------------------------------------------
 * El motor bloquea `avanzarFase()` mientras no haya decisión. Aquí solo se
 * refleja: el botón "Continuar" no existe hasta que se ha elegido. Saltarse la
 * fase equivaldría a saltarse la explicación, que es justo lo que no debe
 * pasar en una actividad sobre decisiones en emergencias.
 *
 * @module ui/juegos/escape-vista
 */

import { crear, reemplazar, delegar } from '../../utils/dom.js';
import { crearEscape } from '../../games/escape.js';
import {
  escenarioJuego,
  marcadorMotor,
  progresoSegmentos,
  cronometro,
  realimentacion,
} from './comun.js';
import { crearEnlace } from '../router.js';
import { RUTAS } from '../../config.js';
import { icono } from '../iconos.js';
import { numero, tiempo, marcaTiempo } from '../../utils/formato.js';

/** Letras que marcan el acierto o el error en el diario. */
const MARCA = { correcto: 'check', error: 'cruz' };

/**
 * Fase actual: número, título, texto y opciones.
 *
 * @param {object} estado
 * @param {object} fase
 * @returns {HTMLElement}
 */
function pintarFase(estado, fase) {
  const respondida = Boolean(estado.respondida);

  return crear('section', { class: 'fase-escape' }, [
    crear('header', { class: 'fase-escape__cabecera' }, [
      crear('span', { class: 'fase-escape__numero', texto: `Fase ${estado.indice + 1}` }),
      crear('h2', { class: 'fase-escape__titulo', texto: fase.titulo }),
    ]),

    crear('p', { class: 'fase-escape__texto', texto: fase.texto }),

    fase.imagen?.tipo === 'imagen' && fase.imagen.valor
      ? crear('img', {
          class: 'fase-escape__imagen',
          src: fase.imagen.valor,
          alt: fase.imagen.alt || fase.titulo || '',
          loading: 'lazy',
        })
      : null,

    crear(
      'div',
      { class: 'opciones opciones--apiladas', role: 'group', 'aria-label': 'Acciones posibles' },
      fase.opciones.map((opcion) => {
        const clases = ['opcion-respuesta'];
        if (respondida) {
          if (opcion.correcta) clases.push('opcion-respuesta--correcta');
          else if (opcion.id === estado.opcionElegida) clases.push('opcion-respuesta--incorrecta');
          else clases.push('opcion-respuesta--atenuada');
        }

        return crear(
          'button',
          {
            class: clases,
            type: 'button',
            dataset: { opcion: opcion.id },
            disabled: respondida,
          },
          [
            crear('span', { class: 'opcion-respuesta__texto', texto: opcion.texto }),
            respondida && (opcion.correcta || opcion.id === estado.opcionElegida)
              ? crear('span', {
                  class: 'opcion-respuesta__marca',
                  texto: opcion.correcta ? 'Correcta' : 'Tu decisión',
                  'aria-hidden': 'true',
                })
              : null,
          ]
        );
      })
    ),
  ]);
}

/**
 * Diario de bordo: una línea por fase decidida.
 *
 * @param {object} estado
 * @returns {HTMLElement|null}
 */
function pintarDiario(estado) {
  const decisiones = estado.decisiones || [];
  if (decisiones.length === 0) return null;

  const inicio = Date.now() - (estado.indice * 60 * 1000);

  return crear('section', { class: 'diario-bordo' }, [
    crear('h2', { texto: 'Diario de bordo' }),
    crear(
      'ul',
      { class: 'progreso__segmentos', style: 'list-style:none;display:grid;gap:.5rem' },
      decisiones.map((decision, indice) =>
        crear('li', { class: 'diario-bordo__linea' }, [
          crear('span', { class: 'diario-bordo__hora', texto: marcaTiempo(indice * 0.7) }),
          crear('span', { html: icono(MARCA[decision.correcta ? 'correcto' : 'error']), 'aria-hidden': 'true' }),
          crear('span', {
            class: 'diario-bordo__texto',
            texto: decision.correcta ? 'Decisión correcta' : 'Decisión mejorable',
          }),
        ])
      )
    ),
  ]);
}

/**
 * Panel de fin de partida.
 * @param {object} motor
 * @param {string} idUnidad
 * @returns {HTMLElement}
 */
function panelFinal(motor, idUnidad) {
  const resumen = motor.resumen();

  return crear('div', { class: 'escape-completado' }, [
    crear('h2', { class: 'escape-completado__sello', texto: 'Escenario superado' }),
    crear('p', {
      class: 'caja-error__detalle',
      texto: `${resumen.aciertos} de ${resumen.total} fases · ${numero(resumen.puntos)} puntos`,
    }),
    crear('div', { class: 'vista-acciones' }, [
      crearEnlace(`${RUTAS.RESULTADO}/${idUnidad}/escape`, 'Ver resultado', 'boton boton--primario'),
      crearEnlace(`${RUTAS.UNIDAD}/${idUnidad}`, 'Volver a la unidad', 'boton boton--fantasma'),
    ]),
  ]);
}

/**
 * Monta la pantalla de Escape Room dentro de un contenedor.
 *
 * @param {HTMLElement} contenedor
 * @param {string} idUnidad
 * @param {object} unidad
 * @param {{alTerminar?: Function}} [opciones]
 * @returns {() => void} Función de limpieza.
 */
export function vistaEscape(contenedor, idUnidad, unidad, opciones = {}) {
  const motor = crearEscape(unidad);
  motor.iniciar();

  function repintar(estado) {
    const fase = motor.fase();
    const respondida = Boolean(estado.respondida);
    const detalle = estado.detalle || {};
    const acertada = (estado.decisiones || []).at(-1)?.correcta;

    reemplazar(
      contenedor,
      escenarioJuego({
        titulo: estado.titulo,
        subtitulo: estado.ambientacion,
        resumen: marcadorMotor(estado, {
          progreso: { etiqueta: 'Fase', valor: `${Math.min(estado.indice + 1, estado.total)}/${estado.total}` },
        }),
        mapa: progresoSegmentos(estado, 'fase'),
        retro: respondida
          ? realimentacion({
              titulo: detalle.breve || estado.mensaje,
              texto: detalle.explicacion || '',
              transferencia: detalle.transferencia || '',
              tipo: acertada ? 'correcto' : 'error',
              acciones: estado.terminado
                ? null
                : [
                    crear('button', {
                      class: 'boton boton--primario',
                      type: 'button',
                      texto: estado.indice + 1 >= estado.total ? 'Ver resultado' : 'Continuar',
                      on: {
                        click: () => {
                          motor.avanzarFase();
                          if (motor.estado().terminado) {
                            window.location.hash = `${RUTAS.RESULTADO}/${idUnidad}/escape`;
                          }
                        },
                      },
                    }),
                  ],
            })
          : null,
        diario: estado.terminado ? panelFinal(motor, idUnidad) : pintarDiario(estado),
      })
    );

    if (fase && !estado.terminado) {
      contenedor.querySelector('.escenario-juego')?.appendChild(
        crear('div', { class: 'rejilla rejilla--2' }, [
          pintarFase(estado, fase),
          crear('div', { class: 'referencia' }, [
            cronometro(estado.tiempoRestante, fase.tiempoLimite ?? estado.reglas.tiempoFase),
            crear('p', {
              class: 'vista-descripcion',
              texto: respondida
                ? 'Lee la explicación antes de continuar.'
                : 'Decide qué harías y comprueba después si era la opción más segura.',
            }),
            crear('p', { class: 'nota-version', texto: `Tiempo de fase: ${tiempo(fase.tiempoLimite ?? 60)}` }),
          ]),
        ])
      );
    }
  }

  delegar(contenedor, 'click', '.opcion-respuesta', (evento, boton) => {
    if (boton.disabled) return;
    motor.responder(boton.dataset.opcion);
  });

  const desuscribir = motor.suscribir((estado) => {
    repintar(estado);
    if (estado.terminado) opciones.alTerminar?.(motor.resumen());
  });

  repintar(motor.estado());

  return () => {
    desuscribir();
    motor.pausar();
  };
}
