/**
 * recorrer.mjs — Recorrido de la aplicación en un navegador de verdad.
 *
 * Se ejecuta con `npm run test:navegador`, sin dependencias externas.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTE FICHERO, CUANDO `npm test` YA PASA
 * ---------------------------------------------------------------------------
 * `verificar` comprueba sintaxis, importaciones, datos y motores. Todo eso puede
 * estar impecable mientras la aplicación no pinta absolutamente nada, y pasó:
 * las cinco vistas que usan `vistaEncabezada()` mostraban su cuerpo como el
 * texto literal `[object HTMLElement]` (ver `agents.md` §2.1.1). Ni un test lo
 * detectó, porque el fallo estaba en cómo se componía el DOM, no en los datos.
 *
 * Un fallo así solo aparece mirando la pantalla. Un recorrido automático que
 * Navigate, hace clic y lee el DOM es lo más cerca de "mirar la pantalla" que se
 * puede hacer sin una persona delante.
 *
 * ---------------------------------------------------------------------------
 * CÓMO SE SALTA SIN FALLAR
 * ---------------------------------------------------------------------------
 * Necesita dos cosas que no son parte de la aplicación: Node 22 o superior (por
 * el `WebSocket` global) y un Chrome instalado. Si falta cualquiera de las dos,
 * avisa y termina con éxito. Motivo: `npm run verificar` tiene que poder
 * ejecutarse en el portátil de quien mantiene sin obligarle a instalar nada, y
 * un fallo por falta de Chrome no dice nada del código.
 *
 * `engines` sigue diciendo `>=18` a propósito: el aula solo necesita `npm start`,
 * que funciona desde mucho antes. Ver `agents.md` §7.1.
 *
 * Con `SIN_NAVEGADOR=1` se salta siempre, que es lo que se necesita en una
 * integración continua donde no hay navegador.
 */

import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PUERTO = Number(process.env.PUERTO || 8099);
const BASE = `http://localhost:${PUERTO}`;
const CANDIDATOS = 40;
const ESPERA_MS = 250;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/* ==========================================================================
   1. ¿SE PUEDE EJECUTAR?
   ========================================================================== */

/** Rutas habituales de Chrome, por sistema. */
const RUTAS_CHROME = [
  process.env.CHROME_PATH,
  process.env.CHROME,
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

/**
 * Localiza el ejecutable de Chrome.
 *
 * No se fija una sola ruta porque el recorrido tiene que servir en el portátil
 * de quien mantiene, no solo en la máquina donde se escribió. Si no se
 * encuentra, quien lo use puede indicar la ruta con `CHROME_PATH`.
 *
 * @returns {string|null}
 */
function localizarChrome() {
  return RUTAS_CHROME.find((ruta) => existsSync(ruta)) || null;
}

const chrome = localizarChrome();
const versionNode = Number(process.versions.node.split('.')[0]);
const forzado = process.env.SIN_NAVEGADOR === '1';

if (forzado) {
  console.log('  SE SALTAN  recorrido en navegador: SIN_NAVEGADOR=1 lo pide así.');
  process.exit(0);
}

if (typeof WebSocket === 'undefined' || versionNode < 22) {
  console.log(
    `  SE SALTAN  recorrido en navegador: hace falta Node 22 y hay ${versionNode}.`
  );
  console.log('             La aplicación y el resto de verificar no lo necesitan.');
  process.exit(0);
}

if (!chrome) {
  console.log('  SE SALTAN  recorrido en navegador: no se encuentra Chrome.');
  console.log('             Indica la ruta con CHROME_PATH si está en otro sitio.');
  process.exit(0);
}

/* ==========================================================================
   2. SERVIDOR Y NAVEGADOR
   ========================================================================== */

const perfil = mkdtempSync(join(tmpdir(), 'escena-segura-recorrido-'));
let servidor = null;
let navegador = null;

/**
 * Levanta el servidor de desarrollo en el puerto del recorrido.
 *
 * Se arranca aquí y no se pide que haya uno en marcha a propósito: `verificar`
 * tiene que ser un único comando. El puerto es propio para no chocar con el
 * `npm start` que pueda tener abierto quien esté probando la aplicación.
 */
function arrancarServidor() {
  servidor = spawn(process.execPath, [join(RAIZ, 'scripts', 'servir.mjs'), String(PUERTO)], {
    cwd: RAIZ,
    stdio: 'ignore',
  });
}

/**
 * Arranca Chrome sin ventana y espera a que abra el puerto de depuración.
 *
 * Se pide el puerto 0 y se lee del fichero que Chrome escribe en el perfil
 * (`DevToolsActivePort`). Elegir un puerto fijo haría fallar la prueba si
 * alguien ya tiene otra instancia de Chrome con depuración abierta.
 *
 * @returns {Promise<number>} El puerto asignado.
 */
async function arrancarChrome() {
  navegador = spawn(chrome, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${perfil}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,900',
    'about:blank',
  ], { stdio: 'ignore' });

  const ficheroPuerto = join(perfil, 'DevToolsActivePort');
  for (let i = 0; i < CANDIDATOS; i += 1) {
    if (existsSync(ficheroPuerto)) {
      const puerto = Number(readFileSync(ficheroPuerto, 'utf8').split('\n')[0]);
      if (puerto) return puerto;
    }
    await dormir(ESPERA_MS);
  }
  throw new Error('Chrome no abrió el puerto de depuración');
}

