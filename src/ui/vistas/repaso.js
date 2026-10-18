/**
 * repaso.js — Bloque de revisión de las respuestas de una partida.
 *
 * Capa: ui/vistas.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTÁ EN SU PROPIO FICHERO
 * ---------------------------------------------------------------------------
 * Se usa en dos sitios: al terminar la partida (`resultado.js`) y al volver a
 * ella días después (`repaso.js`). Si viviera dentro de `resultado.js` habría que
 * importarlo entero desde el otro lado, y arrastraría consigo la lógica de
 * guardar la puntuación, que la vista de repaso no necesita.
 *
 * ---------------------------------------------------------------------------
 * EL COLOR NUNCA VA SOLO
 * ---------------------------------------------------------------------------
 * Cada bloque lleva escrito "Acierto" o "Fallaste", y la respuesta que se eligió
 * sale tachada mientras la correcta va en negrita. El color es una ayuda, no la
 * información: en un aula con parte del grupo con daltonismo, o en una pantalla
 * lavada por el sol, la diferencia tiene que leerse en el texto.
 *
 * @module ui/vistas/repaso
 */

import { crear } from '../../utils/dom.js';
import { icono } from '../iconos.js';

/**
 * Convierte el contenido de una respuesta en texto.
 *
 * Los generadores producen `{tipo, valor, alt}`: texto o imagen. Para las
 * respuestas de Sprint y Escape (que son texto) basta con devolver el valor.
 * Las parejas del Memory no pasan por aquí: una imagen de pictograma se enseña
 * como imagen en `cartaRepaso()`, porque en un repaso la mitad del emparejamiento
 * ES la imagen.
 *
 * @param {object|string|undefined} contenido
 * @returns {string}
 */
export function textoDe(contenido) {
  if (!contenido) return '';
  if (typeof contenido === 'string') return contenido;
  if (contenido.tipo === 'imagen') return contenido.alt || contenido.valor || '';
  return contenido.valor || '';
}

/**
 * Una carta del repaso de Memory, con su imagen si la tiene.
 *
 * El repaso es el sitio donde el alumnado vuelve a mirar LO QUE NO SABIÓ, así
 * que en un par de pictogramas enseñar solo texto deja la mitad del emparejamiento
 * fuera. Además, si la imagen se reduce a su `alt` acaba apareciendo la ruta del
 * fichero, que es información interna: `src/assets/...` no le dice nada a nadie.
 *
 * Si la imagen no carga, el propio navegador cae en el `alt`, que el generador
 * rellena con el nombre del pictograma, no con la ruta.
 *
 * @param {object|string|undefined} contenido
 * @returns {HTMLElement}
 */
function cartaRepaso(contenido) {
  const esImagen = contenido && typeof contenido === 'object' && contenido.tipo === 'imagen';

  if (!esImagen) {
    return crear('span', { class: 'repaso__carta', texto: textoDe(contenido) });
  }

  return crear('span', { class: 'repaso__carta repaso__carta--imagen' }, [
    crear('img', {
      class: 'repaso__imagen',
      src: contenido.valor,
      alt: contenido.alt || 'Imagen de la carta',
      loading: 'lazy',
    }),
  ]);
}

/**
 * Una línea "etiqueta: texto" de la revisión.
 *
 * @param {string} etiqueta
 * @param {string} texto
 * @param {string} [clase]
 * @returns {HTMLElement}
 */
function linea(etiqueta, texto, clase = '') {
  return crear('p', { class: ['repaso__linea', clase] }, [
    crear('span', { class: 'repaso__etiqueta', texto: etiqueta }),
    crear('span', { class: 'repaso__respuesta', texto }),
  ]);
}

/**
 * Bloque de una pregunta o de una fase.
 *
 * @param {object} item
 * @returns {HTMLElement}
 */
