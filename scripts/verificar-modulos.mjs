/**
 * verificar-modulos.mjs — Comprobación de sintaxis de todos los módulos.
 *
 * Se ejecuta con `npm run check`, sin dependencias externas y sin servidor.
 *
 * Por qué existe: el proyecto usa ES Modules nativos, así que un error de
 * sintaxis no lo detecta el editor si el fichero no está abierto, y el navegador
 * solo lo reporta en consola. Este script convierte esos errores en un fallo
 * visible ANTES de abrir la aplicación en clase.
 *
 * Usa `node --check` sobre cada fichero, que valida la gramática sin ejecutar
 * el módulo (importante: los módulos de UI tocan `document` y no pueden
 * importarse fuera del navegador).
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));

/**
 * Lista recursivamente los ficheros con una extensión dada, ignorando las
 * carpetas que no contienen código desplegable.
 *
 * @param {string} carpeta
 * @param {string[]} extensiones
 * @param {string[]} [ignorar]
 * @returns {string[]} Rutas absolutas.
 */
function listar(carpeta, extensiones, ignorar = []) {
  const encontradas = [];

  let entradas;
  try {
    entradas = readdirSync(carpeta);
  } catch {
    return encontradas; // La carpeta aún no existe: no es un error.
  }

  for (const entrada of entradas) {
    if (ignorar.includes(entrada)) continue;
    if (entrada.startsWith('.')) continue;

    const ruta = join(carpeta, entrada);
    if (statSync(ruta).isDirectory()) {
      encontradas.push(...listar(ruta, extensiones, ignorar));
    } else if (extensiones.some((extension) => entrada.endsWith(extension))) {
      encontradas.push(ruta);
    }
  }

  return encontradas;
}

/** Todos los módulos que se comprueban: `src/` y los scripts. */
const ficheros = [
  ...listar(join(RAIZ, 'src'), ['.js', '.mjs']),
  ...listar(RAIZ, ['.mjs']).filter((ruta) => !ruta.includes('src')),
];

/* =========================================================================
   1. SINTAXIS
   ========================================================================= */

console.log('Sintaxis:');

let fallos = 0;

for (const fichero of ficheros) {
  const relativo = relative(RAIZ, fichero);
  try {
    execFileSync(process.execPath, ['--check', fichero], { stdio: 'pipe' });
    console.log(`  OK   ${relativo}`);
  } catch (error) {
    fallos += 1;
    console.error(`  FALLO ${relativo}`);
    const salida = error.stderr ? error.stderr.toString() : error.message;
    console.error(
      salida
        .split('\n')
        .slice(0, 6)
        .map((linea) => `       ${linea}`)
        .join('\n')
    );
  }
}

/* =========================================================================
   2. IMPORTACIONES
   ========================================================================= */

/**
 * Nombres que un modulo exporta.
 *
 * No se usa `import()` a proposito: los modulos de `src/ui/` tocan `document`
 * al cargarse y fallarian en Node. Leer el texto del fichero es suficiente para
 * saber que exporta, y no ejecuta nada.
 *
 * @param {string} codigo
 * @returns {Set<string>}
 */
function exportacionesDe(codigo) {
  const nombres = new Set();

  for (const c of codigo.matchAll(/^export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    nombres.add(c[1]);
  }

  for (const c of codigo.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const parte of c[1].split(',')) {
      const limpio = parte.trim();
      if (!limpio) continue;
      const alias = limpio.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
      nombres.add(alias ? alias[1] : limpio);
    }
  }

  if (/^export\s+default\b/m.test(codigo)) nombres.add('default');

  return nombres;
}

/** Importaciones de un modulo: `[{ modulo, nombres }]`. */
function importacionesDe(codigo) {
  const resultado = [];

  for (const c of codigo.matchAll(/import\s+(?:([A-Za-z_$][\w$]*)\s*,\s*)?(?:\{([^}]*)\})?\s*from\s*['"]([^'"]+)['"]/g)) {
    const nombres = new Set();
    if (c[1]) nombres.add('default');
    for (const parte of (c[2] || '').split(',')) {
      const limpio = parte.trim();
      if (!limpio) continue;
      const alias = limpio.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
      nombres.add(alias ? alias[1] : limpio);
    }
    resultado.push({ modulo: c[3], nombres });
  }

  return resultado;
}

console.log('\nImportaciones:');

/** Cache de exportaciones por ruta absoluta. */
const exportaciones = new Map();
for (const fichero of ficheros) {
  exportaciones.set(fichero, exportacionesDe(readFileSync(fichero, 'utf8')));
}

let fallosImportacion = 0;

for (const fichero of ficheros) {
  const codigo = readFileSync(fichero, 'utf8');
  const relativo = relative(RAIZ, fichero);

  for (const { modulo, nombres } of importacionesDe(codigo)) {
    if (!modulo.startsWith('.')) continue;

    const destino = resolve(dirname(fichero), modulo);
    if (!existsSync(destino)) {
      fallosImportacion += 1;
      console.error(`  FALLO ${relativo}: no existe el modulo "${modulo}"`);
      continue;
    }

    const disponibles = exportaciones.get(destino);
    if (!disponibles) continue;

    for (const nombre of nombres) {
      if (disponibles.has(nombre)) continue;
      fallosImportacion += 1;
      console.error(`  FALLO ${relativo}: importa "${nombre}" de "${modulo}", que no lo exporta.`);
    }
  }
}

if (fallosImportacion === 0) {
  console.log(`  OK   las importaciones de ${ficheros.length} ficheros resuelven`);
}

fallos += fallosImportacion;

console.log('');
if (fallos === 0) {
  console.log(`Sintaxis e importaciones correctas en ${ficheros.length} ficheros.`);
} else {
  console.error(`${fallos} problema(s) encontrado(s).`);
  process.exitCode = 1;
}