/* ==========================================================================
   3. CONEXIÓN
   ========================================================================== */

/** @returns {Promise<string>} La URL de WebSocket de la pestaña abierta. */
async function urlDePestana(puerto) {
  for (let i = 0; i < CANDIDATOS; i += 1) {
    try {
      const respuesta = await fetch(`http://127.0.0.1:${puerto}/json/list`);
      const pestanas = await respuesta.json();
      const pagina = pestanas.find((p) => p.type === 'page');
      if (pagina) return pagina.webSocketDebuggerUrl;
    } catch {
      // Todavía no responde.
    }
    await dormir(ESPERA_MS);
  }
  throw new Error('no se encontró ninguna pestaña de Chrome');
}

const puertoDepuracion = await arrancarChrome();
const socket = new WebSocket(await urlDePestana(puertoDepuracion));
await new Promise((r) => { socket.onopen = r; });

let siguienteId = 0;
const pendientes = new Map();
const consola = [];

socket.onmessage = (evento) => {
  const mensaje = JSON.parse(evento.data);
  if (mensaje.id && pendientes.has(mensaje.id)) {
    pendientes.get(mensaje.id)(mensaje);
    pendientes.delete(mensaje.id);
  }
  if (mensaje.method === 'Log.entryAdded' && mensaje.params.entry.level === 'error') {
    consola.push(mensaje.params.entry.text);
  }
  if (mensaje.method === 'Runtime.exceptionThrown') {
    consola.push(mensaje.params.exceptionDetails.exception?.description || 'excepción');
  }
};

/**
 * Envía un comando de depuración y espera su respuesta.
 *
 * @param {string} metodo
 * @param {object} [parametros]
 * @returns {Promise<object>}
 */
function enviar(metodo, parametros = {}) {
  siguienteId += 1;
  const id = siguienteId;
  socket.send(JSON.stringify({ id, method: metodo, params: parametros }));
  return new Promise((r) => pendientes.set(id, r));
}

/**
 * Evalúa una expresión en la página y devuelve su valor.
 *
 * @param {string} expresion
 * @returns {Promise<*>}
 */
async function evaluar(expresion) {
  const respuesta = await enviar('Runtime.evaluate', {
    expression: expresion,
    returnByValue: true,
    awaitPromise: true,
  });
  if (respuesta.result?.exceptionDetails) {
    throw new Error(respuesta.result.exceptionDetails.exception?.description || 'error');
  }
  return respuesta.result?.result?.value;
}

await enviar('Page.enable');
await enviar('Runtime.enable');
await enviar('Log.enable');

/* ==========================================================================
   4. UTILIDADES DE RECORRIDO
   ========================================================================== */

