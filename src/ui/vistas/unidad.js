/**
 * unidad.js — Ficha de una unidad temática: objetivos, conceptos y juegos.
 *
 * Capa: ui/vistas.
 *
 * ---------------------------------------------------------------------------
 * UNA VISTA, CUALQUIER UNIDAD
 * ---------------------------------------------------------------------------
 * Esta pantalla no menciona ni "pictogramas" ni "clasificación". Todo lo que
 * muestra sale de la unidad que recibe: objetivos, conceptos, catálogos y los
 * tres juegos. Es la demostración de que la capa de datos es suficiente para
 * pintar una unidad completa sin escribir código nuevo.
 *
 * @module ui/vistas/unidad
 */

import { crear } from '../../utils/dom.js';
import { pintarVista, vistaEncabezada, pintarMigas } from '../layout.js';
import { crearEnlace, navegar } from '../router.js';
import { RUTAS, NOMBRES_JUEGOS, medallaPorId } from '../../config.js';
import { icono, ICONOS_JUEGO } from '../iconos.js';
import { obtenerUnidad, existeUnidad } from '../../data/index.js';
import { resumirUnidad } from '../../utils/generadores.js';
import { estaCompletada, medallaDe, mejorPuntuacion, revisionDe } from '../../utils/storage.js';
import { numero } from '../../utils/formato.js';

/** Habilidades que entrena cada juego, para la tarjeta de la unidad. */
const HABILIDADES = {
  memory: ['Reconocimiento', 'Asociación', 'Repaso espaciado'],
  sprint: ['Agilidad', 'Decisión rápida', 'Lectura de pictogramas'],
  escape: ['Criterio', 'Priorización', 'Transferencia'],
};

/**
 * Tarjeta de un juego dentro de una unidad.
 *
 * @param {object} unidad
 * @param {{id: string, nombre: string, descripcion: string}} juego
 * @returns {HTMLElement}
 */
function tarjetaJuego(unidad, juego) {
  const completada = estaCompletada(unidad.id, juego.id);
  // El almacenamiento guarda el identificador de la medalla, no el objeto.
  const medalla = medallaPorId(medallaDe(unidad.id, juego.id));
  const mejor = mejorPuntuacion(unidad.id, juego.id);

  // Un enlace dentro de otro enlace no es HTML válido y el lector de pantalla
  // lo lee como un solo destino. Por eso la tarjeta NO es un enlace entero: el
  // título sí lo es, y el repaso va aparte, debajo.
  const hayRepaso = revisionDe(unidad.id, juego.id).length > 0;

  return crear('article',
    { class: ['tarjeta-juego', completada ? 'tarjeta-juego--superado' : 'tarjeta-juego--pendiente'] },
    [
      crearEnlace(
        `${RUTAS.JUEGO}/${unidad.id}/${juego.id}`,
        [
          crear('span', {
            class: 'tarjeta-juego__icono',
            html: icono(ICONOS_JUEGO[juego.id] || 'rombo'),
            'aria-hidden': 'true',
          }),
          crear('h3', { class: 'tarjeta-juego__nombre', texto: juego.nombre }),
          crear('p', { class: 'tarjeta-juego__descripcion', texto: juego.descripcion }),
        ],
        'tarjeta-juego__principal'
      ),

      crear('ul', { class: 'tarjeta-juego__habilidades' },
        (HABILIDADES[juego.id] || []).map((habilidad) =>
          crear('li', {}, [
            crear('span', { html: icono('check'), 'aria-hidden': 'true' }),
            habilidad,
          ])
        )
      ),

      crear('div', { class: 'tarjeta-juego__pie' }, [
        completada
          ? crear('span', { class: 'insignia insignia--correcto', texto: `Superado · ${numero(mejor)} pts` })
          : crear('span', { class: 'insignia insignia--neutro', texto: 'Sin superar' }),
        medalla ? crear('span', { class: 'insignia insignia--advertencia', texto: `Medalla ${medalla.nombre}` }) : null,
      ]),

      // Solo si se ha jugado: antes de eso no hay nada que repasar, y ofrecerlo
      // sería un enlace que no lleva a ninguna parte.
      hayRepaso
        ? crearEnlace(
            `${RUTAS.REVISION}/${unidad.id}/${juego.id}`,
            [
              crear('span', { html: icono('ojo'), 'aria-hidden': 'true' }),
              'Ver mi repaso',
            ],
            'enlace-repaso'
          )
        : null,
    ]
  );
}

/**
 * Lista de conceptos clave, en fichas.
 * @param {object} unidad
 * @returns {HTMLElement}
 */
function listaConceptos(unidad) {
  const conceptos = unidad.conceptos || [];
  if (conceptos.length === 0) return null;

  return crear('section', { class: 'referencia' }, [
    crear('section', { class: 'referencia__seccion' }, [
      crear('h2', { texto: 'Conceptos clave' }),
      crear('div', { class: 'rejilla rejilla--2' },
        conceptos.map((concepto) =>
          crear('article', { class: 'ficha' }, [
            crear('h3', { class: 'ficha__termino', texto: concepto.termino }),
            crear('p', { class: 'ficha__definicion', texto: concepto.definicion }),
            concepto.ejemplo
              ? crear('p', { class: 'ficha__ejemplo' }, [
                  crear('strong', { texto: 'Ejemplo: ' }),
                  concepto.ejemplo,
                ])
              : null,
          ])
        )
      ),
    ]),
  ]);
}

