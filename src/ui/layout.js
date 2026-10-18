/**
 * layout.js — Armazón de la aplicación: cabecera, navegación y pie.
 *
 * Capa: ui.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EL HTML ESTÁ TAN VACÍO
 * ---------------------------------------------------------------------------
 * `index.html` solo declara `<div id="aplicacion">`. Todo lo demás se construye
 * aquí. Motivo: el proyecto no usa empaquetador ni plantillas, así que la
 * única fuente de verdad para la estructura de la interfaz es este módulo. Si el
 * esqueleto estuviera duplicado entre el HTML y el JavaScript, cualquier cambio
 * de navegación obligaría a editar los dos sitios y a la larga divergirían.
 *
 * En `index.html` solo queda lo que NO puede construirse desde JavaScript: el
 * `doctype`, los `meta`, los `link` a las hojas de estilo y el `<noscript>`.
 *
 * ---------------------------------------------------------------------------
 * ESTRUCTURA
 * ---------------------------------------------------------------------------
 *   <header class="cabecera">   marca, progreso, enlaces, tema
 *   <main    class="principal">  migas + contenido de la vista
 *   <footer class="pie">         créditos y licencia
 *
 * `main` lleva `id="contenido-principal"` porque el enlace de salto del HTML
 * apunta ahí: es requisito de accesibilidad en teclado.
 *
 * @module ui/layout
 */

import { crear, reemplazar, vaciar } from '../utils/dom.js';
import { crearEnlace, marcarEnlaceActual } from './router.js';
import { NOMBRE_APP, CREDITOS, LICENCIA, RUTAS, CLASE_NAVEGACION_TECLADO } from '../config.js';
import { icono } from './iconos.js';
import { guardarPreferencia } from '../utils/storage.js';
import { unidades } from '../data/index.js';

/* ==========================================================================
   CABECERA
   ========================================================================== */

/**
 * Enlaces de la cabecera.
 * @returns {Array<{ruta: string, texto: string, icono: string}>}
 */
const ENLACES_CABECERA = [
  { ruta: RUTAS.INICIO, texto: 'Inicio', icono: 'escudo' },
  { ruta: RUTAS.PROGRESO, texto: 'Mi progreso', icono: 'grafico' },
  { ruta: RUTAS.ACERCA_DE, texto: 'Acerca de', icono: 'info' },
];

/**
 * Construye la cabecera.
 *
 * @param {{progreso: number}} contexto
 * @returns {HTMLElement}
 */
function crearCabecera(contexto) {
  const enlaces = crear('nav', { class: 'cabecera__acciones', 'aria-label': 'Principal' });

  for (const enlace of ENLACES_CABECERA) {
    enlaces.appendChild(
      crearEnlace(enlace.ruta, [
        crear('span', { html: icono(enlace.icono), 'aria-hidden': 'true' }),
        crear('span', { texto: enlace.texto }),
      ], 'cabecera__enlace')
    );
  }

  // La barra se construye con carril y relleno porque el ancho del relleno es
  // lo que comunica el progreso. Poner el porcentaje en el `aria-valuenow` de un
  // contenedor vacío lo diría a un lector de pantalla, pero no se vería.
  const relleno = crear('span', { class: 'progreso__relleno' });
  const barra = crear('div', {
    class: 'progreso__pista',
    role: 'progressbar',
    'aria-valuenow': contexto.progreso,
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-label': `Progreso global: ${contexto.progreso} %`,
  }, relleno);

  const soloLectores = crear('span', { class: 'solo-lectores', texto: `${contexto.progreso} %` });
  const cifra = crear('span', { class: 'cabecera__titulo', texto: `${contexto.progreso} %` });

  progresoCabecera = { barra, relleno, cifra, soloLectores };
  relleno.style.width = `${contexto.progreso}%`;

  return crear('header', { class: 'cabecera' }, [
    crear('div', { class: 'cabecera__fila' }, [
      crearEnlace(
        RUTAS.INICIO,
        [
          crear('span', {
            class: 'cabecera__logo',
            html: icono('escudo'),
            'aria-hidden': 'true',
          }),
          crear('span', { class: 'cabecera__titulo', texto: NOMBRE_APP }),
          crear('span', { class: 'cabecera__siglas', texto: 'TES' }),
        ],
        'cabecera__marca'
      ),

      crear('span', { class: 'cabecera__espaciador' }),

      crear('div', { class: 'cabecera__progreso' }, [
        crear('span', { class: 'cabecera__titulo', texto: 'Progreso global' }),
        barra,
        cifra,
        soloLectores,
      ]),

      enlaces,

      crearBotonTema(),
    ]),
  ]);
}