let fallos = 0;

/**
 * @param {string} etiqueta
 * @param {boolean} ok
 * @param {string} [detalle]
 */
function comprobar(etiqueta, ok, detalle = '') {
  if (!ok) fallos += 1;
  console.log(`  ${ok ? 'OK   ' : 'FALLO'} ${etiqueta}${detalle ? ` — ${detalle}` : ''}`);
}

/** Cambia el hash y espera al repintado de la vista. */
async function irA(ruta) {
  await evaluar(`window.location.hash = ${JSON.stringify(ruta)}`);
  await dormir(700);
}

/**
 * Espera a que una expresión sea verdadera, en vez de fijar un tiempo.
 *
 * Con esperas fijas la comprobación depende de la máquina: lo que tarda 300 ms
 * en un portátil rápido tarda 900 ms en uno viejo, y el fallo se reporta donde
 * no está.
 *
 * @param {string} expresion
 * @param {number} [segundos]
 * @returns {Promise<boolean>}
 */
async function esperarA(expresion, segundos = 6) {
  const limite = Date.now() + segundos * 1000;
  while (Date.now() < limite) {
    if (await evaluar(`Boolean(${expresion})`)) return true;
    await dormir(100);
  }
  return false;
}

/**
 * Recarga de verdad el documento.
 *
 * Ir a una URL que solo cambia el hash NO recarga: el navegador resuelve la
 * ruta y listo. Una comprobación de "qué pasa al recargar" hecha así no prueba
 * nada, porque la partida sigue en memoria.
 *
 * @param {string} url
 */
async function recargarEn(url) {
  await enviar('Page.navigate', { url: 'about:blank' });
  await dormir(200);
  await enviar('Page.navigate', { url });
  await dormir(1500);
}

/**
 * Juega un Memory pulsando cartas de dos en dos hasta agotar el tablero.
 *
 * Da igual si cada pareja acierta o falla: lo que se comprueba es que el tablero
 * se puede terminar, que es lo que un alumno hace con la mano.
 */
async function jugarMemory() {
  await evaluar(`(async () => {
    const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
    while (document.querySelector('.carta-memory--vista-previa')) await dormir(100);
    for (let intento = 0; intento < 40; intento += 1) {
      const cartas = [...document.querySelectorAll('.carta-memory:not([disabled])')];
      if (cartas.length < 2) break;
      const primeraId = cartas[0].dataset.carta;
      const separador = primeraId.lastIndexOf(':');
      const idPareja = primeraId.slice(0, separador);
      const lado = primeraId.slice(separador + 1);
      const segundaId = idPareja + ':' + (lado === 'izquierda' ? 'derecha' : 'izquierda');
      cartas[0].click();
      await dormir(40);
      [...document.querySelectorAll('.carta-memory')]
        .find((carta) => carta.dataset.carta === segundaId)?.click();
      await dormir(600);
    }
    return true;
  })()`);
  return esperarA(`document.body.textContent.includes('Ver resultado')`);
}

// En las migas el último paso no es un enlace: es un <span class="migas__actual">
// con `aria-current="page"`, porque no se enlaza a la página en la que se está.
const MIGAS = '[...document.querySelectorAll(".migas__elemento")]'
  + '.map((e) => e.textContent.replace(/\\s+/g, " ").trim())';

const TITULO_UNIDAD = 'Clasificación de emergencias';

/* ==========================================================================
   5. EL RECORRIDO
   ========================================================================== */

arrancarServidor();

/** Espera a que el servidor de desarrollo responda. */
async function esperarAServidor() {
  for (let i = 0; i < CANDIDATOS; i += 1) {
    try {
      const respuesta = await fetch(`${BASE}/`);
      if (respuesta.ok) return;
    } catch {
      // Todavía no está levantado.
    }
    await dormir(ESPERA_MS);
  }
  throw new Error(`el servidor no respondió en ${BASE}`);
}

