/**
 * resultado.js — Pantalla de resultados de una partida.
 *
 * Capa: ui/vistas.
 *
 * ---------------------------------------------------------------------------
 * EL TRÁNSITO ENTRE EL MOTOR Y EL ALMACENAMIENTO
 * ---------------------------------------------------------------------------
 * El motor devuelve un resumen con SU vocabulario (`puntos`, `medalla` como
 * objeto). El almacenamiento espera OTRO (`puntuacion`, `medalla` como id). La
 * traducción se hace aquí, en un único sitio, y no dentro de `storage.js`.
 *
 * Motivo: `storage.js` no debe saber qué significa una medalla ni cómo se
 * puntúa un Memory. Si lo supiera, cada juego nuevo obligaría a tocar la capa
 * de persistencia, que es justo lo contrario de la separación que sostiene el
 * proyecto.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ SE CALCULA AQUÍ EL "SUPERADO"
 * ---------------------------------------------------------------------------
 * Superar una actividad no es "terminarla sin fallos": con un tiempo
 * limitado y contenido difícil, esa exigencia dejaría a mucha gente sin
 * progreso guardado. Se considera superada cuando se llega al final, que es
 * un criterio transparente y que quien juega entiende sin instrucciones.
 *
 * @module ui/vistas/resultado
 */

import { crear } from '../../utils/dom.js';
import { pintarVista, vistaEncabezada, pintarMigas } from '../layout.js';
import { crearEnlace, navegar } from '../router.js';
import { RUTAS, NOMBRES_JUEGOS, MEDALLAS } from '../../config.js';
import { icono } from '../iconos.js';
import { obtenerUnidad } from '../../data/index.js';
import { registrarResultado, estaCompletada, mejorPuntuacion } from '../../utils/storage.js';
import { seccionRevision, seccionRepasoMemory } from './repaso.js';
import { numero } from '../../utils/formato.js';

/** Nombre legible de un juego a partir de su identificador. */
function nombreDeJuego(idJuego) {
  return NOMBRES_JUEGOS.find((juego) => juego.id === idJuego)?.nombre || idJuego;
}

/**
 * Partidas ya contabilizadas.
 *
 * `registrarResultado()` suma a `partidasTerminadas` y a las estadísticas de la
 * temática, así que llamarla dos veces por la misma partida falsea las
 * estadísticas. Volver a la pantalla de resultado con el botón "atrás" del
 * navegador, o recargar con el resultado ya en caché, no es una partida nueva.
 *
 * El `WeakSet` guarda la referencia del resumen que `app.js` conserva mientras la
 * partida no cambie: dos partidas distintas son dos objetos distintos, y las
 * entradas viejas no retienen memoria.
 *
 * @type {WeakSet<object>}
 */
const partidasContabilizadas = new WeakSet();

/**
 * Traduce el resumen del motor al formato que espera el almacenamiento.
 *
 * @param {object} partida  Lo que devuelve `motor.resumen()`.
 * @returns {object} Parámetros de `registrarResultado()`.
 */
function aResultadoGuardable(partida) {
  return {
    idTematica: partida.unidad,
    idJuego: partida.juego,
    puntuacion: partida.puntos,
    aciertos: partida.aciertos,
    total: partida.total,
    superado: Boolean(partida.completado),
    medalla: partida.medalla?.id || null,
    // El repaso viaja al almacenamiento para que el alumno pueda volver a verlo
    // más tarde, no solo en la pantalla en la que aparece. Sin esto, la revisión
    // se pierde al salir de la partida.
    revision: partida.revision || [],
  };
}

/**
 * Las tres medallas, con la obtenida destacada.
 * @param {object|null} medalla
 * @returns {HTMLElement}
 */
function insigniasMedalla(medalla) {
  return crear(
    'div',
    { class: 'rejilla rejilla--3' },
    MEDALLAS.map((nivel) => {
      const obtenida = medalla?.id === nivel.id;
      return crear('div', { class: ['medalla', obtenida ? 'medalla--obtenida' : 'medalla--no-obtenida'] }, [
        crear('span', {
          class: 'medalla__icono',
          html: icono(obtenida ? 'medalla' : 'rombo'),
          'aria-hidden': 'true',
        }),
        crear('strong', { texto: nivel.nombre }),
        crear('span', { class: 'solo-lectores', texto: obtenida ? 'conseguida' : 'no conseguida' }),
      ]);
    })
  );
}

/**
 * Monta la pantalla de resultados.
 *
 * @param {string[]} segmentos  `segmentos[1]` = id de unidad, `[2]` = id de juego.
 * @param {object} partida  Resumen que devuelve `motor.resumen()`, con `unidad`.
 */
