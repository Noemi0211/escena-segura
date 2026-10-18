import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CREDITOS, LICENCIA, NOMBRES_JUEGOS } from '../src/config.js';
import { unidades } from '../src/data/index.js';
import {
  construirEscenarios,
  construirPreguntaSprint,
  construirVariantesMemory,
} from '../src/utils/generadores.js';
import { conSemilla } from '../src/utils/aleatorio.js';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SALIDA = join(RAIZ, 'preguntas-y-respuestas');
const SEMILLA = 1701;
const RUTAS_CHROME = [
  process.env.CHROME_PATH,
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const chrome = RUTAS_CHROME.find((ruta) => existsSync(ruta));
if (!chrome) {
  throw new Error('No se encuentra Chrome. Indica su ruta con CHROME_PATH.');
}

const escapar = (valor) => String(valor ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function imagenData(ruta) {
  const absoluta = resolve(RAIZ, ruta);
  if (!absoluta.startsWith(`${RAIZ}${sep}`)) {
    throw new Error(`La imagen está fuera del proyecto: ${ruta}`);
  }
  const tipo = extname(absoluta).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${tipo};base64,${readFileSync(absoluta).toString('base64')}`;
}

function contenidoHTML(contenido, comoImagen = false) {
  if (!contenido) return '<span class="vacio">Sin contenido</span>';
  if (comoImagen || contenido.tipo === 'imagen') {
    return `<img class="imagen" src="${imagenData(contenido.valor)}" alt="${escapar(contenido.alt)}">`;
  }
  return escapar(contenido.valor);
}

function documento(titulo, subtitulo, secciones) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapar(titulo)}</title>
  <style>
    @page { size: A4; margin: 15mm 14mm 17mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #20332f; font: 10pt/1.45 Arial, sans-serif; }
    header { padding: 15px 18px; color: #fff; background: #153d37; border-bottom: 5px solid #70b6a4; }
    header p { margin: 0; }
    .marca { color: #b8e0d5; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 7px 0 3px; font-size: 22pt; }
    .subtitulo { color: #e0eee9; font-size: 11pt; }
    main { padding-top: 12px; }
    h2 { margin: 15px 0 8px; color: #175b4d; font-size: 14pt; break-after: avoid; }
    h3 { margin: 0 0 6px; font-size: 11pt; }
    p { margin: 4px 0; }
    .nota { margin: 8px 0 12px; color: #536761; font-size: 9pt; }
    .pregunta, .pareja, .fase { margin: 0 0 9px; padding: 9px 11px; border: 1px solid #cfdbd5; border-left: 3px solid #70a997; break-inside: avoid; }
    .numero { color: #176452; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
    .enunciado { margin: 4px 0 7px; font-size: 10.5pt; font-weight: 700; }
    .opcion { margin: 4px 0; padding: 5px 7px; border-left: 2px solid #bbc9c3; background: #f4f7f5; }
    .opcion-correcta { border-color: #238052; background: #eaf5ee; }
    .marca-correcta { color: #17643d; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
    .explicacion { margin-top: 6px; color: #344940; }
    .pareja-grid { display: grid; grid-template-columns: 1fr 24px 1fr; align-items: center; gap: 8px; }
    .lado { min-width: 0; }
    .etiqueta { display: block; margin-bottom: 3px; color: #536761; font-size: 8pt; font-weight: 700; text-transform: uppercase; }
    .flecha { color: #176452; font-size: 16pt; font-weight: 700; text-align: center; }
    .imagen { display: block; width: 64px; height: 64px; object-fit: contain; }
    .situacion { margin: 5px 0; color: #40564e; }
    .retro { margin-top: 5px; padding-left: 8px; border-left: 2px solid #c4d5cd; font-size: 9pt; }
    footer { margin-top: 16px; padding-top: 7px; border-top: 1px solid #cfdbd5; color: #536761; font-size: 8pt; }
    .seccion { break-before: page; }
    .seccion:first-child { break-before: auto; }
  </style>
</head>
<body>
  <header>
    <p class="marca">Escena Segura · Banco completo de actividades</p>
    <h1>${escapar(titulo)}</h1>
    <p class="subtitulo">${escapar(subtitulo)}</p>
  </header>
  <main>${secciones}</main>
  <footer>${escapar(CREDITOS)} · ${escapar(LICENCIA)}</footer>
</body>
</html>`;
}

function generarMemory(unidad) {
  const variantes = construirVariantesMemory(unidad, SEMILLA);
  return variantes.map((variante, indice) => `
    <section class="seccion">
      <h2>${escapar(variante.titulo)}</h2>
      <p class="nota">Variante ${indice + 1} de ${variantes.length} · ${escapar(variante.instruccion)}</p>
      ${variante.pares.map((par, numero) => `
        <article class="pareja">
          <span class="numero">Pareja ${numero + 1}</span>
          <div class="pareja-grid">
            <div class="lado"><span class="etiqueta">${escapar(par.etiquetaIzquierda)}</span>${contenidoHTML(par.izquierda)}</div>
            <div class="flecha">↔</div>
            <div class="lado"><span class="etiqueta">${escapar(par.etiquetaDerecha)}</span>${contenidoHTML(par.derecha)}</div>
          </div>
          ${par.explicacion ? `<p class="explicacion"><strong>Explicación:</strong> ${escapar(par.explicacion)}</p>` : ''}
        </article>`).join('')}
    </section>`).join('');
}

function generarSprint(unidad) {
  return conSemilla(SEMILLA, () => unidad.sprint.plantillas.map((plantilla, indicePlantilla) => {
    const preguntas = unidad.casos
      .map((_, indiceCaso) => construirPreguntaSprint(unidad, plantilla, indiceCaso))
      .filter((pregunta) => pregunta.opciones.length > 0);
    return `
      <section class="seccion">
        <h2>${escapar(plantilla.enunciado.replace(/\s*«?\{.*$/, ''))}</h2>
        <p class="nota">Plantilla ${indicePlantilla + 1} de ${unidad.sprint.plantillas.length} · ${preguntas.length} preguntas</p>
        ${preguntas.map((pregunta, numero) => `
          <article class="pregunta">
            <span class="numero">Pregunta ${numero + 1}</span>
            <p class="enunciado">${escapar(pregunta.enunciado)}</p>
            ${pregunta.ilustracion ? `<div>${contenidoHTML(pregunta.ilustracion, true)}</div>` : ''}
            ${pregunta.pista ? `<p class="situacion"><strong>Contexto:</strong> ${escapar(pregunta.pista)}</p>` : ''}
            ${pregunta.opciones.map((opcion) => `
              <div class="opcion ${opcion.correcta ? 'opcion-correcta' : ''}">
                ${opcion.correcta ? '<span class="marca-correcta">Respuesta correcta · </span>' : ''}
                ${contenidoHTML(opcion.texto)}
              </div>`).join('')}
            ${pregunta.retroalimentacion.explicacion
              ? `<p class="explicacion"><strong>Explicación:</strong> ${escapar(pregunta.retroalimentacion.explicacion)}</p>`
              : ''}
          </article>`).join('')}
      </section>`;
  })).join('');
}

function generarEscape(unidad) {
  const { escenarios } = construirEscenarios(unidad);
  return escenarios.map((escenario) => `
    <section class="seccion">
      <h2>${escapar(escenario.titulo)}</h2>
      <p class="nota">${escapar(escenario.ambientacion || '')}</p>
      <p class="situacion"><strong>Briefing:</strong> ${escapar(escenario.briefing)}</p>
      ${escenario.fases.map((fase, indiceFase) => `
        <article class="fase">
          <span class="numero">Fase ${indiceFase + 1} · ${escapar(fase.titulo)}</span>
          <p class="enunciado">${escapar(fase.texto)}</p>
          ${fase.pista ? `<p class="situacion"><strong>Pista:</strong> ${escapar(fase.pista.valor ?? fase.pista)}</p>` : ''}
          ${fase.opciones.map((opcion, indiceOpcion) => `
            <div class="opcion ${opcion.correcta ? 'opcion-correcta' : ''}">
              <span class="etiqueta">${opcion.correcta ? 'Respuesta correcta' : `Opción ${indiceOpcion + 1}`}</span>
              ${escapar(opcion.texto)}
              ${opcion.retroalimentacion.breve ? `<p class="retro"><strong>Idea clave:</strong> ${escapar(opcion.retroalimentacion.breve)}</p>` : ''}
              ${opcion.retroalimentacion.explicacion ? `<p class="retro"><strong>Explicación:</strong> ${escapar(opcion.retroalimentacion.explicacion)}</p>` : ''}
              ${opcion.retroalimentacion.transferencia ? `<p class="retro"><strong>Transferencia:</strong> ${escapar(opcion.retroalimentacion.transferencia)}</p>` : ''}
            </div>`).join('')}
        </article>`).join('')}
    </section>`).join('');
}

function exportarPdf(nombre, html, temporal) {
  const rutaHtml = join(temporal, `${nombre}.html`);
  const rutaPdf = join(SALIDA, `${nombre}.pdf`);
  writeFileSync(rutaHtml, html, 'utf8');
  const resultado = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-pdf-header-footer',
    `--user-data-dir=${join(temporal, `perfil-${nombre}`)}`,
    `--print-to-pdf=${rutaPdf}`,
    pathToFileURL(rutaHtml).href,
  ], { encoding: 'utf8', timeout: 120000 });

  if (resultado.error || resultado.status !== 0 || !existsSync(rutaPdf)) {
    throw new Error(
      `No se pudo generar ${nombre}.pdf: ${resultado.error?.message || resultado.stderr || resultado.stdout || `código ${resultado.status}`}`
    );
  }
  console.log(`  OK  ${nombre}.pdf`);
}

mkdirSync(SALIDA, { recursive: true });
const temporal = mkdtempSync(join(tmpdir(), 'escena-segura-pdfs-'));
try {
  for (const unidad of unidades) {
    for (const juego of NOMBRES_JUEGOS) {
      const crearSecciones = {
        memory: generarMemory,
        sprint: generarSprint,
        escape: generarEscape,
      }[juego.id];
      const nombre = `${unidad.id}-${juego.id}`;
      const secciones = crearSecciones(unidad);
      const html = documento(
        unidad.nombre,
        juego.nombre,
        secciones || '<p>No hay contenido disponible.</p>'
      );
      exportarPdf(nombre, html, temporal);
    }
  }
} finally {
  rmSync(temporal, { recursive: true, force: true });
}

console.log(`PDFs guardados en ${SALIDA}`);