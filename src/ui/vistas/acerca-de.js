/**
 * acerca-de.js — Autoría, licencia y criterios de uso.
 *
 * Capa: ui/vistas.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ UNA PANTALLA DEDICADA
 * ---------------------------------------------------------------------------
 * El material es CC BY-NC-SA 4.0. La licencia obliga a identificar autoría y a
 * indicar la licencia, y a mantener la Derivación bajo la misma licencia. Una
 * pantalla dedicada es la forma más clara y más fácil de mantener de cumplirlo:
 * si solo estuviera en un comentario del código, nadie lo vería.
 *
 * También es donde se declara qué NO contiene la aplicación: que no hay
 * seguimiento, ni cuentas, ni red. En un recurso que se usa con menores en un
 * aula, eso es información que debe estar visible y no escondida en la
 * política de privacidad de un servidor.
 *
 * @module ui/vistas/acerca-de
 */

import { crear } from '../../utils/dom.js';
import { pintarVista, vistaEncabezada, pintarMigas } from '../layout.js';
import { crearEnlace } from '../router.js';
import { RUTAS, CREDITOS, LICENCIA, AUTORIA, NOMBRE_APP } from '../../config.js';
import { icono } from '../iconos.js';
import { unidades } from '../../data/index.js';
import { resumirUnidad } from '../../utils/generadores.js';
import { persistenciaActiva, versionEsquema } from '../../utils/storage.js';

/** Enlace a la licencia, en su versión oficial en español. */
const ENLACE_LICENCIA = 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es';

/** Una línea de la lista de decisiones de diseño. */
function decision(iconoNombre, titulo, texto) {
  return crear('li', { class: 'revision__elemento' }, [
    crear('span', { html: icono(iconoNombre), 'aria-hidden': 'true' }),
    crear('div', {}, [crear('strong', { texto: titulo }), crear('p', { texto })]),
  ]);
}

/** Monta la pantalla "Acerca de". */
export function vistaAcercaDe() {
  pintarMigas([{ texto: 'Inicio', ruta: RUTAS.INICIO }, { texto: 'Acerca de' }]);

  const totalCasos = unidades.reduce((suma, unidad) => suma + (resumirUnidad(unidad).casos || 0), 0);
  const totalActividades = unidades.length * 3;

  pintarVista(
    vistaEncabezada(
      {
        eyebrow: 'Acerca a este recurso',
        titulo: NOMBRE_APP,
        descripcion: CREDITOS,
        acciones: [crearEnlace(RUTAS.INICIO, 'Empezar', 'boton boton--primario')],
      },
      [
        crear('section', { class: 'referencia' }, [
          crear('section', { class: 'referencia__seccion' }, [
            crear('h2', { texto: 'Autoría y licencia' }),
            crear('p', {
              texto: `Material para el aula de TES, creado por ${AUTORIA} con licencia ${LICENCIA}.`,
            }),
            crear('p', {}, [
              crear('a', {
                href: ENLACE_LICENCIA,
                rel: 'license noopener',
                target: '_blank',
                texto: `Leer la licencia ${LICENCIA} completa`,
              }),
            ]),
            crear('div', { class: 'aviso-clave' }, [
              crear('span', { class: 'aviso-clave__icono', html: icono('info'), 'aria-hidden': 'true' }),
              crear('div', {}, [
                crear('p', { class: 'aviso-clave__titulo', texto: 'Qué permite la licencia' }),
                crear('p', {
                  texto:
                    'Puedes usar este material en tu aula, compartirlo y adaptarlo, siempre que cites la autoría, no lo uses con fines comerciales y compartas las adaptaciones bajo la misma licencia.',
                }),
              ]),
            ]),
          ]),
        ]),

        crear('section', { class: 'referencia' }, [
          crear('section', { class: 'referencia__seccion' }, [
            crear('h2', { texto: 'Qué contiene' }),
            crear('div', { class: 'estadisticas' }, [
              crear('div', { class: 'estadistica' }, [
                crear('span', { class: 'estadistica__valor', texto: String(unidades.length) }),
                crear('span', { class: 'estadistica__etiqueta', texto: 'unidades temáticas' }),
              ]),
              crear('div', { class: 'estadistica' }, [
                crear('span', { class: 'estadistica__valor', texto: String(totalCasos) }),
                crear('span', { class: 'estadistica__etiqueta', texto: 'casos y preguntas' }),
              ]),
              crear('div', { class: 'estadistica' }, [
                crear('span', { class: 'estadistica__valor', texto: String(totalActividades) }),
                crear('span', { class: 'estadistica__etiqueta', texto: 'actividades jugables' }),
              ]),
              crear('div', { class: 'estadistica' }, [
                crear('span', { class: 'estadistica__valor', texto: '3' }),
                crear('span', { class: 'estadistica__etiqueta', texto: 'formatos de juego' }),
              ]),
            ]),
          ]),
        ]),

        crear('section', { class: 'referencia' }, [
          crear('section', { class: 'referencia__seccion' }, [
            crear('h2', { texto: 'Decisiones de diseño' }),
            crear('ul', { class: 'revision__elemento' }, [
              decision(
                'candado',
                'Sin cuentas, sin servidor, sin seguimiento',
                'El progreso se guarda con el almacenamiento local del navegador. Nada sale de este dispositivo y el material funciona sin conexión.'
              ),
              decision(
                'rombo',
                'El contenido y el código están separados',
                'Cada unidad temática es un fichero de datos. Los motores de juego leen esos datos sin conocer el tema, así que añadir una unidad nueva no obliga a tocar el código de los juegos.'
              ),
              decision(
                'llama',
                'Tres formatos para el mismo contenido',
                'Memory para reconocer y repasar, Sprint para la agilidad y la decisión rápida, y Escape Room para el criterio y la transferencia. Mismo contenido, tres formas de practicarlo.'
              ),
              decision(
                'ojo',
                'Accesibilidad como requisito',
                'Navegación completa por teclado, textos alternativos en todas las imágenes, contraste alto y respeto a la preferencia de movimiento reducido del sistema.'
              ),
            ]),
          ]),
        ]),

        crear('section', { class: 'referencia' }, [
          crear('section', { class: 'referencia__seccion' }, [
            crear('h2', { texto: 'Estado técnico' }),
            crear('p', {
              texto: persistenciaActiva()
                ? 'El almacenamiento local está disponible: el progreso se guardará correctamente.'
                : 'El almacenamiento local NO está disponible: el progreso no se guardará al cerrar la página.',
            }),
            crear('p', {
              class: 'nota-version',
              texto: `Esquema de datos: versión ${versionEsquema}. JavaScript con módulos nativos, sin dependencias ni proceso de compilación.`,
            }),
          ]),
        ]),
      ]
    )
  );
}