export function vistaResultado(segmentos, partida) {
  const idUnidad = segmentos[1] || partida?.unidad;
  const idJuego = segmentos[2] || partida?.juego;

  const unidad = obtenerUnidad(idUnidad);
  if (!unidad || !idJuego) {
    navegar(RUTAS.NO_ENCONTRADO);
    return;
  }

  // Sin resumen en memoria no hay resultado que mostrar. Se vuelve a la unidad en
  // lugar de reconstruir cifras a partir de la mejor marca guardada: eso sería
  // inventar una partida que nadie ha jugado. La ruta sigue siendo válida para
  // compartir y para el botón "atrás" del navegador; lo único que cambia es a
  // dónde se aterriza al recargar. El repaso de esa partida sí se conserva, y
  // desde la unidad se puede volver a él (ver `revisionDe`).
  if (!partida) {
    navegar(`${RUTAS.UNIDAD}/${idUnidad}`);
    return;
  }

  pintarMigas([
    { texto: 'Inicio', ruta: RUTAS.INICIO },
    { texto: unidad.nombre, ruta: `${RUTAS.UNIDAD}/${idUnidad}` },
    { texto: nombreDeJuego(idJuego) },
  ]);

  // Idempotente: recargar la URL o volver con el botón "atrás" no debe crear
  // una partida nueva ni subir una puntuación a la baja.
  if (!partidasContabilizadas.has(partida)) {
    partidasContabilizadas.add(partida);
    registrarResultado(aResultadoGuardable({ ...partida, unidad: idUnidad, juego: idJuego }));
  }

  const completado = estaCompletada(idUnidad, idJuego);
  const mejor = mejorPuntuacion(idUnidad, idJuego);
  const esRecord = partida.puntos >= mejor && partida.puntos > 0;

  pintarVista(
    vistaEncabezada(
      {
        eyebrow: `${unidad.nombre} · ${nombreDeJuego(idJuego)}`,
        titulo: completado ? 'Actividad completada' : 'Actividad terminada',
        descripcion: partida.completado
          ? 'Puedes repetirla cuando quieras: los contenidos cambian en cada partida.'
          : 'No has llegado al final de la actividad.',
        acciones: [
          crearEnlace(`${RUTAS.JUEGO}/${idUnidad}/${idJuego}`, 'Jugar de nuevo', 'boton boton--primario'),
          crearEnlace(`${RUTAS.UNIDAD}/${idUnidad}`, 'Volver a la unidad', 'boton boton--fantasma'),
        ],
      },
      [
        crear('section', { class: 'resultados' }, [
          crear('div', { class: 'marcador' }, [
            crear('div', { class: 'marcador__cifras' }, [
              crear('span', { class: 'marcador__titulo', texto: 'Resultado' }),
              crear('span', { class: 'marcador__valor' }, [
                String(partida.porcentaje),
                crear('small', { texto: ' %' }),
              ]),
            ]),
            crear('p', {
              class: 'marcador__valor',
              texto: `${partida.aciertos} de ${partida.total} · ${numero(partida.puntos)} puntos`,
            }),
            esRecord
              ? crear('p', { class: 'insignia insignia--advertencia', texto: '¡Mejor marca hasta ahora!' })
              : crear('p', {
                  class: 'nota-version',
                  texto: `Mejor marca guardada: ${numero(mejor)} puntos`,
                }),
          ]),
          insigniasMedalla(partida.medalla),
        ]),

        crear('div', { class: 'estadisticas' }, [
          crear('div', { class: 'estadistica' }, [
            crear('span', { class: 'estadistica__valor', texto: String(partida.aciertos) }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'aciertos' }),
          ]),
          crear('div', { class: 'estadistica' }, [
            crear('span', { class: 'estadistica__valor', texto: String(partida.fallos) }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'fallos' }),
          ]),
          crear('div', { class: 'estadistica' }, [
            crear('span', { class: 'estadistica__valor', texto: numero(partida.puntos) }),
            crear('span', { class: 'estadistica__etiqueta', texto: 'puntos' }),
          ]),
        ]),

        // Repaso real: la revisión de lo que se respondió en ESTA partida, con
        // la respuesta correcta de cada punto. Las claves de la unidad van
        // después, como marco general. Memory tiene su propia versión porque
        // allí no se eligieron opciones: se emparejaron cartas.
        partida.juego === 'memory'
          ? seccionRepasoMemory(partida.revision)
          : seccionRevision(partida.revision),

        unidad.objetivos?.length
          ? crear('section', { class: 'revision revision--claves' }, [
              crear('h2', { texto: 'Claves de esta unidad' }),
              crear('ul', { class: 'revision__lista' },
                unidad.objetivos.map((objetivo) =>
                  crear('li', { class: 'revision__elemento revision__elemento--correcto' }, [
                    crear('span', { html: icono('rombo'), 'aria-hidden': 'true' }),
                    objetivo,
                  ])
                )
              ),
            ])
          : null,

        crear('p', {
          class: 'nota-version',
          texto:
            'El progreso se guarda en este navegador. No hay cuentas ni servidores, y nada sale de este dispositivo.',
        }),
      ]
    )
  );
}