await esperarAServidor();
// Se arranca desde cero: el perfil de Chrome conserva el `localStorage` entre
// ejecuciones, y sin limpiarlo la barra global ya no empieza a 0 %.
await recargarEn(`${BASE}/`);
await evaluar('localStorage.clear()');
await recargarEn(`${BASE}/`);

console.log('\n== Portada ==');
{
  const d = JSON.parse(await evaluar(`JSON.stringify({
    h1: document.querySelector('.principal__vista h1')?.textContent,
    escapado: document.body.textContent.includes('[object'),
    unidades: document.querySelectorAll('.tematicas .tarjeta-tematica').length,
    migas: document.querySelectorAll('.migas').length,
    valor: document.querySelector('.cabecera__progreso [role="progressbar"]')
      ?.getAttribute('aria-valuenow'),
    ancho: document.querySelector('.cabecera__progreso .progreso__relleno')?.style.width
  })`));
  comprobar('h1 de portada', d.h1 === 'Escoge una unidad temática', d.h1);
  comprobar('ninguna vista escribe un nodo como texto', !d.escapado);
  comprobar('3 tarjetas de unidad', d.unidades === 3, `${d.unidades}`);
  comprobar('la portada no muestra migas', d.migas === 0, `${d.migas}`);
  comprobar('barra global a 0 %', d.valor === '0' && d.ancho === '0%', `${d.valor} / ${d.ancho}`);
}

console.log('\n== Unidad ==');
await irA('#/unidad/clasificacion');
{
  const d = JSON.parse(await evaluar(`JSON.stringify({
    h1: document.querySelector('.principal__vista h1')?.textContent,
    juegos: document.querySelectorAll('.juegos .tarjeta-juego').length,
    pendientes: document.querySelectorAll('.juegos .insignia--neutro').length,
    migas: ${MIGAS},
    enlaces: [...document.querySelectorAll('.juegos a[href^="#/juego/"]')]
      .map((a) => a.getAttribute('href'))
  })`));
  comprobar('h1 de unidad', d.h1 === TITULO_UNIDAD, d.h1);
  comprobar('3 tarjetas de juego', d.juegos === 3, `${d.juegos}`);
  comprobar('las tres empiezan sin superar', d.pendientes === 3, `${d.pendientes}`);
  comprobar('migas: Inicio > unidad', d.migas.length === 2 && d.migas[0] === 'Inicio', d.migas.join(' > '));
  comprobar('los 3 enlaces apuntan a #/juego/', d.enlaces.length === 3, d.enlaces.join(' '));
}

console.log('\n== Memory ==');
await irA('#/juego/clasificacion/memory');
{
  const cartas = await evaluar(`document.querySelectorAll('.carta-memory').length`);
  const cartasEnPrevia = await evaluar(`document.querySelectorAll('.carta-memory--vista-previa').length`);
  const ordenAntes = await evaluar(`[...document.querySelectorAll('.carta-memory')]
    .map((carta) => carta.dataset.carta).join('|')`);
  comprobar('el tablero se pinta', cartas > 0, `${cartas} cartas`);
  comprobar('las cartas empiezan boca arriba', cartasEnPrevia === cartas, `${cartasEnPrevia}/${cartas}`);
  await evaluar(`document.querySelector('.carta-memory')?.click()`);
  comprobar('no se puede seleccionar durante la presentación',
    await evaluar(`document.querySelectorAll('.carta-memory--volteada').length`) === 0);
  comprobar('el orden se mantiene al repintar',
    await evaluar(`[...document.querySelectorAll('.carta-memory')]
      .map((carta) => carta.dataset.carta).join('|')`) === ordenAntes);
  comprobar('las cartas cuelgan de la rejilla',
    await evaluar(`document.querySelectorAll('.rejilla-memory .carta-memory').length`) === cartas);
  comprobar('el tablero llega a completarse', await jugarMemory());
  const panel = await evaluar(`document.querySelector('.caja-error--correcto')?.textContent || ''`);
  comprobar('el panel final resume la partida', /parejas correctas/.test(panel), panel.slice(0, 60));
}

