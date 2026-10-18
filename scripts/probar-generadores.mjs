/**
 * probar-generadores.mjs — Prueba de humo de la capa de datos.
 *
 * Se ejecuta con `npm test`. No es un framework de test: es la comprobación
 * mínima que demuestra que los DATOS de las tres unidades son utilizables por los
 * tres motores.
 *
 * Motivo de existir: los módulos de `src/data/` y `src/utils/` no tocan el DOM,
 * así que se pueden importar en Node. Eso permite comprobar en 2 segundos, y
 * no en mitad de una clase, cosas que un `node --check` no ve:
 *
 *   · que cada configuración de Memory resuelve pares de verdad;
 *   · que Sprint genera un mazo con las preguntas pedidas;
 *   · que los escenarios tienen siempre una única opción correcta;
 *   · que las referencias de los casos apuntan a catálogos existentes;
 *   · que SIN semilla las partidas salen distintas (regresión del bug de
 *     `conSemilla(undefined)`, que dejaba todo el juego amarroto a la semilla 0);
 *   · que CON semilla la partida es reproducible.
 *
 * Añadir aquí una comprobación es barato y protege a quien escriba contenido
 * nuevo más adelante.
 */

import {
  auditarTodasLasUnidades,
  listarUnidadesConResumen,
  obtenerUnidad,
  totalActividades,
} from '../src/data/index.js';
import {
  auditarUnidad,
  construirEscenarios,
  construirMazoSprint,
  construirPreguntaSprint,
  construirVariantesMemory,
} from '../src/utils/generadores.js';
import { barajar, conSemilla } from '../src/utils/aleatorio.js';

let fallos = 0;
let comprobaciones = 0;
let avisos = 0;

/**
 * Evalúa una condición y registra el resultado.
 *
 * @param {boolean} condicion
 * @param {string} descripcion
 * @param {string} [detalle]
 */
function comprobar(condicion, descripcion, detalle = '') {
  comprobaciones += 1;
  if (condicion) {
    console.log(`  OK    ${descripcion}`);
  } else {
    fallos += 1;
    console.error(`  FALLO ${descripcion}${detalle ? ` -> ${detalle}` : ''}`);
  }
}

/** Marcador de plantilla `{ruta}`. En contenido español, las llaves casi
 *  siempre son eso y nunca algo que deba mostrarse al alumno. */
const MARCADOR = /\{[^{}]*\}/;

/**
 * Registra un aviso que NO cuenta como fallo.
 *
 * Para lo que es una decisión de contenido y no un error: informa, pero no
 * bloquea la entrega. Un fallo aquí sería ruido que obliga a tocar código
 * correcto para callar a la herramienta.
 *
 * @param {string} descripcion
 * @param {string} [detalle]
 */
function avisar(descripcion, detalle = '') {
  avisos += 1;
  console.log(`  AVISO ${descripcion}${detalle ? ` -> ${detalle}` : ''}`);
}

const unidades = listarUnidadesConResumen();

console.log('\n== Integridad de los datos ==');
const problemas = auditarTodasLasUnidades();
comprobar(
  problemas.length === 0,
  `auditarTodasLasUnidades() sin problemas (${unidades.length} unidades)`,
  problemas.map((p) => `${p.unidad}: ${p.problema}`).join(' | ')
);
for (const problema of problemas) {
  console.error(`        ${problema.unidad}: ${problema.problema}`);
}

console.log('\n== Cobertura de actividades ==');
comprobar(unidades.length === 3, 'Hay 3 unidades temáticas registradas.', `hay ${unidades.length}`);
comprobar(totalActividades() === 9, 'Se anuncian 9 actividades (3 juegos x 3 unidades).');
for (const unidad of unidades) {
  const r = unidad.resumen;
  comprobar(
    r.casos > 0 && r.variantesMemory > 0 && r.plantillasSprint > 0 && r.escenarios > 0,
    `${unidad.nombre}: casos=${r.casos} memory=${r.variantesMemory} sprint=${r.plantillasSprint} escape=${r.escenarios}`
  );
}