/**
 * Botón de claro/oscuro.
 *
 * El tema se guarda en preferencias, no en la opción del sistema, para que la
 * elección se mantenga al cambiar de dispositivo... salvo que la persona no
 * haya elegido nunca, en cuyo caso se respeta `prefers-color-scheme`.
 *
 * @returns {HTMLElement}
 */
function crearBotonTema() {
  const boton = crear('button', {
    class: 'cabecera__enlace',
    type: 'button',
    'aria-label': 'Cambiar entre tema claro y oscuro',
    title: 'Cambiar tema',
  });

  function pintar() {
    const oscuro = document.documentElement.dataset.tema !== 'claro';
    reemplazar(boton, crear('span', { html: icono(oscuro ? 'luna' : 'sol') }));
  }

  boton.addEventListener('click', () => {
    const actual = document.documentElement.dataset.tema;
    const nuevo = actual === 'claro' ? 'oscuro' : 'claro';
    document.documentElement.dataset.tema = nuevo;
    guardarPreferencia('tema', nuevo);
    pintar();
  });

  pintar();
  return boton;
}

/* ==========================================================================
   PIE
   ========================================================================== */

/**
 * Construye el pie con los créditos y la licencia.
 * @returns {HTMLElement}
 */
function crearPie() {
  return crear('footer', { class: 'pie' }, [
    crear('div', { class: 'pie__contenido' }, [
      crear('p', { class: 'pie__creditos', texto: CREDITOS }),
      crear('p', { class: 'pie__licencia' }, [
        'Licencia ',
        crear('a', {
          href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es',
          rel: 'license noopener',
          target: '_blank',
          texto: LICENCIA,
        }),
      ]),
    ]),
  ]);
}

/* ==========================================================================
   CONTENIDO
   ========================================================================== */

/**
 * `<main>` de la aplicación. Se conserva entre navegaciones.
 * @type {HTMLElement|null}
 */
let principal = null;
/** Zona donde se montan las migas de pan. */
let migas = null;
/**
 * Zona donde se pinta la vista activa.
 *
 * Existe separada de `principal` por un motivo concreto: `principal` es el
 * `<main>` y también contiene las migas. Si `pintarVista()` sustituyera sus
 * hijos directamente, la primera navegación se llevaría por delante el nodo de
 * las migas, y todas las siguientes escribirían en un nodo ya desconectado del
 * documento: las migas desaparecerían para siempre al navegar.
 *
 * @type {HTMLElement|null}
 */
let zonaVista = null;
/** Nodo de la barra de progreso de la cabecera, para poder refrescarla. */
let progresoCabecera = null;

/**
 * Inserta las migas de pan.
 * @param {Array<{texto: string, ruta?: string}>} pasos
 */
export function pintarMigas(pasos) {
  if (!migas) return;

  vaciar(migas);
  if (!pasos || pasos.length === 0) {
    // Sin migas, el contenedor se oculta para no dejar un hueco vacío.
    migas.hidden = true;
    return;
  }

  migas.hidden = false;
  const lista = crear('ol', { class: 'migas' });

  pasos.forEach((paso, indice) => {
    const ultimo = indice === pasos.length - 1;
    lista.appendChild(
      crear('li', { class: 'migas__elemento' }, [
        paso.ruta && !ultimo
          ? crearEnlace(paso.ruta, paso.texto, 'migas__enlace')
          : crear('span', {
              class: ultimo ? 'migas__actual' : 'migas__separador',
              texto: paso.texto,
              'aria-current': ultimo ? 'page' : null,
            }),
        ultimo ? null : crear('span', {
            class: 'migas__flecha',
            html: icono('flecha'),
            'aria-hidden': 'true',
          }),
      ])
    );
  });

  migas.appendChild(lista);
}