console.log('\n== Sprint ==');
await irA('#/juego/riesgos/sprint');
{
  const d = JSON.parse(await evaluar(`JSON.stringify({
    enunciado: document.querySelector('.enunciado__texto')?.textContent || '',
    opciones: document.querySelectorAll('.opcion-respuesta').length,
    cronometro: document.querySelector('.cronometro__cifras strong')?.textContent,
    marcador: document.querySelector('.marcador-motor')?.textContent || ''
  })`));
  comprobar('el enunciado se pinta', d.enunciado.length > 20, d.enunciado.slice(0, 60));
  comprobar('el enunciado no deja marcadores sin resolver',
    !d.enunciado.includes('{'), d.enunciado.slice(0, 60));
  comprobar('el cronómetro tiene cifras', /^\d+:\d\d$/.test(String(d.cronometro)), String(d.cronometro));
  comprobar('el marcador enseña aciertos y fallos',
    /Aciertos/.test(d.marcador) && /Fallos/.test(d.marcador));

  // El número de opciones NO se comprueba aquí a propósito: el mazo se baraja,
  // así que la misma prueba daría un resultado distinto cada vez y la puerta
  // fallaría de forma intermitente sin que nada haya cambiado. Si hay suficientes
  // distractores es una cuestión de contenido, y eso lo mide `npm test` sobre
  // un mazo construido con semilla fija, que siempre da lo mismo.

  const r = JSON.parse(await evaluar(`(async () => {
    const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
    const antes = document.querySelector('.cronometro__cifras strong')?.textContent;
    await dormir(1200);
    const despues = document.querySelector('.cronometro__cifras strong')?.textContent;
    document.querySelector('.opcion-respuesta')?.click();
    await dormir(300);
    return JSON.stringify({
      corre: antes !== despues,
      aviso: document.querySelector('[role="alert"]')?.textContent?.trim().slice(0, 60) || null,
      bloqueadas: [...document.querySelectorAll('.opcion-respuesta')].every((o) => o.disabled),
      continuar: [...document.querySelectorAll('.vista-acciones .boton')]
        .some((b) => /siguiente|continuar/i.test(b.textContent))
    });
  })()`));
  comprobar('el cronómetro corre', r.corre === true);
  comprobar('tras responder no se puede volver a cambiar', r.bloqueadas === true);
  comprobar('la realimentación se anuncia con role="alert"', !!r.aviso, String(r.aviso));
  comprobar('se ofrece continuar', r.continuar === true);
}

console.log('\n== Escape Room ==');
await irA('#/juego/pictogramas/escape');
{
  const d = JSON.parse(await evaluar(`JSON.stringify({
    titulo: document.querySelector('.fase-escape__titulo')?.textContent,
    numero: document.querySelector('.fase-escape__numero')?.textContent,
    opciones: document.querySelectorAll('.opcion-respuesta').length,
    segmentos: document.querySelectorAll('.progreso__segmentos .progreso__segmento').length,
    maximo: document.querySelector('.progreso__segmentos')?.getAttribute('aria-valuemax')
  })`));
  comprobar('el escenario tiene título', !!d.titulo, d.titulo || '');
  comprobar('indica la fase 1', /Fase 1/.test(String(d.numero)), String(d.numero));
  comprobar('el progreso cuenta las 3 fases', d.segmentos === 3 && d.maximo === '3', `${d.segmentos} / ${d.maximo}`);
  comprobar('la fase ofrece acciones', d.opciones > 0, `${d.opciones}`);

  const recorrido = JSON.parse(await evaluar(`(async () => {
    const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
    const fases = [];
    for (let i = 0; i < 4; i += 1) {
      const actual = document.querySelector('.fase-escape__numero')?.textContent;
      if (actual) fases.push(actual);
      document.querySelector('.opcion-respuesta:not([disabled])')?.click();
      await dormir(250);
      const seguir = [...document.querySelectorAll('.vista-acciones .boton')]
        .find((b) => /continuar/i.test(b.textContent));
      if (!seguir) break;
      seguir.click();
      await dormir(400);
    }
    return JSON.stringify({
      fases,
      diario: document.querySelectorAll('.diario-bordo__linea').length
    });
  })()`));
  comprobar('se avanza de fase hasta el final', recorrido.fases.length === 3, recorrido.fases.join(', '));
  comprobar('el diario de bordo registra cada decisión', recorrido.diario === 3, `${recorrido.diario} líneas`);
}

