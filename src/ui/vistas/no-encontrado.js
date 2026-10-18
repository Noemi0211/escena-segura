/**
 * no-encontrado.js — Pantalla de ruta inexistente.
 *
 * Capa: ui/vistas.
 *
 * Existe porque las rutas se escriben a mano o se comparten entre el
 * profesorado, y tarde o temprano alguien llega a una que no existe. La
 * aplicación tiene que responder con algo útil en lugar de quedarse en
 * blanco o, peor, lanzar un error.
 *
 * @module ui/vistas/no-encontrado
 */

import { crear } from '../../utils/dom.js';
import { pintarVista, vistaEncabezada, pintarMigas } from '../layout.js';
import { crearEnlace } from '../router.js';
import { RUTAS, NOMBRE_APP } from '../../config.js';
import { unidades } from '../../data/index.js';

/**
 * Monta la pantalla de "no encontrado".
 *
 * @param {string[]} [segmentos]
 */
export function vistaNoEncontrado(segmentos = []) {
  const ruta = window.location.hash || '(vacía)';

  pintarMigas([{ texto: 'Inicio', ruta: RUTAS.INICIO }, { texto: 'Página no encontrada' }]);

  pintarVista(
    vistaEncabezada(
      { eyebrow: 'Error de navegación', titulo: 'No encontramos esa página' },
      [
        crear('div', { class: 'caja-error' }, [
          crear('h2', { class: 'caja-error__titulo', texto: `No existe la ruta «${ruta}»` }),
          crear('p', {
            class: 'caja-error__detalle',
            texto:
              'Puede que el enlace esté mal escrito o que la actividad se haya movido. Estas son las rutas disponibles:',
          }),
          crear('ul', { class: 'revision__elemento' }, [
            crear('li', {}, [crearEnlace(RUTAS.INICIO, `${NOMBRE_APP}: inicio`, 'migas__enlace')]),
            crear('li', {}, [crearEnlace(RUTAS.PROGRESO, 'Mi progreso', 'migas__enlace')]),
            crear('li', {}, [crearEnlace(RUTAS.ACERCA_DE, 'Acerca de', 'migas__enlace')]),
            ...unidades.map((unidad) =>
              crear('li', {}, [
                crearEnlace(`${RUTAS.UNIDAD}/${unidad.id}`, unidad.nombre, 'migas__enlace'),
              ])
            ),
          ]),
        ]),
      ]
    )
  );
}