/**
 * Sustituye el contenido de la vista activa por el de una vista nueva.
 *
 * Solo se vacía `zonaVista`: el `<main>` y las migas sobreviven.
 *
 * @param {HTMLElement} contenido
 */
export function pintarVista(contenido) {
  if (!zonaVista) return;
  reemplazar(zonaVista, contenido);
  // Cada vista nueva empieza arriba: si no, se hereda el scroll anterior.
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * Refresca el porcentaje de progreso de la cabecera.
 *
 * Se llama tras cada navegación y no solo al arrancar: al terminar una
 * actividad el progreso cambia, y una cabecera con el dato viejo enseña lo
 * contrario de lo que acaba de pasar.
 *
 * @param {number} [porcentaje]  Si se omite, se conserva el del montaje.
 */
export function actualizarProgresoCabecera(porcentaje) {
  if (!progresoCabecera) return;

  const valor = Math.max(0, Math.min(100, Math.round(porcentaje ?? 0)));

  progresoCabecera.barra.setAttribute('aria-valuenow', String(valor));
  progresoCabecera.barra.setAttribute('aria-label', `Progreso global: ${valor} %`);
  progresoCabecera.relleno.style.width = `${valor}%`;
  progresoCabecera.cifra.textContent = `${valor} %`;
  progresoCabecera.soloLectores.textContent = `${valor} %`;
}

/**
 * Envuelve una vista con su encabezado estándar.
 *
 * @param {{eyebrow?: string, titulo: string, descripcion?: string,
 *          acciones?: Array}} opciones
 * @param {Array|HTMLElement} [contenido]
 * @returns {HTMLElement}
 */
export function vistaEncabezada({ eyebrow, titulo, descripcion, acciones }, contenido) {
  return crear('div', { class: 'vista' }, [
    crear('header', { class: 'vista-encabezado' }, [
      eyebrow ? crear('p', { class: 'vista-eyebrow', texto: eyebrow }) : null,
      crear('h1', { class: 'vista-titulo', texto: titulo }),
      descripcion ? crear('p', { class: 'vista-descripcion', texto: descripcion }) : null,
      acciones && acciones.length
        ? crear('div', { class: 'vista-acciones' }, acciones)
        : null,
    ]),
    contenido || null,
  ]);
}

/* ==========================================================================
   MONTAJE
   ========================================================================== */

/**
 * Monta el armazón completo en el contenedor raíz.
 *
 * @param {HTMLElement} raiz  Elemento `#aplicacion` del `index.html`.
 * @param {{progreso?: number}} [contexto]
 * @returns {{principal: HTMLElement, migas: HTMLElement}}
 */
export function montarArmazon(raiz, contexto = {}) {
  const progreso = contexto.progreso ?? 0;

  raiz.setAttribute('aria-busy', 'false');
  vaciar(raiz);

  const cabecera = crearCabecera({ progreso });
  migas = crear('div', { class: 'migas-contenedor' });
  zonaVista = crear('div', { class: 'principal__vista' });
  principal = crear(
    'main',
    { class: 'principal', id: 'contenido-principal', tabindex: '-1' },
    [migas, zonaVista]
  );
  const pie = crearPie();

  raiz.appendChild(cabecera);
  raiz.appendChild(principal);
  raiz.appendChild(pie);

  // Resalta el enlace de la sección actual. `app.js` vuelve a llamarlo tras cada
  // navegación; aquí solo para que la primera pantalla salga ya marcada.
  marcarEnlaceActual(ENLACES_CABECERA.map((e) => e.ruta));

  observarTeclado();
  return { principal, migas, zonaVista };
}

/**
 * Añade una clase a `<html>` mientras se navega con teclado.
 *
 * Motivo: los contornos de foco visibles son obligatorios para quien navega
 * con teclado, pero molestan al usar el ratón. Detectar `Tab` en lugar de
 * `:focus-visible` permite el comportamiento correcto sin depender de que el
 * navegador implemente una pseudo-clase concreta.
 */
function observarTeclado() {
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Tab') {
      document.documentElement.classList.add(CLASE_NAVEGACION_TECLADO);
    }
  });

  document.addEventListener('pointerdown', () => {
    document.documentElement.classList.remove(CLASE_NAVEGACION_TECLADO);
  });
}
