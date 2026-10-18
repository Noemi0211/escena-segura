/**
 * progreso.js — Pantalla de progreso del alumnado.
 *
 * Capa: ui/vistas.
 *
 * Recorre TODAS las unidades del registro × los tres juegos, y para cada
 * combinación lee el almacenamiento. Por eso no necesita conocer ninguna
 * unidad en concreto: si mañana hay cinco, esta pantalla las muestra todas sin
 * cambiar una línea.
 *
 * Incluye el borrado del progreso, que es una necesidad real del aula: en un
 * ordenador compartido, la siguiente persona no debe heredar la puntuación de
 * la anterior. Va con confirmación explícita, porque es una acción que no se
 * puede deshacer.
 *
 * @module ui/vistas/progreso
 */

import { crear } from '../../utils/dom.js';
import { pintarVista, vistaEncabezada, pintarMigas } from '../layout.js';
import { navegar } from '../router.js';
import { RUTAS, NOMBRES_JUEGOS, medallaPorId } from '../../config.js';
import { icono, ICONOS_JUEGO } from '../iconos.js';
import { unidades } from '../../data/index.js';
import {
  estaCompletada,
  medallaDe,
  mejorPuntuacion,
  estadisticasGlobales,
  borrarProgreso,
  exportarProgreso,
  persistenciaActiva,
} from '../../utils/storage.js';
import { numero } from '../../utils/formato.js';

/**
 * Una fila por juego dentro de una unidad.
 * @param {object} unidad
 * @returns {HTMLElement}
 */
function filaJuegos(unidad) {
  return crear('ul', { class: 'progreso__segmentos' },
    NOMBRES_JUEGOS.map((juego) => {
      const completada = estaCompletada(unidad.id, juego.id);
      // El almacenamiento guarda el identificador de la medalla, no el objeto.
      const medalla = medallaPorId(medallaDe(unidad.id, juego.id));

      return crear('li', { class: 'estadistica' }, [
        crear('span', {
          class: 'estadistica__valor',
          html: icono(ICONOS_JUEGO[juego.id] || 'rombo'),
          'aria-hidden': 'true',
        }),
        crear('span', { class: 'estadistica__etiqueta', texto: juego.nombre }),
        crear('span', {
          class: ['insignia', completada ? 'insignia--correcto' : 'insignia--neutro'],
          texto: completada ? `${numero(mejorPuntuacion(unidad.id, juego.id))} pts` : 'Pendiente',
        }),
        medalla
          ? crear('span', { class: 'insignia insignia--advertencia', texto: `Medalla ${medalla.nombre}` })
          : null,
      ]);
    })
  );
}

/**
 * Botón de borrado con confirmación en dos pasos dentro de la propia página.
 *
 * Se hace con un segundo botón de "cancelar" en vez de con `window.confirm` del
 * navegador por dos motivos: el diálogo nativo no se puede negar con un estilo
 * coherente con la aplicación y algunos navegadores lo bloquean; y aquí hace
 * falta poder decir QUÉ se borra, y no solo "¿seguro?".
 *
 * @returns {HTMLElement}
 */
function botonBorrar() {
  const acciones = crear('div', { class: 'vista-acciones' });
  let confirmando = false;

  function pintar() {
    acciones.replaceChildren();

    if (!confirmando) {
      acciones.appendChild(
        crear('button', {
          class: 'boton boton--peligro',
          type: 'button',
          texto: 'Borrar mi progreso',
          on: { click: pedirConfirmacion },
        })
      );
      return;
    }

    acciones.appendChild(
      crear('button', {
        class: 'boton boton--peligro',
        type: 'button',
        texto: 'Sí, borrar todo el progreso',
        on: {
          click: () => {
            borrarProgreso();
            navegar(RUTAS.PROGRESO);
          },
        },
      })
    );

    acciones.appendChild(
      crear('button', {
        class: 'boton boton--fantasma',
        type: 'button',
        texto: 'Cancelar',
        on: {
          click: () => {
            confirmando = false;
            pintar();
          },
        },
      })
    );
  }

  function pedirConfirmacion() {
    confirmando = true;
    pintar();

    // El foco se lleva al botón de confirmar para que quien navega con teclado
    // no se quede pulsando "borrar" a ciegas.
    acciones.querySelector('.boton--peligro')?.focus();
  }

  pintar();
  return acciones;
}