/**
 * Índice de casos de la unidad, para repasar sin jugar.
 *
 * No son enlaces. Una versión anterior los convertía en enlaces a la propia
 * ficha de la unidad, con la promesa de "abrir su juego": eso es un enlace
 * muerto que devuelve a la página de la que se salió, y además promete algo que
 * no ocurre. Aquí se listan como lo que son, el catálogo de situaciones con las
 * que se puede practicar.
 *
 * @param {object} unidad
 * @returns {HTMLElement|null}
 */
function indiceCasos(unidad) {
  const casos = unidad.casos || [];
  if (casos.length === 0) return null;

  return crear('section', { class: 'referencia' }, [
    crear('section', { class: 'referencia__seccion' }, [
      crear('h2', { texto: `Casos de la unidad (${casos.length})` }),
      crear('p', {
        class: 'vista-descripcion',
        texto:
          'Todas las situaciones con las que puedes practicar. Los tres juegos de arriba las reparten de forma distinta en cada partida.',
      }),
      crear('ul', { class: 'indice-tematicas' },
        casos.map((caso) =>
          crear('li', { class: 'indice-tematica' }, [
            crear('div', { class: 'indice-tematica__cabecera' }, [
              crear('span', {
                class: 'indice-tematica__icono',
                html: icono('rombo'),
                'aria-hidden': 'true',
              }),
              crear('span', { class: 'indice-tematica__titulo', texto: caso.etiqueta }),
            ]),
            crear('p', { class: 'indice-tematica__meta', texto: caso.contexto || '' }),
          ])
        )
      ),
    ]),
  ]);
}

/**
 * Monta la ficha de una unidad.
 *
 * @param {string[]} segmentos  Segmentos de la ruta; `segmentos[1]` es el id.
 */
export function vistaUnidad(segmentos) {
  const id = segmentos[1];
  const unidad = obtenerUnidad(id);

  if (!unidad || !existeUnidad(id)) {
    navegar(RUTAS.NO_ENCONTRADO);
    return;
  }

  pintarMigas([{ texto: 'Inicio', ruta: RUTAS.INICIO }, { texto: unidad.nombre }]);

  // `obtenerUnidad()` devuelve la unidad cruda, sin el resumen derivado. Sin
  // calcularlo aquí, las cuatro cifras de abajo saldrían a cero siempre.
  const resumen = resumirUnidad(unidad);

  pintarVista(
    vistaEncabezada(
      {
        eyebrow: `Unidad ${String(unidad.orden).padStart(2, '0')}`,
        titulo: unidad.nombre,
        descripcion: unidad.descripcion,
        acciones: [
          crearEnlace(RUTAS.INICIO, 'Volver a las unidades', 'boton boton--fantasma'),
        ],
      },
      [
        crear('section', { class: 'juegos' }, [
          crear('h2', { texto: 'Elige un juego' }),
          crear('p', {
            class: 'vista-descripcion',
            texto: 'Los tres juegos usan el mismo contenido: tú eliges cómo quieres practicarlo.',
          }),
          crear('div', { class: 'rejilla rejilla--3' },
            NOMBRES_JUEGOS.map((juego) => tarjetaJuego(unidad, juego))
          ),
        ]),

        unidad.objetivos?.length
          ? crear('section', { class: 'referencia' }, [
              crear('section', { class: 'referencia__seccion' }, [
                crear('h2', { texto: 'Qué vas a aprender' }),
                crear('ul', { class: 'tarjeta-juego__habilidades' },
                  unidad.objetivos.map((objetivo) =>
                    crear('li', {}, [
                      crear('span', { html: icono('check'), 'aria-hidden': 'true' }),
                      objetivo,
                    ])
                  )
                ),
              ]),
            ])
          : null,

        listaConceptos(unidad),
        indiceCasos(unidad),

        crear('div', { class: 'estadisticas' }, [
          crear('div', { class: 'estadistica' }, [
            crear('span', { class: 'estadistica__valor', texto: String(resumen.casos || 0) }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'casos' }),
          ]),
          crear('div', { class: 'estadistica' }, [
            crear('span', { class: 'estadistica__valor', texto: String(resumen.variantesMemory || 0) }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'variantes de Memory' }),
          ]),
          crear('div', { class: 'estadistica' }, [
            crear('span', { class: 'estadistica__valor', texto: String(resumen.plantillasSprint || 0) }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'plantillas de Sprint' }),
          ]),
          crear('div', { class: 'estadistica' }, [
            crear('span', { class: 'estadistica__valor', texto: String(resumen.escenarios || 0) }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'escenarios' }),
          ]),
        ]),

        // Aviso de que los motores son la base para ampliar la aplicación.
        crear('div', { class: 'contrato-motor' }, [
          crear('h2', { class: 'contrato-motor__titulo', texto: 'Estos juegos ya son reutilizables' }),
          crear('p', {
            texto:
              'Los tres motores leen la unidad que les passes. Añadir una unidad nueva es añadir un fichero de datos: no hay que tocar el código de los juegos.',
          }),
          crear('ul', { class: 'contrato-motor__lista' },
            [
              'Cada motor expone el mismo estado: fase, índice, aciertos, fallos, puntos y tiempo.',
              'La puntuación y las medallas se calculan igual en los tres.',
              'El contenido se guarda en el navegador: no hay cuentas ni servidor.',
            ].map((texto) => crear('li', { texto }))
          ),
        ]),
      ]
    )
  );
}

