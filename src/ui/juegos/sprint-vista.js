/**
 * sprint-vista.js — Pantalla del juego Sprint.
 *
 * Capa: ui.
 *
 * ---------------------------------------------------------------------------
 * DÓNDE ESTÁ LA FRONTERA
 * ---------------------------------------------------------------------------
 * La pantalla no sabe nada del contenido: no hay ni un texto de tema formativo
 * aquí. Recibe el estado del motor de `src/games/sprint.js` y lo pinta. Eso
 * significa que una unidad nueva con otras preguntas no requiere cambios.
 *
 * ---------------------------------------------------------------------------
 * TECLADO
 * ---------------------------------------------------------------------------
 * Las opciones se numeran con A, S, D, F, el orden habitual en actividades de
 * agilidad. Se implementa con un escuchador de `keydown` en el documento que
 * se retira al salir: si se olvidara, se accumulates escuchadores en cada
 * partida y una sola pulsación respondería varias veces.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ SE MUESTRA LA EXPLICACIÓN ANTES DE SEGUIR
 * ---------------------------------------------------------------------------
 * En un sprint sobre seguridad, responder rápido sin entender no sirve de
 * nada. Al responder se congela el reloj y se muestra la realimentación con su
 * explicación; el botón "Siguiente" la mantiene visible durante el tiempo que
 * haga falta. Es una decisión pedagógica, no de interfaz.
 *
 * @module ui/juegos/sprint-vista
 */

import { crear, reemplazar, delegar } from '../../utils/dom.js';
import { crearSprint } from '../../games/sprint.js';
import {
  escenarioJuego,
  marcadorMotor,
  progresoSegmentos,
  cronometro,
  realimentacion,
} from './comun.js';
import { crearEnlace } from '../router.js';
import { RUTAS } from '../../config.js';
import { numero } from '../../utils/formato.js';

/** Teclas asociadas a las opciones, en orden. */
const TECLAS = ['a', 's', 'd', 'f'];

/**
 * Enunciado con su contexto y su imagen opcional.
 *
 * @param {object} pregunta
 * @returns {HTMLElement}
 */
function pintarEnunciado(pregunta) {
  return crear('div', { class: 'enunciado' }, [
    pregunta.pista ? crear('p', { class: 'enunciado__contexto', texto: pregunta.pista }) : null,
    crear('p', { class: 'enunciado__texto', texto: pregunta.enunciado }),
    pregunta.ilustracion?.tipo === 'imagen'
      ? crear('img', {
          class: 'enunciado__imagen',
          src: pregunta.ilustracion.valor,
          alt: pregunta.ilustracion.alt || 'Imagen de apoyo',
          loading: 'lazy',
        })
      : null,
  ]);
}

/**
 * Lista de opciones.
 *
 * @param {object} pregunta
 * @param {boolean} respondida
 * @param {string|null} elegida
 * @returns {HTMLElement}
 */
function pintarOpciones(pregunta, respondida, elegida) {
  return crear(
    'div',
    { class: 'opciones', role: 'group', 'aria-label': 'Opciones de respuesta' },
    pregunta.opciones.map((opcion, indice) => {
      const clases = ['opcion-respuesta'];

      if (respondida) {
        if (opcion.correcta) clases.push('opcion-respuesta--correcta');
        else if (opcion.id === elegida) clases.push('opcion-respuesta--incorrecta');
        else clases.push('opcion-respuesta--atenuada');
      }

      return crear(
        'button',
        {
          class: clases,
          type: 'button',
          dataset: { opcion: opcion.id },
          disabled: respondida,
          'aria-pressed': opcion.id === elegida ? 'true' : 'false',
        },
        [
          crear('span', {
            class: 'opcion-respuesta__tecla',
            texto: TECLAS[indice]?.toUpperCase() || String(indice + 1),
            'aria-hidden': 'true',
          }),
          crear('span', { class: 'opcion-respuesta__texto', texto: opcion.texto?.valor ?? opcion.texto }),
          respondida && (opcion.correcta || opcion.id === elegida)
            ? crear('span', {
                class: 'opcion-respuesta__marca',
                texto: opcion.correcta ? 'Correcta' : 'Tu respuesta',
                'aria-hidden': 'true',
              })
            : null,
        ]
      );
    })
  );
}