console.log('\n== Navegar con la cabecera ==');
await irA('#/juego/clasificacion/escape');
{
  const d = JSON.parse(await evaluar(`JSON.stringify({
    migas: ${MIGAS},
    cabecera: !!document.querySelector('.cabecera__marca'),
    relleno: document.querySelector('.cabecera__progreso .progreso__relleno')?.style.width
  })`));
  comprobar('las migas de una partida tienen 3 niveles', d.migas.length === 3, d.migas.join(' > '));
  comprobar('la cabecera sobrevive a la navegación', d.cabecera === true);
  comprobar('el relleno de progreso tiene ancho', /%$/.test(String(d.relleno)), String(d.relleno));

  await evaluar(`[...document.querySelectorAll('.cabecera__enlace')]
    .find((a) => a.textContent.includes('Mi progreso')).click()`);
  await dormir(700);
  const d2 = JSON.parse(await evaluar(`JSON.stringify({
    h1: document.querySelector('.principal__vista h1')?.textContent,
    migas: ${MIGAS},
    activo: document.querySelector('.cabecera__enlace[aria-current="page"]')?.textContent.trim()
  })`));
  comprobar('vuelve a Mi progreso con un clic real', d2.h1 === 'Mi progreso', d2.h1);
  comprobar('las migas se repintan', d2.migas.length === 2, d2.migas.join(' > '));
  comprobar('aria-current señala el enlace activo',
    String(d2.activo).includes('Mi progreso'), String(d2.activo));
}

console.log('\n== Rutas que no existen ==');
for (const ruta of ['#/juego/inventada/memory', '#/juego/clasificacion/inventado']) {
  await irA(ruta);
  const h1 = await evaluar(`document.querySelector('.principal__vista h1')?.textContent || ''`);
  comprobar(`${ruta} avisa de que no existe`, h1.includes('No encontramos'), h1);
}

console.log('\n== Recarga directa sobre #/resultado ==');
await recargarEn(`${BASE}/#/resultado/clasificacion/memory`);
{
  const d = JSON.parse(await evaluar(`JSON.stringify({
    hash: location.hash,
    h1: document.querySelector('.principal__vista h1')?.textContent || ''
  })`));
  comprobar('aterriza en la unidad en vez de inventar un resultado',
    d.hash === '#/unidad/clasificacion' && d.h1 === TITULO_UNIDAD, `${d.hash} / ${d.h1}`);
}