console.log('\n== Memory: cada variante resuelve pares ==');
for (const unidad of unidades) {
  for (const variante of construirVariantesMemory(unidad, 7)) {
    comprobar(
      variante.pares.length > 0,
      `${unidad.id}/${variante.id}: ${variante.pares.length} pares`
    );
    const incompletos = variante.pares.filter(
      (par) => !par.etiquetaIzquierda || !par.etiquetaDerecha
    );
    comprobar(
      incompletos.length === 0,
      `${unidad.id}/${variante.id}: ninguna carta vacía`,
      `${incompletos.length} incompletas`
    );
  }
}

console.log('\n== Sprint: distractores de tipo de incidente relacionados ==');
{
  const unidad = obtenerUnidad('clasificacion');
  const plantilla = unidad.sprint.plantillas.find((t) => t.id === 'sprint-tipo');
  const preguntas = conSemilla(17, () =>
    unidad.casos.map((_, indice) => construirPreguntaSprint(unidad, plantilla, indice))
  );
  const fueraDeGrupo = preguntas.flatMap((pregunta) => {
    const idCaso = pregunta.id.split(':').slice(1).join(':');
    const caso = unidad.casos.find((elemento) => elemento.id === idCaso);
    return pregunta.opciones.filter((opcion) => !opcion.correcta && !unidad.casos.some(
      (candidato) => candidato.tipo === opcion.texto.valor
        && candidato.clasificacion.origen === caso.clasificacion.origen
    ));
  });
  comprobar(
    preguntas.every((pregunta) => pregunta.enunciado.startsWith('¿Qué tipo de incidente')),
    'clasificacion/sprint-tipo: el enunciado nombra el tipo de incidente'
  );
  comprobar(
    fueraDeGrupo.length === 0,
    'clasificacion/sprint-tipo: todos los distractores comparten el origen del caso',
    `${fueraDeGrupo.length} fuera de grupo`
  );
}

console.log('\n== Sprint: definición asociada al riesgo del caso ==');
{
  const unidad = obtenerUnidad('riesgos');
  const plantilla = unidad.sprint.plantillas.find((t) => t.id === 'sprint-definicion');
  const preguntas = conSemilla(17, () =>
    unidad.casos.map((_, indice) => construirPreguntaSprint(unidad, plantilla, indice))
  );
  const incorrectas = preguntas.filter((pregunta, indice) => {
    const idRiesgo = unidad.casos[indice].riesgo;
    const definicion = unidad.catalogos.riesgo.find((riesgo) => riesgo.id === idRiesgo)?.definicion;
    return pregunta.enunciado.includes('víctima')
      || pregunta.opciones.find((opcion) => opcion.correcta)?.texto.valor !== definicion;
  });
  comprobar(
    incorrectas.length === 0,
    'riesgos/sprint-definicion: la respuesta correcta define el riesgo del caso',
    `${incorrectas.length} preguntas incoherentes`
  );
}