/**
 * Panel de fin de partida.
 * @param {object} motor
 * @param {string} idUnidad
 * @returns {HTMLElement}
 */
function panelFinal(motor, idUnidad) {
  const resumen = motor.resumen();

  return crear('div', { class: 'caja-error caja-error--correcto' }, [
    crear('h2', { class: 'caja-error__titulo', texto: '¡Sprint completado!' }),
    crear('p', {
      class: 'caja-error__detalle',
      texto: `${resumen.aciertos} aciertos · ${resumen.fallos} fallos · ${numero(resumen.puntos)} puntos`,
    }),
    crear('div', { class: 'vista-acciones' }, [
      crearEnlace(`${RUTAS.RESULTADO}/${idUnidad}/sprint`, 'Ver resultado', 'boton boton--primario'),
      crearEnlace(`${RUTAS.UNIDAD}/${idUnidad}`, 'Volver a la unidad', 'boton boton--fantasma'),
    ]),
  ]);
}

/**
 * Monta la pantalla de Sprint dentro de un contenedor.
 *
 * @param {HTMLElement} contenedor
 * @param {string} idUnidad
 * @param {object} unidad
 * @param {{cantidad?: number, alTerminar?: Function}} [opciones]
 * @returns {() => void} Función de limpieza (retira el escuchador de teclado).
 */
export function vistaSprint(contenedor, idUnidad, unidad, opciones = {}) {
  const motor = crearSprint(unidad);
  motor.iniciar({ cantidad: opciones.cantidad });

  let pregunta = motor.pregunta();

  function repintar(estado) {
    const respondida = Boolean(estado.respondida);
    const actual = motor.pregunta();
    const respondidas = estado.aciertos + estado.fallos;

    reemplazar(
      contenedor,
      escenarioJuego({
        titulo: estado.titulo,
        subtitulo: estado.instruccion,
        resumen: marcadorMotor(estado, {
          progreso: { etiqueta: 'Pregunta', valor: `${respondidas + (respondida ? 0 : 1)}/${estado.total}` },
        }),
        mapa: progresoSegmentos(estado, 'pregunta'),
        retro: realimentacion({
          titulo: estado.mensaje,
          texto: estado.detalle?.explicacion || '',
          tipo: respondida
            ? (motor.pregunta()?.opciones.find((o) => o.id === estado.opcionElegida)?.correcta
                ? 'correcto'
                : 'error')
            : 'info',
          acciones: respondida && !estado.terminado
            ? [
                crear('button', {
                  class: 'boton boton--primario',
                  type: 'button',
                  texto: 'Siguiente pregunta',
                  on: { click: () => motor.siguiente() },
                }),
              ]
            : null,
        }),
        diario: actual
          ? crear('div', { class: 'rejilla-sprint' }, [
              cronometro(estado.tiempoRestante, estado.reglas.tiempoPregunta),
              pintarEnunciado(actual),
              pintarOpciones(actual, respondida, estado.opcionElegida),
            ])
          : panelFinal(motor, idUnidad),
      })
    );
  }

  delegar(contenedor, 'click', '.opcion-respuesta', (evento, boton) => {
    if (boton.disabled) return;
    motor.responder(boton.dataset.opcion);
  });

  // Teclado: A, S, D, F eligen la opción correspondiente.
  function alPulsarTecla(evento) {
    if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
    const indice = TECLAS.indexOf(evento.key.toLowerCase());
    if (indice < 0) return;

    const actual = motor.pregunta();
    if (!actual || motor.estado().respondida) return;

    const opcion = actual.opciones[indice];
    if (!opcion) return;

    evento.preventDefault();
    motor.responder(opcion.id);
  }

  document.addEventListener('keydown', alPulsarTecla);

  const desuscribir = motor.suscribir((estado) => {
    pregunta = motor.pregunta();
    repintar(estado);
    if (estado.terminado) opciones.alTerminar?.(motor.resumen());
  });

  repintar(motor.estado());

  return () => {
    desuscribir();
    motor.pausar();
    document.removeEventListener('keydown', alPulsarTecla);
  };
}