console.log('\n== El progreso se guarda ==');
{
  await irA('#/juego/riesgos/memory');
  comprobar('una partida completa llega a su panel final', await jugarMemory());

  await irA('#/resultado/riesgos/memory');
  await dormir(600);
  const d = JSON.parse(await evaluar(`JSON.stringify({
    h1: document.querySelector('.principal__vista h1')?.textContent || '',
    guardado: (localStorage.getItem('escena-segura:v1:estado') || '').length
  })`));
  comprobar('la pantalla de resultado se monta', /completada|terminada/.test(d.h1), d.h1);
  comprobar('el progreso queda en localStorage', d.guardado > 0, `${d.guardado} bytes`);

  // El repaso se lee aquí mismo, con la partida todavía en memoria. En la ruta
  // `#/repaso` se vuelve a comprobar más abajo, ya con la página recargada.
  const enResultado = JSON.parse(await evaluar(`JSON.stringify({
    pares: document.querySelectorAll('.repaso .repaso__elemento').length,
    conExplicacion: document.querySelectorAll('.repaso__explicacion').length,
    cartas: document.querySelectorAll('.repaso__carta').length
  })`));
  comprobar('el resultado lista los pares de la partida', enResultado.pares > 0, `${enResultado.pares} pares`);
  comprobar('cada par enseña sus dos cartas y su explicación',
    enResultado.cartas === enResultado.pares * 2 && enResultado.conExplicacion === enResultado.pares,
    `${enResultado.cartas} cartas y ${enResultado.conExplicacion} explicaciones / ${enResultado.pares} pares`);

  // Con recargar NO se ve, y es lo correcto: el resumen necesita la partida en
  // memoria. El repaso, en cambio, sale de `localStorage` y por eso se comprueba
  // en su propia ruta, más abajo, con la página recién cargada.
  await irA('#/');
  const barra = await evaluar(
    `document.querySelector('.cabecera__progreso [role="progressbar"]')?.getAttribute('aria-valuenow')`);
  comprobar('la barra global sube al volver a la portada', Number(barra) > 0, `${barra} %`);

  await irA('#/unidad/riesgos');
  const texto = await evaluar(`document.querySelector('.principal__vista').textContent`);
  comprobar('la unidad muestra la medalla ganada', /Medalla/.test(texto),
    (texto.match(/Medalla \w+/) || ['sin medalla'])[0]);
  comprobar('la tarjeta del juego queda como superada', /Superado/.test(texto));

  await recargarEn(`${BASE}/#/unidad/riesgos`);
  const tras = await evaluar(`document.querySelector('.principal__vista').textContent`);
  comprobar('el progreso sobrevive a la recarga', /Superado/.test(tras));
}

console.log('\n== El repaso guardado ==');
{
  // El repaso tiene que existir en DOS sitios: en la pantalla de resultado, que
  // es donde se lee nada más terminar, y en su propia ruta, que es la que
  // sobrevive a cerrar el navegador. La segunda es la que no se puede comprobar
  // con `npm test`, porque pasa por LocalStorage y por el enrutador.

  // Recargar en la ruta del repaso es la prueba que de verdad importa: si sale
  // de la partida en memoria, al recargar se pierde.
  await recargarEn(`${BASE}/#/repaso/riesgos/memory`);
  const enRuta = JSON.parse(await evaluar(`JSON.stringify({
    h1: document.querySelector('.principal__vista h1')?.textContent || '',
    pares: document.querySelectorAll('.repaso .repaso__elemento').length,
    repeticion: (document.querySelector('.principal__vista').textContent.match(/número/g) || []).length
  })`));
  comprobar('la ruta del repaso se monta al recargar', /Repaso/.test(enRuta.h1), enRuta.h1);
  comprobar('el repaso sigue ahí tras recargar', enRuta.pares > 0, `${enRuta.pares} pares`);

  const pares = JSON.parse(await evaluar(`JSON.stringify({
    conExplicacion: document.querySelectorAll('.repaso__explicacion').length,
    conFlecha: document.querySelectorAll('.repaso__flecha').length,
    cartas: document.querySelectorAll('.repaso__carta').length
  })`));
  comprobar('cada par enseña sus dos cartas', pares.cartas === enRuta.pares * 2,
    `${pares.cartas} cartas / ${enRuta.pares} pares`);
  comprobar('cada par lleva flecha y explicación', pares.conFlecha === enRuta.pares
    && pares.conExplicacion === enRuta.pares,
    `${pares.conFlecha} flechas y ${pares.conExplicacion} explicaciones / ${enRuta.pares} pares`);

  // Un repaso que se puede volver a leer no sirve si no dice qué se fallen.
  await irA('#/repaso/riesgos/sprint');
  await dormir(400);
  const sinJuego = JSON.parse(await evaluar(`JSON.stringify({
    hash: location.hash,
    texto: document.querySelector('.principal__vista h1')?.textContent || ''
  })`));
  comprobar('un repaso inexistente no inventa una pantalla', /Riesgos/.test(sinJuego.texto),
    `${sinJuego.hash} / ${sinJuego.texto}`);

  await irA('#/unidad/riesgos');
  const enlace = await evaluar(`(() => {
    const nodo = document.querySelector('a[href="#/repaso/riesgos/memory"]');
    // closest() incluye el propio elemento, así que hay que mirar el padre:
    // preguntar si el enlace está dentro de otro enlace sería siempre "sí".
    return { existe: !!nodo, dentroDeEnlace: !!nodo?.parentElement?.closest('a') };
  })()`);
  comprobar('la unidad ofrece el repaso ya jugado', enlace.existe === true);
  comprobar('el enlace del repaso no está dentro de otro enlace', enlace.dentroDeEnlace === false);
}