console.log('\n== Sprint: mazo completo y con una sola correcta ==');
for (const unidad of unidades) {
  const declaradas = (unidad.sprint?.plantillas || []).length;
  const pedido = Math.min(10, declaradas * 2);
  const mazo = construirMazoSprint(unidad, pedido, 7);
  comprobar(
    mazo.preguntas.length > 0,
    `${unidad.id}: ${mazo.preguntas.length} preguntas generadas (petición ${pedido})`
  );

  const invalidas = mazo.preguntas.filter(
    (p) => p.opciones.filter((o) => o.correcta).length !== 1 || p.opciones.length < 2
  );
  comprobar(
    invalidas.length === 0,
    `${unidad.id}: cada pregunta tiene 1 correcta y >=2 opciones`,
    `${invalidas.length} inválidas`
  );

  // Una pregunta con pocas opciones se responde por descarte. No es un fallo del
  // generador: la causa es que el catálogo del que se sacan los distractores es
  // más pequeño que lo que la plantilla pide, o que la pregunta es de dos o tres
  // opciones a propósito.
  //
  // Por eso la comparación usa `opcionesMinimas` de la plantilla, y no un 3 fijo:
  // quien escribe el contenido declara ahí si dos opciones eran la pregunta que
  // quería, y el auditor lo respeta. Sin ese campo, el aviso se repite para un
  // catálogo que la fuente dice que tiene dos entradas (`agents.md` §7.4), y un
  // aviso que no se puede cerrar acaba ignorándose.
  const minimoDe = (pregunta) => {
    const plantilla = unidad.sprint.plantillas.find((t) => t.id === pregunta.id.split(':')[0]);
    return plantilla?.opcionesMinimas ?? 3;
  };

  const escasas = mazo.preguntas.filter((p) => p.opciones.length < minimoDe(p));
  if (escasas.length > 0) {
    const plantillasPorDefecto = [...new Set(escasas.map((p) => p.id.split(':')[0]))];
    const catalogos = plantillasPorDefecto
      .map((id) => (unidad.sprint.plantillas.find((t) => t.id === id) || {}).correcta?.catalogo)
      .filter(Boolean);
    avisar(
      `${unidad.id}: ${escasas.length} preguntas con menos opciones de las que piden`,
      `plantillas ${plantillasPorDefecto.join(', ')}; catálogos ${catalogos.join(', ')}`
    );
  }

  // El segundo umbral (4) es distinto del primero: no pregunta si la pregunta
  // tiene sentido, sino si el catálogo da para una elección de verdad. Se
  // respeta igual la declaración, porque a las 3 opciones de `origen` no hay
  // más entradas que añadir (§7.6).
  const cortas = mazo.preguntas.filter(
    (p) => p.opciones.length < 4 && minimoDe(p) >= 4
  );
  if (cortas.length > 0) {
    avisar(
      `${unidad.id}: ${cortas.length} preguntas con menos de 4 opciones`,
      'Con 3 opciones hay menos margen de error que con 4: se puede ampliar el catálogo.'
    );
  }

  // Se busca CUALQUIER `{...}` y no solo `{caso.}`: un marcador mal escrito con
  // otra ruta (`{unidad.catalogos.riesgo[0].nombre}`) se queda literal en la
  // pregunta que ve el alumnado, y el enunciado anterior no lo detectaba.
  const sinTexto = mazo.preguntas.filter(
    (p) => !p.enunciado || MARCADOR.test(p.enunciado) || MARCADOR.test(p.pista || '')
  );
  comprobar(
    sinTexto.length === 0,
    `${unidad.id}: ningún enunciado conserva una plantilla sin resolver`,
    sinTexto.map((p) => p.enunciado).join(' | ')
  );

  const sinRetro = mazo.preguntas.filter((p) => !p.retroalimentacion || !p.retroalimentacion.explicacion);
  comprobar(sinRetro.length === 0, `${unidad.id}: todas las preguntas traen explicación`);
}

console.log('\n== Escape Room: exactamente una opción correcta por fase ==');
for (const unidad of unidades) {
  const { escenarios, errores } = construirEscenarios(unidad);
  comprobar(errores.length === 0, `${unidad.id}: escenarios sin errores`, errores.join(' | '));

  for (const escenario of escenarios) {
    const fases = escenario.fases || [];
    comprobar(fases.length > 0, `${escenario.id}: ${fases.length} fases`);

    for (const fase of fases) {
      const correctas = (fase.opciones || []).filter((o) => o.correcta).length;
      comprobar(
        correctas === 1,
        `${escenario.id}/${fase.id}: una única opción correcta`,
        `hay ${correctas}`
      );
      comprobar(
        (fase.opciones || []).length >= 2,
        `${escenario.id}/${fase.id}: al menos 2 opciones`,
        `hay ${(fase.opciones || []).length}`
      );

      // Con 2 opciones la pregunta se responde por descarte: quien juega ya sabe
      // cuál es la correcta y la otra es, por definición, la incorrecta.
      //
      // Antes esto avisaba siempre, y el aviso se podía "arreglar" de dos
      // maneras: metiendo un distractor inventado, o ignorándolo. Con
      // `opcionesMinimas` en la fase, la intención la declara quien escribe el
      // contenido, que es quien sabe si dos opciones eran la pregunta que quería.
      // El valor ausente significa 3, que es el mínimo por defecto de una
      // pregunta de descarte.
      const minimo = fase.opcionesMinimas ?? 3;
      if ((fase.opciones || []).length < minimo) {
        avisar(
          `${escenario.id}/${fase.id}: ${(fase.opciones || []).length} opciones, se responde por descarte`,
          `Añade distractores, o baja 'opcionesMinimas' a ${(fase.opciones || []).length} si es lo que se quiere.`
        );
      }
    }
  }
}

