/**
 * dom.js — Utilidades de manipulación del DOM.
 *
 * Capa: utils (transversal, sin conocimiento del dominio).
 *
 * Motivo de existir: la aplicación construye su interfaz mediante JavaScript.
 * Centralizar aquí la creación de nodos y el saneado de texto evita:
 *   · repetir `innerHTML` con datos de contenido (riesgo de inyección),
 *   · concatenar cadenas de HTML en las vistas,
 *   · tener N implementaciones distintas de "crear un <div> con clases".
 *
 * Ninguna función de este módulo sabe qué es una emergencia ni un pictograma.
 */

/**
 * Crea un elemento del DOM con atributos e hijos.
 *
 * @param {string} etiqueta      Nombre de la etiqueta ('div', 'button', ...).
 * @param {object} [atributos]  Atributos. Casos especiales:
 *                                - `class`: string o array de clases.
 *                                - `dataset`: objeto, se antepone `data-`.
 *                                - `html`: HTML de confianza (solo para iconos
 *                                  internos de la aplicación, nunca contenido).
 *                                - `texto`: texto plano (preferido).
 *                                - `on`: manejadores de evento `{click: fn}`.
 * @param {Array|Node|string} [hijos] Contenido a añadir.
 * @returns {HTMLElement} El elemento creado.
 *
 * @example
 *   crear('button', { class: 'boton boton--primario', texto: 'Empezar',
 *                     on: { click: iniciar } })
 */
export function crear(etiqueta, atributos = {}, hijos = []) {
  const nodo = document.createElement(etiqueta);

  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;

    switch (clave) {
      case 'class':
      case 'className':
        nodo.className = Array.isArray(valor) ? valor.filter(Boolean).join(' ') : valor;
        break;

      case 'texto':
        nodo.textContent = valor;
        break;

      case 'html':
        // Reservado a SVG estáticos definidos en el propio código.
        // NUNCA pasar contenido procedente de los ficheros de trabajo ni de datos externos.
        nodo.innerHTML = valor;
        break;

      case 'dataset':
        for (const [d, v] of Object.entries(valor)) {
          if (v !== null && v !== undefined) nodo.dataset[d] = v;
        }
        break;

      case 'on':
        for (const [evento, manejador] of Object.entries(valor)) {
          nodo.addEventListener(evento, manejador);
        }
        break;

      case 'ref':
        // std: callback con el nodo ya insertado, para medirlo.
        if (typeof valor === 'function') valor(nodo);
        break;

      default:
        if (valor === true) nodo.setAttribute(clave, '');
        else nodo.setAttribute(clave, String(valor));
    }
  }

  agregar(nodo, hijos);
  return nodo;
}

/**
 * Añade uno o varios hijos a un nodo, normalizando entradas.
 *
 * @param {HTMLElement} padre
 * @param {Array|Node|string|null|undefined} hijos
 * @returns {HTMLElement} `padre`, para encadenar.
 */
export function agregar(padre, hijos) {
  if (hijos === null || hijos === undefined || hijos === false) return padre;

  for (const hijo of aplanar(hijos)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    padre.appendChild(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return padre;
}

/**
 * Aplana arrays anidados en una lista de hijos.
 *
 * Existe por un fallo silencioso: una vista que compone sus secciones en un
 * array y lo pasa a `crear()` como hijo único acaba escribiendo en pantalla
 * `[object HTMLElement]`, porque un array no es un `Node` y `String()` lo
 * delata. Con la lista aplanada, tanto `[a, b]` como `[[a], b, [c, d]]`
 * producen el mismo DOM y el orden de anidamiento deja de importar.
 *
 * @param {Array|Node|string|null|undefined|false} hijos
 * @returns {Array} Lista sin arrays dentro.
 */
function aplanar(hijos) {
  if (!Array.isArray(hijos)) return [hijos];

  const salida = [];
  for (const hijo of hijos) {
    if (Array.isArray(hijo)) salida.push(...aplanar(hijo));
    else salida.push(hijo);
  }
  return salida;
}

/**
 * Vacía un nodo de todos sus hijos.
 *
 * @param {HTMLElement} nodo
 * @returns {HTMLElement} `nodo`, para encadenar.
 */
export function vaciar(nodo) {
  if (!nodo) return nodo;
  while (nodo.firstChild) nodo.removeChild(nodo.firstChild);
  return nodo;
}

/**
 * Sustituye todo el contenido de un nodo.
 *
 * @param {HTMLElement} nodo
 * @param {Array|Node|string} contenido
 * @returns {HTMLElement} `nodo`, para encadenar.
 */
export function reemplazar(nodo, contenido) {
  return agregar(vaciar(nodo), contenido);
}

/**
 * Sustituye los hijos de un nodo por una colección de <li>.
 * Azúcar sintáctico: recuerda que una lista debe ser <ul><li>.
 *
 * @param {string} etiquetaLista  'ul' | 'ol'
 * @param {Array} items            Contenido de cada elemento.
 * @param {string} [clase]
 * @returns {HTMLElement}
 */
export function lista(etiquetaLista, items, clase) {
  const ul = crear(etiquetaLista, clase ? { class: clase } : {});
  for (const item of items) {
    ul.appendChild(crear('li', {}, item));
  }
  return ul;
}

/**
 * Obtiene el elemento raíz de una cadena HTML o lo crea desde un selector.
 *
 * @param {string|HTMLElement} origen
 * @returns {HTMLElement|null}
 */
export function elementoRaiz(origen) {
  if (origen instanceof HTMLElement) return origen;
  if (typeof origen !== 'string') return null;

  const contenedor = document.createElement('div');
  contenedor.innerHTML = origen.trim();
  // Devuelve el nodo de primer nivel (no el <div> auxiliar).
  return contenedor.firstElementChild;
}

/**
 * Marca el enlace de salto para que el foco viaje al contenido principal.
 * Necesario porque el destino es un <main> sin tabindex.
 *
 * @param {string} [idDestino]
 */
export function enfocarContenido(idDestino = 'contenido-principal') {
  const destino = document.getElementById(idDestino);
  if (!destino) return;
  destino.setAttribute('tabindex', '-1');
  destino.focus({ preventScroll: true });
  destino.addEventListener('blur', () => destino.removeAttribute('tabindex'), {
    once: true,
  });
}

/**
 * Delegación de eventos: un único manejador en la raíz para muchos hijos.
 * Los motores de juego la usan de forma intensiva (rejillas que se recrean).
 *
 * @param {HTMLElement|Document} raiz
 * @param {string} tipoEvento   Evento delegativo, p. ej. 'click'.
 * @param {string} selector     Selector CSS del descendiente objetivo.
 * @param {(evento: Event, objetivo: HTMLElement) => void} manejador
 * @returns {() => void} Función para eliminar la delegación.
 *
 * @example
 *   const quitar = delegar(rejilla, 'click', '.carta-memory', (ev, carta) => ...)
 */
export function delegar(raiz, tipoEvento, selector, manejador) {
  const fn = (evento) => {
    const destino = evento.target;
    // `target` no siempre es un elemento: puede ser el propio documento o un
    // nodo de texto. Llamar a `closest` sobre eso lanza, y aquí una excepción
    // deja la pantalla en blanco: es un fallo pequeño con un coste alto.
    if (!(destino instanceof Element)) return;

    const objetivo = destino.closest(selector);
    // Solo si el objetivo pertenece al árbol de `raiz`.
    if (objetivo && raiz.contains(objetivo)) manejador(evento, objetivo);
  };
  raiz.addEventListener(tipoEvento, fn);
  return () => raiz.removeEventListener(tipoEvento, fn);
}