console.log('\n== Teclado ==');
{
  const d = JSON.parse(await evaluar(`JSON.stringify({
    salto: !!document.querySelector('.enlace-saltar'),
    destino: document.querySelector('.enlace-saltar')?.getAttribute('href'),
    existeDestino: !!document.getElementById('contenido-principal')
  })`));
  comprobar('hay enlace de salto', d.salto === true);
  comprobar('el enlace de salto apunta al contenido',
    d.destino === '#contenido-principal', String(d.destino));
  comprobar('el destino del enlace existe', d.existeDestino === true);

  await irA('#/unidad/riesgos');
  const enfocado = await evaluar(`(() => {
    const nodo = document.querySelector('.juegos a[href^="#/juego/"]');
    nodo?.focus();
    return document.activeElement === nodo;
  })()`);
  comprobar('el menú de juegos es enfocable', enfocado === true);
  const tabulables = await evaluar(
    `document.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])').length`);
  comprobar('la vista tiene elementos tabulables', tabulables > 3, `${tabulables}`);
}

console.log('\n== Accesibilidad del contenido ==');
await irA('#/juego/pictogramas/memory');
{
  const d = JSON.parse(await evaluar(`JSON.stringify({
    iconos: [...document.querySelectorAll('svg')]
      .filter((s) => s.getAttribute('aria-hidden') !== 'true').length,
    sinAlt: [...document.querySelectorAll('img')].filter((i) => !i.getAttribute('alt')).length,
    altVacio: [...document.querySelectorAll('img')].filter((i) => i.getAttribute('alt') === '').length,
    imagenes: document.querySelectorAll('img').length,
    botones: [...document.querySelectorAll('button')]
      .filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label')).length
  })`));
  comprobar('todos los iconos son aria-hidden', d.iconos === 0, `${d.iconos} sin marcar`);
  comprobar('todas las imágenes llevan alt', d.sinAlt === 0, `${d.sinAlt} de ${d.imagenes}`);
  comprobar('las imágenes informativas no tienen alt vacío', d.altVacio === 0, `${d.altVacio}`);
  comprobar('ningún botón se queda sin nombre accesible', d.botones === 0, `${d.botones}`);
}

console.log('\n== El servidor no sirve el material de trabajo ==');
for (const ruta of [
  '/_privado-NoemiCelaya/documentos-base-escena-segura/Riesgos.docx',
  '/_privado-NoemiCelaya/',
  '/preguntas-y-respuestas/pictogramas-memory.pdf',
  '/preguntas-y-respuestas/',
  '/.gitignore',
]) {
  const estado = await (await fetch(`${BASE}${ruta}`)).status;
  comprobar(`${ruta} responde 403`, estado === 403, `${estado}`);
}

console.log('\n== Consola del navegador ==');
{
  // Un 404 de favicon no dice nada del código.
  const ruido = consola.filter((t) => !/favicon|Failed to load resource/i.test(t));
  comprobar('sin errores en consola', ruido.length === 0, ruido.slice(0, 3).join(' | '));
}

console.log('\n== Resumen ==');
console.log('Los avisos de contenido los da `npm test`, no esta prueba: ver `agents.md` §7.2.');
if (fallos === 0) {
  console.log('El recorrido en navegador ha pasado todas las comprobaciones.');
} else {
  console.error(`${fallos} comprobación(es) han fallado.`);
  process.exitCode = 1;
}

/* ==========================================================================
   6. CIERRE
   ========================================================================== */

socket.close();
navegador?.kill();
servidor?.kill();
try {
  rmSync(perfil, { recursive: true, force: true });
} catch {
  // El perfil temporal se limpia solo; si no, da igual.
}
