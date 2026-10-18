/**
 * repaso-pantalla.js - Pantalla con el repaso guardado de la última partida.
 *
 * Capa: ui/vistas.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ES UNA RUTA APARTE Y NO UN ATAJO A `#/resultado`
 * ---------------------------------------------------------------------------
 * La pantalla de resultado necesita la partida en memoria: sin ella no hay
 * cifras que mostrar y se vuelve a la unidad. El repaso no. Sale entero de
 * `localStorage`, así que funciona con el navegador cerrado, al dí siguiente, y
 * sobrevive a que el alumno repita la actividad y la partida cambie.
 *
 * Esa es justo la diferencia: `#/resultado` es el resumen de AHORA, y
 * `#/repaso` es lo que te llevas después de clase.
 *
 * @module ui/vistas/repaso-pantalla
 */

import { crear } from '../../utils/dom.js';
import { pintarVista, vistaEncabezada, pintarMigas } from '../layout.js';
import { crearEnlace, navegar } from '../router.js';
import { RUTAS, NOMBRES_JUEGOS } from '../../config.js';
import { obtenerUnidad } from '../../data/index.js';
import { revisionDe, estaCompletada } from '../../utils/storage.js';
import { seccionRevision, seccionRepasoMemory } from './repaso.js';

/** Nombre legible de un juego a partir de su identificador. */
function nombreDeJuego(idJuego) {
  return NOMBRES_JUEGOS.find((juego) => juego.id === idJuego)?.nombre || idJuego;
}

/**
 * Monta la pantalla de repaso.
 *
 * @param {string[]} segmentos  `segmentos[1]` = unidad, `[2]` = juego.
 */
export function vistaRepaso(segmentos) {
  const idUnidad = segmentos[1];
  const idJuego = segmentos[2];

  const unidad = obtenerUnidad(idUnidad);
  if (!unidad || !idJuego) {
    navegar(RUTAS.NO_ENCONTRADO);
    return;
  }

  const revision = revisionDe(idUnidad, idJuego);

  // Sin revisión guardada no hay nada que enseñar. Se vuelve a la unidad en
  // lugar de pintar una pantalla vacía con título de "tu repaso": sería una
  // promesa que la página no puede cumplir.
  if (revision.length === 0) {
    navegar(`${RUTAS.UNIDAD}/${idUnidad}`);
    return;
  }

  pintarMigas([
    { texto: 'Inicio', ruta: RUTAS.INICIO },
    { texto: unidad.nombre, ruta: `${RUTAS.UNIDAD}/${idUnidad}` },
    { texto: `Repaso de ${nombreDeJuego(idJuego)}` },
  ]);

  // El rótulo dice "aciertos" solo donde significa algo: en Memory el contador
  // real es parejas emparejadas, no respuestas acertadas.
  const esMemory = idJuego === 'memory';
  const sinAcertar = revision.filter((item) => !item.acierto).length;
  const superada = estaCompletada(idUnidad, idJuego);

  pintarVista(
    vistaEncabezada(
      {
        eyebrow: unidad.nombre,
        titulo: `Repaso de ${nombreDeJuego(idJuego)}`,
        descripcion: superada
          ? 'Aquí tienes las respuestas de tu última partida, con la correcta de cada una. Vuelve a este repaso tantas veces como quieras.'
          : 'Estas son las respuestas de tu última partida.',
        acciones: [
          crearEnlace(
            `${RUTAS.JUEGO}/${idUnidad}/${idJuego}`,
            'Jugar de nuevo',
            'boton boton--primario'
          ),
          crearEnlace(`${RUTAS.UNIDAD}/${idUnidad}`, 'Volver a la unidad', 'boton boton--fantasma'),
        ],
      },
      [
        crear('p', {
          class: 'insignia insignia--neutro',
          texto: sinAcertar > 0
            ? `${sinAcertar} de ${revision.length} sin ${esMemory ? 'emparejar' : 'acertar'} en la última partida`
            : esMemory
              ? `${revision.length} parejas emparejadas en la última partida`
              : `Aciertos: ${revision.length} de ${revision.length} en la última partida`,
        }),

        idJuego === 'memory'
          ? seccionRepasoMemory(revision)
          : seccionRevision(revision),

        crear('p', {
          class: 'nota-version',
          texto:
            'Este repaso se guarda en este navegador. No hay cuentas ni servidores, y nada sale de este dispositivo.',
        }),
      ]
    )
  );
}
