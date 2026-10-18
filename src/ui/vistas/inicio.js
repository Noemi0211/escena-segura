/**
 * inicio.js — Portada: elige unidad temática.
 *
 * Capa: ui/vistas.
 *
 * No recibe parámetros: recorre el registro de unidades. Añadir una unidad
 * nueva la hace aparecer aquí sin tocar este fichero. Esa es la prueba de que
 * la separación entre datos e interfaz funciona.
 *
 * @module ui/vistas/inicio
 */

import { crear } from '../../utils/dom.js';
import { pintarVista, vistaEncabezada } from '../layout.js';
import { crearEnlace } from '../router.js';
import {
  RUTAS,
  NOMBRES_JUEGOS,
  NOMBRE_APP,
  DESCRIPCION_APP,
  medallaPorId,
} from '../../config.js';
import { icono, iconoDeUnidad } from '../iconos.js';
import { listarUnidadesConResumen } from '../../data/index.js';
import { estaCompletada, medallaDe } from '../../utils/storage.js';



/**
 * Tarjeta de una unidad temática.
 *
 * @param {object} unidad  Unidad con su `resumen` ya calculado.
 * @param {number} indice  Posición, para numerar.
 * @returns {HTMLElement}
 */
function tarjetaUnidad(unidad, indice) {
  const juegosSuperados = NOMBRES_JUEGOS.filter((juego) =>
    estaCompletada(unidad.id, juego.id)
  ).length;
  // Se recorren los tres juegos buscando la mejor medalla: `medallaDe()` guarda
  // el identificador, no el objeto, y `medallaPorId()` lo traduce a su nombre.
  const medallas = NOMBRES_JUEGOS.map((juego) =>
    medallaPorId(medallaDe(unidad.id, juego.id))
  ).filter(Boolean);
  // Se ordena por `minimo` de mayor a menor en vez de coger la primera: el
  // orden de `NOMBRES_JUEGOS` no coincide con la dificultad, así que sin ordenar
  // puede enseñar Bronce en una unidad donde el alumno ya tiene Oro.
  const medalla =
    medallas.sort((a, b) => b.minimo - a.minimo)[0] || null;

  return crearEnlace(
    `${RUTAS.UNIDAD}/${unidad.id}`,
    [
      crear('span', {
        class: 'tarjeta-tematica__icono',
        html: iconoDeUnidad(unidad),
        'aria-hidden': 'true',
      }),
      crear('span', { class: 'tarjeta-tematica__numero', texto: String(indice + 1).padStart(2, '0') }),

      crear('h3', { class: 'tarjeta-tematica__titulo', texto: unidad.nombre }),

      crear('p', { class: 'tarjeta-tematica__descripcion', texto: unidad.descripcion }),

      crear('div', { class: 'tarjeta-tematica__pie' }, [
        crear('span', {
          class: 'insignia',
          texto: `${unidad.resumen.casos} casos`,
        }),
        crear('span', {
          class: 'insignia',
          texto: `${unidad.resumen.variantesMemory} memory · ${unidad.resumen.plantillasSprint} sprint`,
        }),
        medalla ? crear('span', { class: 'insignia insignia--correcto', texto: `Medalla ${medalla.nombre}` }) : null,
        juegosSuperados > 0 && juegosSuperados < NOMBRES_JUEGOS.length
          ? crear('span', {
              class: 'insignia insignia--info',
              texto: `${juegosSuperados}/${NOMBRES_JUEGOS.length} juegos superados`,
            })
          : null,
      ]),

      crear('span', { class: 'tarjeta-tematica__ir' }, [
        'Entrar',
        crear('span', { html: icono('flecha'), 'aria-hidden': 'true' }),
      ]),
    ],
    ['tarjeta-tematica', `acento-${unidad.acento || 'sanitario'}`]
  );
}

/**
 * Monta la portada.
 */
export function vistaInicio() {
  const unidades = listarUnidadesConResumen();

  const portada = crear('section', { class: 'portada' }, [
    crear('div', { class: 'portada__marca' }, [
      crear('span', { class: 'portada__escudo', html: icono('escudo'), 'aria-hidden': 'true' }),
    ]),
    crear('p', { class: 'portada__estado', texto: 'Ciclo Formativo de Emergencias Sanitarias' }),
    crear('h1', { class: 'portada__titulo', texto: NOMBRE_APP }),
    crear('p', { class: 'portada__subtitulo', texto: DESCRIPCION_APP }),
    crear('div', { class: 'portada__regla' }, [
      crear('span', { class: 'portada__regla-icono', html: icono('rombo'), 'aria-hidden': 'true' }),
    ]),
  ]);

  const tematicas = crear('section', { class: 'tematicas', 'aria-label': 'Unidades temáticas' },
    unidades.map((unidad, indice) => tarjetaUnidad(unidad, indice))
  );

  pintarVista(
    vistaEncabezada(
      { titulo: 'Escoge una unidad temática', descripcion: 'Cada unidad incluye Memory, Sprint y Escape Room.' },
      [portada, tematicas]
    )
  );
}