/**
 * Botón de exportación del progreso.
 * @returns {HTMLElement}
 */
function botonExportar() {
  return crear('button', {
    class: 'boton boton--secundario',
    type: 'button',
    texto: 'Descargar mi progreso',
    on: {
      click: () => {
        const datos = exportarProgreso();
        const archivo = new Blob([JSON.stringify(datos, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(archivo);
        const enlace = crear('a', { href: url, download: 'escena-segura-progreso.json' });
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        // Se libera la URL para no dejar el blob retenido en memoria.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
    },
  });
}

/**
 * Porcentaje de una unidad: cuántos de sus juegos están superados.
 *
 * Se cuenta sobre `estaCompletada()` y no sobre `progresoDe()`, que devuelve un
 * objeto con `{partidas, completadas, mejorPuntuacion}` y no un porcentaje.
 *
 * @param {object} unidad
 * @returns {number} 0–100.
 */
function porcentajeUnidad(unidad) {
  const total = NOMBRES_JUEGOS.length;
  if (total === 0) return 0;

  const completados = NOMBRES_JUEGOS.filter((juego) =>
    estaCompletada(unidad.id, juego.id)
  ).length;

  return Math.round((completados / total) * 100);
}

/** Monta la pantalla de progreso. */
export function vistaProgreso() {
  pintarMigas([{ texto: 'Inicio', ruta: RUTAS.INICIO }, { texto: 'Mi progreso' }]);

  const estadisticas = estadisticasGlobales();
  const aviso = persistenciaActiva()
    ? null
    : crear('div', { class: 'caja-error' }, [
        crear('h2', { class: 'caja-error__titulo', texto: 'El progreso no se está guardando' }),
        crear('p', {
          class: 'caja-error__detalle',
          texto:
            'Este navegador tiene el almacenamiento local bloqueado (por ejemplo, en modo incógnito estricto). Puedes jugar, pero el progreso se perderá al cerrar.',
        }),
      ]);

  const lista = crear('div', { class: 'rejilla rejilla--2' },
    unidades.map((unidad) =>
      crear('article', { class: 'tarjeta-tematica', dataset: { sinEnlace: 'true' } }, [
        crear('h3', { class: 'tarjeta-tematica__titulo', texto: unidad.nombre }),
        crear('div', { class: 'tarjeta-tematica__pie' }, [
          crear('span', {
            class: 'insignia',
            texto: `${porcentajeUnidad(unidad)} % completado`,
          }),
        ]),
        filaJuegos(unidad),
      ])
    )
  );

  pintarVista(
    vistaEncabezada(
      {
        eyebrow: 'Seguimiento',
        titulo: 'Mi progreso',
        descripcion:
          'Lo que has completado en este navegador. No hay cuentas ni servidores: los datos no salen de este dispositivo.',
        acciones: [botonExportar(), botonBorrar()],
      },
      [
        aviso,

        crear('div', { class: 'estadisticas' }, [
          crear('div', { class: 'estadistica' }, [
            crear('span', { class: 'estadistica__valor', texto: String(estadisticas.partidasTerminadas || 0) }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'partidas terminadas' }),
          ]),
          crear('div', { class: 'estadistica' }, [
            crear('span', {
              class: 'estadistica__valor',
              texto: String(estadisticas.aciertos || 0),
            }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'respuestas correctas' }),
          ]),
          crear('div', { class: 'estadistica' }, [
            crear('span', {
              class: 'estadistica__valor',
              texto: String(estadisticas.respuestas || 0),
            }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'respuestas respondidas' }),
          ]),
        ]),

        lista,
      ]
    )
  );
}
