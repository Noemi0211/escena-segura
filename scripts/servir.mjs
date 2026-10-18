/**
 * servir.mjs — Servidor estático mínimo, sin dependencias.
 *
 * Existe por dos motivos.
 *
 * 1. La aplicación usa módulos nativos de JavaScript, y el navegador los
 *    bloquea en `file://`. Abrir `index.html` con doble clic no funciona, así
 *    que hace falta servirla por HTTP de alguna manera.
 *
 * 2. La alternativa habitual es `npx serve`, que necesita red la primera vez
 *    para descargarse el paquete. Eso contradice la regla del proyecto de que
 *    tiene que funcionar en un aula sin instalar nada y sin conexión. Con este
 *    fichero, `npm start` no descarga nada: solo usa Node, que ya hace falta.
 *
 * Uso:  node scripts/servir.mjs [puerto]
 */

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// `RAIZ` se fuerza a terminar en separador. La comparación de prefijos de más
// abajo depende de eso: sin él, `C:\proyecto\algo` passaría el filtro de
// `C:\proyecto` y un directorio vecino quedaría accesible desde la URL.
const RAIZ = join(fileURLToPath(new URL('..', import.meta.url)), sep);
const PUERTO = Number(process.argv[2] || process.env.PORT || 8080);

/** Tipos MIME de lo que hay en el proyecto. Lo demás, `application/octet-stream`. */
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

/**
 * Carpetas que nunca se sirven. Ver `agents.md` §6 y §7.11.
 *
 * `preguntas-y-respuestas/` es la salida de `npm run generar:pdf`: cuadernillos
 * de corrección que solo son para la autora. Se bloquea por nombre, así que la
 * respuesta es 403 aunque la carpeta no exista en esa máquina.
 */
const CARPETAS_PROHIBIDAS = ['_privado-NoemiCelaya', 'preguntas-y-respuestas'];

/**
 * Convierte una URL en una ruta dentro de la raíz del proyecto.
 *
 * Se recorta y se normaliza antes de tocar el disco: sin eso, un
 * `../../secrets` en la URL escaparía de la carpeta del proyecto.
 *
 * @param {string} url
 * @returns {string|null} Ruta absoluta, o `null` si no debe servirse.
 */
function resolverRuta(url) {
  const limpia = decodeURIComponent(url.split('?')[0].split('#')[0]);
  const ruta = join(RAIZ, normalize(limpia).replace(/^([/\\])+/, ''));
  if (!ruta.startsWith(RAIZ)) return null;

  // `_privado-NoemiCelaya/` es material de trabajo y no se sirve nunca. La regla
  // de `agents.md` §6 es absoluta, y un servidor de desarrollo que lo expone es
  // la forma más fácil de acabar publicándolo por accidente al subir la carpeta
  // entera. Los ficheros y carpetas de punto tampoco: no hay nada de eso que ver
  // en clase, y `.git` no debe viajar nunca.
  const partes = relative(RAIZ, ruta).split(/[\\/]/).filter(Boolean);
  if (partes.some((parte) => CARPETAS_PROHIBIDAS.includes(parte) || parte.startsWith('.'))) {
    return null;
  }

  return ruta;
}

const servidor = createServer((peticion, respuesta) => {
  let ruta = resolverRuta(peticion.url || '/');

  if (!ruta) {
    respuesta.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    respuesta.end('403 Prohibido');
    return;
  }

  let info = null;
  try {
    info = statSync(ruta);
    if (info.isDirectory()) {
      ruta = join(ruta, 'index.html');
      info = statSync(ruta);
    }
  } catch {
    info = null;
  }

  if (!info) {
    respuesta.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    respuesta.end('404 No encontrado');
    return;
  }

  respuesta.writeHead(200, {
    'content-type': TIPOS[extname(ruta).toLowerCase()] || 'application/octet-stream',
    'content-length': info.size,
    // El material es para aula y cambia al desplegar: no tiene sentido pedirlo
    // al servidor cuando ya se sabe que es una versión nueva.
    'cache-control': 'no-cache',
  });

  createReadStream(ruta).pipe(respuesta);
});

servidor.listen(PUERTO, () => {
  console.log(`\n  Escena Segura servida en  http://localhost:${PUERTO}\n`);
  console.log('  Ctrl+C para detener el servidor.\n');
});