console.log('\n== Aleatoriedad: sin semilla, con semilla ==');
const unidadPrueba = obtenerUnidad('pictogramas');
comprobar(Boolean(unidadPrueba), 'obtenerUnidad("pictogramas") devuelve la unidad');

const primera = construirMazoSprint(unidadPrueba, 10);
const segunda = construirMazoSprint(unidadPrueba, 10);
const distintas = JSON.stringify(primera.preguntas) !== JSON.stringify(segunda.preguntas);
comprobar(distintas, 'Dos mazos sin semilla son distintos (sin regresión de semilla fija)');

const conSemillaA = construirMazoSprint(unidadPrueba, 10, 12345);
const conSemillaB = construirMazoSprint(unidadPrueba, 10, 12345);
comprobar(
  JSON.stringify(conSemillaA.preguntas) === JSON.stringify(conSemillaB.preguntas),
  'Dos mazos con la MISMA semilla son idénticos (reproducibles)'
);
const conSemillaC = construirMazoSprint(unidadPrueba, 10, 999);
comprobar(
  JSON.stringify(conSemillaA.preguntas) !== JSON.stringify(conSemillaC.preguntas),
  'Dos mazos con semilla DISTINTA son distintos'
);

console.log('\n== Utilidades de aleatoriedad ==');
const elementos = Array.from({ length: 12 }, (_, i) => i);
const permutacion = barajar(elementos);
comprobar(
  permutacion.length === elementos.length && new Set(permutacion).size === elementos.length,
  'barajar() devuelve una permutación sin repetidos'
);
const barajada = barajar(elementos);
comprobar(
  JSON.stringify(permutacion) !== JSON.stringify(barajada),
  'barajar() produce ordenaciones distintas entre llamadas'
);

console.log('\n== El texto del alumnado está limpio ==');

/**
 * Palabras inglesas que no deberían aparecer dentro de un texto en español.
 * La lista es corta a propósito: buscar "the|and|..." daría falsos positivos.
 *
 * Cada entrada de esta lista salió de un fallo real de este repositorio, y
 * por eso el comentario nombra el caso. Un corrector de estilo lo resolvería
 * solo; esto solo detecta, y solo se amplía cuando alguien encuentra algo.
 */
const PALABRAS_INGLESAS =
  /\b(state|overturned|demolished|structure|unknown|date|loyalty|weekend|cleaning|product|cyclist|smoke|for|with|this|that|were|have|from|your|when|what|they|there|here|would|should|could|about|after|before|between|during|through|under)\b/i;

const ERRATAS_CONOCIDAS = /\b(?:proviienen|poroardes)\b/i;

/**
 * Alfabetos que no son el nuestro.
 */
const ALFABETO_AJENO = /[\u0400-\u04FF\u0370-\u03FF\u4E00-\u9FFF]/;

/**
 * Mezcla de mayusculas dentro de una palabra, del tipo "de limpieza_PRODUCTO".
 *
 * El motivo: los fallos de texto de este repositorio no se presentaban como
 * "esta palabra esta en ingles" sino como **dos palabras pegadas**, una de ellas
 * con la inicial en mayuscula y con la tilde perdida. "Almacen deproductos" y
 * "de limpieza_PRODUCTO" se leen casi bien, asi que la revision visual los deja
 * pasar: lo que falta es un espacio, no una palabra.
 */
const PALABRAS_PEGADAS = /\b[a-záéíóúñ]{3,}[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}\b|\b[a-záéíóúñ]{3,}[A-ZÁÉÍÓÚÑ]{2,}\b/;

