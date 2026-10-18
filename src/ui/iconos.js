/**
 * iconos.js — Iconos SVG en línea.
 *
 * Capa: ui.
 *
 * Motivo de existir: se usan SVG en línea en lugar de ficheros o fuentes de
 * iconos porque así el color lo hereda de `currentColor`, no hay peticiones de
 * red, funcionan sin JavaScript adicional y se pueden estilar con CSS.
 *
 * Todos tienen `aria-hidden="true"` y `focusable="false"`: son decorativos. El
 * significado lo aporta el texto que los acompaña, nunca el icono. Un icono
 * como único contenido de un botón es un botón inaccesible.
 *
 * @module ui/iconos
 */

/** Envuelve un trazado en un <svg> con los atributos de accesibilidad. */
function envolver(trazado, vista = '0 0 24 24') {
  return `<svg viewBox="${vista}" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${trazado}</svg>`;
}

/** Iconos disponibles, por nombre. */
export const ICONOS = {
  escudo: envolver(
    '<path d="M12 3 4 6v6c0 4.5 3.2 7.9 8 9 4.8-1.1 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'
  ),
  rayo: envolver('<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>'),
  triangulo: envolver('<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5"/><path d="M12 17h.01"/>'),
  gota: envolver('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>'),
  llama: envolver('<path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.6.7-3 1.5-4 0 1.4.8 2.4 2 2.4 1.4 0 2-1.2 1.5-3-.4-1.6 0-3 0-4.4Z"/>'),
  capas: envolver('<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>'),
  rombo: envolver('<path d="M12 3 21 12 12 21 3 12 12 3Z"/>'),
  cerebro: envolver('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 8 19h1V4H9Z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8A3 3 0 0 1 16 19h-1V4h0Z"/>'),
  reloj: envolver('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  candado: envolver('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  llave: envolver('<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8 3 3-2 2-3-3-2 2"/>'),
  grafico: envolver('<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>'),
  menu: envolver('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/>'),
  flecha: envolver('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  volver: envolver('<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>'),
  check: envolver('<path d="m5 13 4 4 10-10"/>'),
  cruz: envolver('<path d="M6 6 18 18"/><path d="M18 6 6 18"/>'),
  info: envolver('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'),
  aviso: envolver('<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'),
  sol: envolver('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>'),
  luna: envolver('<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>'),
  descarga: envolver('<path d="M12 4v10"/><path d="m8 11 4 4 4-4"/><path d="M5 19h14"/>'),
  enlace: envolver('<path d="M10 13a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6"/><path d="M14 11a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 19.7L12.5 18"/>'),

  // Iconos que representan un CONCEPTO en el texto (no solo decorativos):
  ojo: envolver('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/>'),
  medalla: envolver('<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>'),
};

/**
 * Devuelve el SVG de un icono.
 *
 * @param {string} nombre  Clave de `ICONOS`. Si no existe, devuelve `''` en
 *   lugar de lanzar: un icono que falta no debe tumbar una pantalla.
 * @returns {string} Marcado SVG, listo para `html:` en `crear()`.
 */
export function icono(nombre) {
  return ICONOS[nombre] || '';
}

/**
 * Icono de la unidad temática, deducido de su `icono` o de su `acento`.
 * @param {object} unidad
 * @returns {string}
 */
export function iconoDeUnidad(unidad) {
  return icono(unidad?.icono) || icono('rombo');
}

/** Icono asociado a cada juego. */
export const ICONOS_JUEGO = Object.freeze({
  memory: 'capas',
  sprint: 'rayo',
  escape: 'candado',
});