function bloque(item) {
  const elegida = textoDe(item.elegida);
  const correcta = textoDe(item.correcta);
  const sinContestar = item.respondida === false;

  return crear('li', {
    class: ['repaso__elemento', `repaso__elemento--${item.acierto ? 'acierto' : 'fallado'}`],
  }, [
    crear('h3', { class: 'repaso__pregunta' }, [
      crear('span', {
        class: 'repaso__estado',
        texto: sinContestar ? 'Sin contestar' : item.acierto ? 'Acierto' : 'Fallaste',
      }),
      item.titulo,
    ]),

    elegida && elegida !== correcta
      ? linea('Elegiste', elegida, 'repaso__linea--elegida')
      : null,

    correcta ? linea('Correcto', correcta, 'repaso__linea--correcta') : null,

    item.breve ? crear('p', { class: 'repaso__breve', texto: item.breve }) : null,
    item.explicacion
      ? crear('p', { class: 'repaso__explicacion', texto: item.explicacion })
      : null,

    item.transferencia
      ? crear('p', { class: 'repaso__transferencia' }, [
          crear('span', { class: 'repaso__etiqueta', texto: 'Para la próxima' }),
          item.transferencia,
        ])
      : null,
  ]);
}

/**
 * Sección completa de revisión, lista para insertar en una vista.
 *
 * @param {object[]} revision  Lo que devuelve `motor.revision()`.
 * @returns {HTMLElement|null} `null` si no hay nada que repasar.
 */
export function seccionRevision(revision) {
  if (!Array.isArray(revision) || revision.length === 0) return null;

  const sinAcertar = revision.filter((item) => !item.acierto).length;

  return crear('section', { class: 'repaso' }, [
    crear('h2', { texto: 'Repasa tus respuestas' }),
    crear('p', {
      class: 'repaso__intro',
      texto: sinAcertar
        ? `${sinAcertar} de ${revision.length} sin acertar. Aquí está la respuesta correcta de cada una.`
        : 'Todo acertado. Repasa igualmente la respuesta correcta de cada una.',
    }),
    crear('ul', { class: 'repaso__lista' }, revision.map(bloque)),
  ]);
}

/**
 * Revisión de Memory: en lugar de elegir entre opciones, se emparejan cartas.
 *
 * @param {object[]} revision
 * @returns {HTMLElement|null}
 */
export function seccionRepasoMemory(revision) {
  if (!Array.isArray(revision) || revision.length === 0) return null;

  // En Memory `acierto` significa "esta pareja se llegó a emparejar", no "acertaste
  // una respuesta": no hay respuesta correcta en una carta. Decir "fallaste"
  // sería mentir, y decir "sin resolver a la primera" también, porque el motor
  // no guarda los intentos: solo guarda si el par se completó. El texto dice
  // exactamente lo que el dato sabe.
  const sinEmparejar = revision.filter((item) => !item.acierto).length;

  return crear('section', { class: 'repaso' }, [
    crear('h2', { texto: 'Los pares de esta partida' }),
    crear('p', {
      class: 'repaso__intro',
      texto: sinEmparejar
        ? `${sinEmparejar} de ${revision.length} parejas sin llegar a emparejar. Aquí están todas con su explicación.`
        : 'Estas son todas las parejas, con su explicación: repásalas antes de la próxima.',
    }),
    crear('ul', { class: 'repaso__lista' }, revision.map((item) => {
      const izquierda = cartaRepaso(item.izquierda);
      const derecha = cartaRepaso(item.derecha);

      return crear('li', {
        class: ['repaso__elemento', `repaso__elemento--${item.acierto ? 'acierto' : 'fallado'}`],
      }, [
        crear('h3', { class: 'repaso__pregunta' }, [
          crear('span', {
            class: 'repaso__estado',
            texto: item.acierto ? 'Emparejada' : 'Sin emparejar',
          }),
          crear('span', { class: 'repaso__par' }, [
            izquierda,
            crear('span', { class: 'repaso__flecha', html: icono('flecha'), 'aria-hidden': 'true' }),
            derecha,
          ]),
        ]),
        item.explicacion
          ? crear('p', { class: 'repaso__explicacion', texto: item.explicacion })
          : null,
      ]);
    })),
  ]);
}