/**
 * Mayuscula donde no la hay: una palabra corriente en medio de una frase.
 *
 * "una Urbanización de casas" no esta pegada, asi que el patron anterior no la
 * ve. Aqui se busca un articulo o preposicion seguido de palabra capitalizada, y
 * se exceptuan los casos legitimamente en mayuscula: nombres propios de entidad
 * ("Servicio de Salud Laboral", "SGA"), siglas y el inicio de frase.
 */
const MAYUSCULA_SOSPECHOSA =
  /\b(?:una|un|el|la|los|las|de|del|al|que|en|con|por|para)\s+(?!S\b|SGA\b)[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,}/g;

/** Nombres propios y entidades que si van en mayuscula, y no son un fallo. */
const EXCEPCIONES_MAYUSCULA = /\b(?:Servicio|Salud|Laboral|Urgencias|Emergencias|SGA|CLP|CE)\b/;

/**
 * Recorre una unidad y devuelve SOLO el texto que va a ver el alumnado.
 *
 * Motivo: revisar el `JSON.stringify` entero marca tambien los identificadores
 * (`enlazadoPor`, `viaQuimica`, `gravedadVisual`), que son claves de codigo y
 * no texto. Esos fallan y uno acaba "arreglando" el codigo para callar a la
 * prueba, que es peor que no tenerla. Aqui se juntan los valores de cadena y
 * nada mas: si un alumno lo lee, esta aqui dentro.
 *
 * @param {*} valor
 * @param {string[]}[Bote]
 * @returns {string}
 */
function textoVisible(valor, bote = []) {
  if (typeof valor === 'string') {
    bote.push(valor);
  } else if (Array.isArray(valor)) {
    for (const elemento of valor) textoVisible(elemento, bote);
  } else if (valor && typeof valor === 'object') {
    for (const clave of Object.keys(valor)) {
      // Se omiten los identificadores: son codigo, no texto.
      if (clave === 'id' || clave.endsWith('Por') || clave.startsWith('imagen')) continue;
      textoVisible(valor[clave], bote);
    }
  }
  return bote.join(' | ');
}

const unidadesConTexto = listarUnidadesConResumen();
for (const unidad of unidadesConTexto) {
  const texto = textoVisible(unidad);
  const ajenos = texto.match(ALFABETO_AJENO);
  const ingles = texto.match(PALABRAS_INGLESAS);
  const erratas = texto.match(ERRATAS_CONOCIDAS);
  const pegadas = texto.match(PALABRAS_PEGADAS);
  comprobar(
    !ajenos,
    `${unidad.id}: sin caracteres de otros alfabetos`,
    ajenos ? [...new Set(ajenos)].join(' ') : ''
  );
  comprobar(
    !ingles,
    `${unidad.id}: sin palabras inglesas en los textos`,
    ingles ? [...new Set(ingles)].slice(0, 3).join(', ') : ''
  );
  comprobar(
    !erratas,
    `${unidad.id}: sin erratas conocidas`,
    erratas ? [...new Set(erratas)].join(', ') : ''
  );
  comprobar(
    !pegadas,
    `${unidad.id}: sin palabras pegadas ni con mayusculas en medio`,
    pegadas ? [...new Set(pegadas)].slice(0, 3).join(', ') : ''
  );
  const sospechosas = [...new Set(texto.match(MAYUSCULA_SOSPECHOSA) || [])]
    .filter((frase) => !EXCEPCIONES_MAYUSCULA.test(frase));
  comprobar(
    sospechosas.length === 0,
    `${unidad.id}: sin mayusculas inexplicadas en mitad de frase`,
    sospechosas.slice(0, 3).join(' / ')
  );
}

console.log('\n== Resumen ==');
if (avisos > 0) {
  console.log(`${avisos} aviso(s) de contenido, sin contar como fallo.`);
}
if (fallos === 0) {
  console.log(`${comprobaciones} comprobaciones correctas.`);
} else {
  console.error(`${fallos} de ${comprobaciones} comprobaciones han fallado.`);
  process.exitCode = 1;
}

// Silence deprecation: auditarUnidad se importa para documentar la API usada.
void auditarUnidad;
