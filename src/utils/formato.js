/**
 * formato.js — Formato de texto, cifras y marcas de tiempo.
 *
 * Capa: utils.
 *
 * Concentra el formato para que un número se muestre igual en la pantalla de
 * resultados, en el marcador del Sprint y en la ficha de progreso. Cambiar el
 * criterio de "medalla de plata" de 60 a 70 puntos exige tocar un solo sitio.
 */

/**
 * Redondea a un número de decimales evitando el error de coma flotante.
 *
 * @param {number} valor
 * @param {number} [decimales]
 * @returns {number}
 */
export function redondear(valor, decimales = 0) {
  const factor = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

/**
 * Formatea un número con separador de miles español.
 *
 * @param {number} valor
 * @param {number} [decimales]
 * @returns {string}
 */
export function numero(valor, decimales = 0) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(Number(valor) || 0);
}

/**
 * Formatea un porcentaje a partir de una fracción (0..1).
 *
 * @param {number} fraccion
 * @param {number} [decimales]
 * @returns {string} p. ej. "82 %".
 */
export function porcentaje(fraccion, decimales = 0) {
  const valor = redondear((Number(fraccion) || 0) * 100, decimales);
  return `${numero(valor)} %`;
}

/**
 * Convierte segundos en el formato M:SS habitual de un cronómetro.
 *
 * @param {number} segundos
 * @returns {string} p. ej. "1:07".
 */
export function tiempo(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

/**
 * Hora de la simulación para el diario de bordo del Escape Room.
 * No usa la hora real: en una actividad docente es más coherente presentar
 * la hora del incidente que la del aula.
 *
 * @param {number} [minutosDesdeInicio]
 * @returns {string} p. ej. "+07 min".
 */
export function marcaTiempo(minutosDesdeInicio = 0) {
  return `+${String(Math.max(0, Math.round(minutosDesdeInicio))).padStart(2, '0')} min`;
}

/**
 * Fecha corta en formato español.
 *
 * @param {string|Date} [fecha]
 * @returns {string}
 */
export function fecha(fecha = new Date()) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Convierte un texto a un identificador "slug" utilizable en URL y en claves.
 * ñ -> n, tildes eliminadas, espacios -> guiones.
 *
 * @param {string} texto
 * @returns {string}
 */
export function slug(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Mayúscula inicial sin tocar el resto del texto.
 *
 * @param {string} texto
 * @returns {string}
 */
export function primeraMayuscula(texto) {
  const cadena = String(texto || '');
  return cadena ? cadena[0].toUpperCase() + cadena.slice(1) : '';
}

/**
 * Pluraliza de forma sencilla e insegura para uso en interfaz.
 *
 * @param {number} cantidad
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string} p. ej. "1 actividad" / "3 actividades".
 */
export function plural(cantidad, singular, pluralForma) {
  const n = Number(cantidad) || 0;
  return n === 1 ? singular : pluralForma || `${singular}s`;
}

/**
 * Convierte un valor a una cadena segura para insertar en una plantilla.
 * Sustituye los marcadores `{ruta}` por los valores indicados.
 *
 * @param {string} plantilla  Texto con marcadores, p. ej. "¿Es «{nombre}» seguro?".
 * @param {Record<string, string|number>} valores
 * @returns {string}
 *
 * @example
 *   resolverPlantilla('Riesgo: {nombre}', { nombre: 'eléctrico' })
 *   // -> 'Riesgo: eléctrico'
 */
export function resolverPlantilla(plantilla, valores = {}) {
  // La ruta admite dígitos para poder indexar arrays con notación de punto
  // ('{unidad.catalogos.riesgo.0.nombre}') y no con corchetes, que rompen el
  // patrón. Un marcador mal escrito se deja tal cual: es preferible verlo en
  // pantalla que resolverlo a `undefined` en silencio.
  return String(plantilla || '').replace(/\{([\w.]+)\}/g, (coincidencia, ruta) => {
    const valor = leerRuta(valores, ruta);
    return valor === undefined || valor === null ? coincidencia : String(valor);
  });
}

/**
 * Lee un valor anidado por ruta con puntos: 'a.b.c'.
 * Implementación propia para no depender de reduce tipado ni de librerías.
 *
 * @param {object} objeto
 * @param {string} ruta
 * @returns {*}
 */
export function leerRuta(objeto, ruta) {
  if (!objeto || !ruta) return undefined;
  return String(ruta)
    .split('.')
    .reduce((actual, clave) => (actual == null ? undefined : actual[clave]), objeto);
}
