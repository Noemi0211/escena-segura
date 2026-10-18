/**
 * generadores.js — Capa compartida: de datos declarativos a estructuras de juego.
 *
 * Capa: utils (transversal), pero con conocimiento del CONTRATO DE DATOS.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EXISTE ESTE MÓDULO
 * ---------------------------------------------------------------------------
 * El requisito de la aplicación es que los motores de juego NO contengan
 * preguntas programadas y que la ampliación a nuevas unidades no obligue a
 * reescribirlos. Eso solo se consigue si existe un paso intermedio:
 *
 *      src/data/*.js  ──(declarativo)──▶  generadores.js  ──▶  motor
 *      "hay 24 casos"                     "reducirlos a 6"      (no sabe
 *                                          "barajarlos"         nada del
 *                                          "elegir distractores" contenido)
 *
 * Si los motores construyeran las preguntas, cada nueva unidad obligaría a
 * tocar los tres motores. Con este módulo, una unidad nueva es UN fichero de
 * datos más UNA línea en el registro. Los motores no se tocan.
 *
 * ---------------------------------------------------------------------------
 * QUÉ HACE
 * ---------------------------------------------------------------------------
 *   construirParesMemory()   -> pares de cartas + opciones de variante
 *   construirPreguntasSprint()-> preguntas con distractores válidos
 *   construirEscenarios()    -> valida y normaliza escenarios de Escape Room
 *   resumirUnidad()          -> métricas que la interfaz muestra
 *
 * ---------------------------------------------------------------------------
 * REGLA INNEGOCIABLE
 * ---------------------------------------------------------------------------
 * Un generador NUNCA puede leer un .docx, ni hacer fetch(), ni conocer ids
 * concretos de una temática. Solo aplica reglas genéricas sobre la unidad que
 * recibe. Si alguna vez necesitas comprobar `if (unidad.id === 'riesgos')`,
 * es una señal de que falta un campo declarativo en los datos.
 *
 * @module utils/generadores
 */

import { barajar, muestra, distractores, conSemilla } from './aleatorio.js';
import { leerRuta, resolverPlantilla } from './formato.js';

/** Tipos de contenido que una carta o una opción puede presentar. */
export const TIPOS_CONTENIDO = Object.freeze({
  TEXTO: 'texto',
  IMAGEN: 'imagen',
  ICONO: 'icono',
});

/* ==========================================================================
   1. RESOLUCIÓN DE CONTENIDO
   ========================================================================== */

/**
 * Convierte una descripción declarativa de contenido en un objeto normalizado
 * que cualquier motor puede pintar sin conocer el dominio.
 *
 * Acepta tres formas, para que escribir datos sea cómodo:
 *   · `'texto plano'`                       -> {tipo:'texto', valor:'...'}
 *   · `{ tipo:'imagen', valor:'ruta.jpg' }` -> normalizado
 *   · `{ tipo:'icono', valor:'rayo' }`      -> normalizado
 *
 * @param {string|object} descripcion
 * @param {string} [textoAlternativo]
 * @returns {{tipo: string, valor: string, alt: string}}
 *
 * @example
 *   resolverContenido('Explosivo')                    // {tipo:'texto',...}
 *   resolverContenido({tipo:'imagen', valor:'e.jpg'}) // {tipo:'imagen',...}
 */
export function resolverContenido(descripcion, textoAlternativo = '') {
  if (descripcion === null || descripcion === undefined) {
    return { tipo: TIPOS_CONTENIDO.TEXTO, valor: '', alt: textoAlternativo };
  }

  if (typeof descripcion === 'string') {
    return { tipo: TIPOS_CONTENIDO.TEXTO, valor: descripcion, alt: textoAlternativo };
  }

  const tipo = descripcion.tipo || TIPOS_CONTENIDO.TEXTO;
  return {
    tipo,
    valor: descripcion.valor ?? '',
    alt: descripcion.alt || textoAlternativo || descripcion.valor || '',
  };
}

/**
 * Igual que `resolverContenido`, pero respetando un tipo forzado por la
 * configuración. Necesario porque en los datos el valor de un pictograma se
 * almacena como texto (la ruta del fichero) y hay que presentarlo como
 * imagen sin obligar a escribir `{tipo:'imagen', valor:...}` en cada entrada.
 *
 * @param {*} descripcion
 * @param {string} [textoAlternativo]
 * @param {string} [tipoForzado]  Uno de TIPOS_CONTENIDO.
 * @returns {{tipo: string, valor: string, alt: string}}
 */
export function resolverContenidoComo(descripcion, textoAlternativo = '', tipoForzado) {
  const contenido = resolverContenido(descripcion, textoAlternativo);
  if (!tipoForzado || contenido.valor === '') return contenido;
  return { ...contenido, tipo: tipoForzado, alt: textoAlternativo || contenido.valor };
}

/* ==========================================================================
   2. MEMORY — construcción de pares
   ========================================================================== */

/**
 * Devuelve la colección de elementos de la que bebe un lado de un par.
 * Permite que ambos lados sean catálogos distintos, o incluso el mismo
 * (caso de "riesgo ↔ definición"), sin cambiar el motor.
 *
 * @param {object} unidad
 * @param {{fuente: string, catalogo?: string}} spec
 * @returns {Array}
 */
function obtenerElementos(unidad, spec) {
  if (!spec) return [];
  if (spec.fuente === 'casos') return Array.isArray(unidad?.casos) ? unidad.casos : [];
  if (spec.fuente === 'catalogos') return unidad?.catalogos?.[spec.catalogo] || [];
  return [];
}

/** Extrae el valor a mostrar de un elemento según la especificación del lado. */
function valorDe(elemento, spec) {
  return spec.campo ? leerRuta(elemento, spec.campo) : elemento.nombre;
}

/**
 * Texto alternativo de un lado cuyo contenido se presenta como imagen.
 *
 * Por qué no vale el propio valor: en Memory de pictogramas el valor ES la ruta
 * del fichero (`src/assets/images/pictogramas/corrosivo.jpg`). Esa ruta acaba en
 * dos sitios que ve el alumnado: el `alt` de la carta, que es lo que el navegador
 * enseña si la imagen no carga (servidor caído, pestaña guardada sin conexión),
 * y el repaso, que convierte el contenido en texto para listar las parejas. Una
 * ruta suelta no significa nada para quien estudia.
 *
 * Se describe la imagen con lo que representa (`nombre` de la entrada del
 * catálogo) y, si el elemento no lo tiene, con el nombre de la columna.
 *
 * @param {object} elemento
 * @param {{etiqueta?: string}} spec
 * @returns {string}
 */
function descripcionDe(elemento, spec) {
  return elemento?.nombre || spec?.etiqueta || '';
}

/**
 * Construye el índice de búsqueda del lado derecho.
 *
 * Por defecto se indexa por `id`, que es el caso habitual. Se puede indicar
 * otro campo con `spec.clave` cuando el emparejamiento es dentro de la misma
 * colección; por ejemplo, "situación ↔ tipo de emergencia" empareja el caso
 * consigo mismo, y la clave natural es `tipo`, no `id`.
 *
 * @param {Array} elementos
 * @param {{clave?: string}} spec
 * @returns {Map<string, object>}
 */
function construirIndice(elementos, spec) {
  const clave = spec.clave || 'id';
  return new Map(elementos.map((elemento) => [leerRuta(elemento, clave), elemento]));
}

/**
 * Resuelve una configuración declarativa de Memory en pares concretos.
 *
 * Una configuración describe QUÉ se empareja, nunca con qué datos. Los dos
 * lados son simétricos y se declaran con el mismo esquema:
 *
 *   {
 *     id: 'situacion-origen',
 *     titulo: 'Situación ↔ Origen',
 *     izquierda: { fuente:'casos', campo:'etiqueta', etiqueta:'Situación' },
 *     derecha:   { fuente:'catalogos', catalogo:'origen',
 *                  campo:'nombre', enlazadoPor:'clasificacion.origen',
 *                  etiqueta:'Origen' },
 *     limite: 8
 *   }
 *
 * `enlazadoPor` es una RUTA dentro del elemento de la izquierda, no el nombre
 * del catálogo. Por eso en `clasificacion.js` vale `clasificacion.origen`: el
 * id vive en `caso.clasificacion.origen`. Confundir una cosa con la otra es el
 * error que hace que una variante se quede sin pares; por eso `auditarUnidad()`
 * construye cada actividad de verdad y avisa si no resuelve nada.
 *
 * Combinaciones que cubre con este único esquema (las que pide el proyecto):
 *   · situación  ↔ clasificación   casos.etiqueta      → catalogos.X.nombre
 *   · riesgo    ↔ definición      catalogos.riesgo.nombre → catalogos.riesgo.definicion
 *   · pictograma↔ nombre          catalogos.pictograma.imagen → catalogos.pictograma.nombre
 *   · pictograma↔ significado     catalogos.pictograma.imagen → catalogos.pictograma.significado
 *   · nombre    ↔ significado     catalogos.pictograma.nombre  → catalogos.pictograma.significado
 *
 * Para emparejar dentro de un mismo catálogo se usa `enlazadoPor: 'id'`.
 *
 * Reglas aplicadas:
 *   · `limite` recorta el banco a un número manejable de cartas;
 *   · la selección es ALEATORIA en cada partida, para que la actividad se
 *     repita sin ser idéntica;
 *   · se descartan los elementos cuya contraparte no exista o esté vacía, lo
 *     que hace imposible que la actividad genere cartas irresolubles;
 *   · el subconjunto de la derecha se baraja aparte, para que la respuesta no
 *     quede siempre en la posición contigua.
 *
 * @param {object} unidad        Unidad temática de src/data/.
 * @param {object} configuracion Configuración declarativa de la variante.
 * @param {number} [semilla]     Semilla opcional para partidas reproducibles.
 * @returns {{
 *   id: string, titulo: string, instruccion: string,
 *   etiquetaIzquierda: string, etiquetaDerecha: string,
 *   pares: Array<{id: string, etiquetaIzquierda: string, etiquetaDerecha: string,
 *                 izquierda: object, derecha: object, explicacion: string}>,
 *   variantesDisponibles: string[]
 * }}
 */
export function construirParesMemory(unidad, configuracion, semilla) {
  const izq = configuracion.izquierda || {};
  const der = configuracion.derecha || {};

  const izqBase = {
    id: configuracion.id,
    titulo: configuracion.titulo,
    instruccion: configuracion.instruccion || '',
    etiquetaIzquierda: izq.etiqueta || 'A',
    etiquetaDerecha: der.etiqueta || 'B',
    pares: [],
    variantesDisponibles: (unidad?.memoria?.configuraciones || []).map((c) => c.id),
  };

  if (!configuracion.izquierda || !configuracion.derecha) return izqBase;

  const elementosIzq = obtenerElementos(unidad, izq);
  const elementosDer = obtenerElementos(unidad, der);
  const indiceDer = construirIndice(elementosDer, der);

  // 1. Descartar elementos sin valor propio o sin contraparte resoluble.
  const candidatos = elementosIzq.filter((elemento) => {
    const valorIzq = valorDe(elemento, izq);
    if (valorIzq === undefined || valorIzq === null || valorIzq === '') return false;

    const idVinculo = leerRuta(elemento, der.enlazadoPor);
    const contraparte = indiceDer.get(idVinculo);
    if (!contraparte) return false;

    const valorDer = valorDe(contraparte, der);
    return valorDer !== undefined && valorDer !== null && valorDer !== '';
  });

  // 2. Nunca más pares que respuestas disponibles.
  const maximoPares = Math.min(candidatos.length, elementosDer.length);
  if (maximoPares === 0) return izqBase;

  // 3. Recorte aleatorio (o determinista si se pasa semilla).
  const limite = Math.min(configuracion.limite || 8, maximoPares);
  const seleccionados = conSemilla(semilla, () => muestra(candidatos, limite));

  // 4. Emparejar.
  const pares = seleccionados.map((elemento) => {
    const contraparte = indiceDer.get(leerRuta(elemento, der.enlazadoPor));

    return {
      id: `${configuracion.id}:${elemento.id}`,
      etiquetaIzquierda: izq.etiqueta || 'A',
      etiquetaDerecha: der.etiqueta || 'B',
      izquierda: resolverContenidoComo(valorDe(elemento, izq), descripcionDe(elemento, izq), izq.como),
      derecha: resolverContenidoComo(valorDe(contraparte, der), descripcionDe(contraparte, der), der.como),
      // La explicación sale del primer campo que exista, de cualquiera de los
      // dos lados. La lista parece larga porque CADA UNIDAD nombra su campo de
      // forma distinta: `definicion` en riesgos y clasificación, `significado`
      // en pictogramas. Sin el `significado`, las 20 parejas de la unidad de
      // pictogramas se emparejaban bien pero llegaban al repaso con la
      // explicación vacía, que es justo lo que el alumno necesita para estudiar.
      // Un dato que no está en esta lista no es un dato que falte: es una clave
      // mal escrita, y por eso el generador prueba varias.
      explicacion:
        leerRuta(elemento, 'explicacion') ||
        leerRuta(contraparte, 'explicacion') ||
        leerRuta(contraparte, 'significado') ||
        leerRuta(contraparte, 'definicion') ||
        leerRuta(contraparte, 'consejo') ||
        leerRuta(elemento, 'definicion') ||
        leerRuta(elemento, 'significado') ||
        leerRuta(elemento, 'consejo') ||
        '',
    };
  });

  return { ...izqBase, pares };
}

/**
 * Construye TODAS las variantes de Memory declaradas en la unidad.
 * Es la función que llamará el motor; así el motor no conoce la estructura
 * de `unidad.memoria.configuraciones`.
 *
 * @param {object} unidad
 * @param {number} [semilla]
 * @returns {Array} Un objeto de variante por cada configuración declarada.
 */
export function construirVariantesMemory(unidad, semilla) {
  const configuraciones = unidad?.memoria?.configuraciones || [];
  return configuraciones.map((configuracion) =>
    construirParesMemory(unidad, configuracion, semilla)
  );
}

/* ==========================================================================
   3. SPRINT — construcción de preguntas
   ========================================================================== */

/**
 * Resuelve una plantilla declarativa de Sprint en una pregunta jugable.
 *
 * Una plantilla NO contiene la respuesta: indica de dónde sacarla.
 *
 *   {
 *     id: 'sprint-origen',
 *     tipo: 'opcion-multiple',
 *     enunciado: '¿De qué origen es esta situación? «{caso.etiqueta}»',
 *     correcta: { fuente:'catalogos', catalogo:'origen',
 *                 enlazadoPor:'clasificacion.origen', campo:'nombre' },
 *     distractores: { fuente:'catalogos', catalogo:'origen',
 *                     campo:'nombre', cantidad:3 },
 *     retroalimentacion: { acierto:'...', error:'...' }
 *   }
 *
 * El `enunciado` se resuelve con el CASO como contexto, de modo que el
 * profesorado escribe las preguntas con literales (`{caso.etiqueta}`) sin
 * necesidad de duplicar el texto del caso.
 *
 * @param {object} unidad
 * @param {object} plantilla
 * @param {number} [indice]
 * @returns {{
 *   id: string, enunciado: string, pista: string, ilustracion: object|null,
 *   opciones: Array<{id: string, texto: object, correcta: boolean}>,
 *   correctaId: string, retroalimentacion: object, dificultad: string
 * }}
 */
export function construirPreguntaSprint(unidad, plantilla, indice = 0) {
  const casos = Array.isArray(unidad?.casos) ? unidad.casos : [];
  const caso = casos[indice % Math.max(1, casos.length)];

  if (!caso) {
    return {
      id: `${plantilla.id}:vacio`,
      enunciado: 'Sin datos disponibles para esta pregunta.',
      pista: '',
      ilustracion: null,
      opciones: [],
      correctaId: null,
      retroalimentacion: { acierto: '', error: '', explicacion: '' },
      dificultad: 'basica',
    };
  }

  // --- Enunciado: la plantilla se rellena con un contexto {caso, unidad} ---
  const contexto = { caso, unidad, casoId: caso.id };
  const enunciado = resolverPlantilla(plantilla.enunciado, contexto);
  const pista = plantilla.pista
    ? resolverPlantilla(plantilla.pista, contexto)
    : caso.contexto || '';

  // --- Ilustración opcional del enunciado (p. ej. el pictograma a identificar).
  //     Se declara como marcador en los datos: 'ilustracion: "{caso.imagen}"'.
  //     El tipo se fuerza a `imagen`: sin esto, `resolverContenido` tipa la
  //     ruta como `texto` (es un string) y la vista de Sprint, que solo pinta
  //     un <img> cuando `tipo === 'imagen'`, no muestra nunca la ilustración.
  const ilustracionCruda = plantilla.ilustracion
    ? resolverPlantilla(plantilla.ilustracion, contexto)
    : '';
  const ilustracion = ilustracionCruda
    ? resolverContenidoComo(ilustracionCruda, plantilla.altIlustracion || '', TIPOS_CONTENIDO.IMAGEN)
    : null;

  // --- Respuesta correcta: se resuelve con el MISMO esquema que Memory ---
  const specCorrecta = { fuente: 'catalogos', ...plantilla.correcta };
  const universoCorrecta = obtenerElementos(unidad, specCorrecta);
  const indiceCorrecta = construirIndice(universoCorrecta, specCorrecta);

  const idVinculo = leerRuta(caso, specCorrecta.enlazadoPor);
  const entradaCorrecta = indiceCorrecta.get(idVinculo);
  const valorCorrecto = entradaCorrecta
    ? valorDe(entradaCorrecta, specCorrecta)
    : String(idVinculo ?? '');

  const correctaId = `${plantilla.id}:correcta`;
  const opciones = [
    {
      id: correctaId,
      texto: resolverContenido(valorCorrecto, String(valorCorrecto)),
      correcta: true,
    },
  ];

  // --- Distractores: nunca pueden coincidir con la respuesta correcta ---
  const specDistractores = { fuente: 'catalogos', ...(plantilla.distractores || {}) };
  const universoDistractor = obtenerElementos(unidad, {
    ...specDistractores,
    fuente: specDistractores.desde === 'casos' ? 'casos' : specDistractores.fuente,
  });
  const campoGrupo = specDistractores.mismoGrupoPor;
  const grupoActual = campoGrupo ? leerRuta(caso, campoGrupo) : undefined;
  const universoRelacionado = campoGrupo
    ? universoDistractor.filter(
      (elemento) => grupoActual !== undefined && leerRuta(elemento, campoGrupo) === grupoActual
    )
    : universoDistractor;
  const claveDistractor = specDistractores.clave || 'id';

  const generados = distractores(
    universoRelacionado,
    [idVinculo],
    plantilla.cantidad || specDistractores.cantidad || 3
  );

  generados.forEach((elemento, indiceDistractor) => {
    // Se compara por la clave declarada: evita que un distractor sea en real
    // la misma respuesta correcta redactada desde otra entrada.
    if (leerRuta(elemento, claveDistractor) === idVinculo) return;
    const valor = valorDe(elemento, specDistractores);
    if (valor === undefined || valor === null || valor === '') return;
    opciones.push({
      id: `${plantilla.id}:d${indiceDistractor}`,
      texto: resolverContenido(valor, String(valor)),
      correcta: false,
    });
  });

  // Si por un descuido del banco no queda ninguna opción, la pregunta no se
  // genera: una pregunta sin alternativa correcta sería un fallo de diseño.
  if (opciones.length < 2) {
    return {
      id: `${plantilla.id}:${caso.id}`,
      enunciado,
      pista,
      ilustracion,
      opciones: [],
      correctaId: null,
      retroalimentacion: { acierto: '', error: '', explicacion: '' },
      dificultad: plantilla.dificultad || 'basica',
    };
  }

  return {
    id: `${plantilla.id}:${caso.id}`,
    enunciado,
    pista,
    ilustracion,
    opciones: barajar(opciones),
    correctaId,
    retroalimentacion: {
      acierto: resolverPlantilla(plantilla.retroalimentacion?.acierto || '', contexto),
      error: resolverPlantilla(plantilla.retroalimentacion?.error || '', contexto),
      // Explicación: POR QUÉ está bien. Es el contenido que más valor tiene
      // en la transferencia a contextos reales.
      explicacion: resolverPlantilla(
        plantilla.retroalimentacion?.explicacion || caso.explicacion || '',
        contexto
      ),
    },
    dificultad: plantilla.dificultad || 'basica',
    // Igual que en Escape: la intención declarada en la plantilla viaja con la
    // pregunta, o el auditor no tiene forma de distinguir "se me olvidó un
    // distractor" de "esta pregunta es de dos opciones a propósito".
    opcionesMinimas: plantilla.opcionesMinimas ?? null,
  };
}

/**
 * Construye el mazo completo de Sprint de una unidad, mezclando plantillas y
 * casos, y barajando el orden de presentación.
 *
 * Si se pide más preguntas que combinaciones disponibles, se repite el mazo
 * barajado de nuevo: es preferible repetir a mostrar menos preguntas de las
 * previstas.
 *
 * @param {object} unidad
 * @param {number} [cantidad]    Número de preguntas (por defecto, config.sprint.cantidad).
 * @param {number} [semilla]
 * @returns {{preguntas: Array, mazoCompleto: boolean}}
 */
export function construirMazoSprint(unidad, cantidad, semilla) {
  const plantillas = unidad?.sprint?.plantillas || [];
  const pedidos = cantidad || unidad?.sprint?.cantidad || 10;
  const casos = unidad?.casos || [];

  if (!plantillas.length || !casos.length) {
    return { preguntas: [], mazoCompleto: false };
  }

  // Todas las combinaciones plantilla x caso disponibles.
  const combinaciones = [];
  for (const plantilla of plantillas) {
    for (let indice = 0; indice < casos.length; indice += 1) {
      combinaciones.push({ plantilla, indice });
    }
  }

  // La semilla debe envolver TODO el proceso, no solo el barajado inicial.
  // `construirPreguntaSprint` genera sus propios distractores y baraja sus
  // opciones, así que si el resto se construyera fuera de `conSemilla` la
  // partida con semilla 12345 no coincidiría con la siguiente vez que se
  // pidiera 12345, y la reproducción de una partida educational sería falsa.
  return conSemilla(semilla, () => {
    const barajadas = barajar(combinaciones);

    const necesarias = Math.min(pedidos, barajadas.length);
    const preguntas = [];
    for (let indice = 0; indice < necesarias; indice += 1) {
      const { plantilla, indice: indiceCaso } = barajadas[indice];
      const pregunta = construirPreguntaSprint(unidad, plantilla, indiceCaso);
      // Se descartan las preguntas que no han podido construirse (banco
      // incompleto). Es preferible servir 6 preguntas correctas que 10 con huecos.
      if (!pregunta.opciones || pregunta.opciones.length < 2) continue;
      preguntas.push(pregunta);
    }

    return { preguntas, mazoCompleto: preguntas.length >= pedidos };
  });
}

/* ==========================================================================
   4. ESCAPE ROOM — validación de escenarios
   ========================================================================== */

/**
 * Valida y normaliza los escenarios declarados por una unidad.
 *
 * A diferencia de Memory y Sprint, aquí el contenido SÍ es específico: una
 * fase es un fragmento narrativo. Pero el motor sigue siendo genérico porque
 * todo lo que necesita (fases, opciones, bloqueos, puntuación) está
 * normalizado en un contrato fijo.
 *
 * Comprobaciones realizadas (fallan rápido y con un mensaje legible):
 *   · cada fase tiene al menos una opción;
 *   · cada fase tiene EXACTAMENTE una opción correcta;
 *   · cada opción tiene realimentación (requisito pedagógico obligatorio);
 *   · los identificadores de fase son únicos.
 *
 * @param {object} unidad
 * @returns {{escenarios: Array, errores: string[]}}
 */
export function construirEscenarios(unidad) {
  const declarados = unidad?.escape?.escenarios || [];
  const errores = [];

  const escenarios = declarados.map((escenario, posicion) => {
    const fases = (escenario.fases || []).map((fase, indiceFase) => {
      const opciones = fase.opciones || [];

      if (opciones.length === 0) {
        errores.push(
          `${escenario.id} / fase ${indiceFase + 1} ("${fase.titulo || 'sin título'}"): sin opciones.`
        );
      }

      const correctas = opciones.filter((opcion) => opcion.correcta);
      if (correctas.length !== 1) {
        errores.push(
          `${escenario.id} / fase ${indiceFase + 1}: ${correctas.length} opciones marcadas como correctas; debe haber exactamente 1.`
        );
      }

      opciones.forEach((opcion, indiceOpcion) => {
        if (!opcion.retroalimentacion) {
          errores.push(
            `${escenario.id} / fase ${indiceFase + 1}, opción ${indiceOpcion + 1}: falta la realimentación. Es obligatoria por diseño didáctico.`
          );
        }
      });

      return {
        id: fase.id || `${escenario.id}-f${indiceFase + 1}`,
        titulo: fase.titulo || `Fase ${indiceFase + 1}`,
        texto: fase.texto || '',
        pista: fase.pista || '',
        tiempoLimite: fase.tiempoLimite || null,
        puntos: fase.puntos ?? 10,
        // Se propaga la intención declarada en el dato. Sin esto, el campo
        // existiría solo en `src/data/` y el auditor nunca lo vería: es
        // exactamente el fallo de §4.2 de `agents.md`, donde una clave escrita
        // en el sitio equivocado deja la actividad sin efecto en silencio.
        opcionesMinimas: fase.opcionesMinimas ?? null,
        situacion: resolverContenido(fase.situacion || null, fase.titulo || ''),
        // Imagen opcional de la fase (p. ej. el pictograma a identificar).
        // Se fuerza el tipo `imagen` porque, igual que en Sprint, la ruta es un
        // string y `resolverContenido` la tiparía como `texto`.
        imagen: fase.imagen
          ? resolverContenidoComo(fase.imagen, fase.altImagen || fase.titulo || '', TIPOS_CONTENIDO.IMAGEN)
          : null,
        opciones: opciones.map((opcion, indice) => ({
          id: opcion.id || `${fase.id || indiceFase}-o${indice}`,
          texto: opcion.texto || '',
          correcta: Boolean(opcion.correcta),
          puntos: opcion.puntos ?? 0,
          retroalimentacion: {
            breve: opcion.retroalimentacion?.breve || '',
            // `explicacion` es lo que enseña: por qué la opción correcta lo es.
            explicacion: opcion.retroalimentacion?.explicacion || '',
            transferencia: opcion.retroalimentacion?.transferencia || '',
          },
          // Referencia opcional a la evidencia formativa que lo respalda.
          evidencia: opcion.evidencia || null,
        })),
      };
    });

    // Comprobar que los ids de fase son únicos.
    const ids = new Set();
    for (const fase of fases) {
      if (ids.has(fase.id)) {
        errores.push(`${escenario.id}: identificador de fase duplicado "${fase.id}".`);
      }
      ids.add(fase.id);
    }

    return {
      id: escenario.id || `escenario-${posicion + 1}`,
      titulo: escenario.titulo || `Escenario ${posicion + 1}`,
      briefing: escenario.briefing || '',
      imagen: escenario.imagen || null,
      ambientacion: escenario.ambientacion || null,
      tiempoTotal: escenario.tiempoTotal || null,
      puntosTotales: fases.reduce((suma, fase) => suma + (fase.puntos || 0), 0),
      fases,
    };
  });

  return { escenarios, errores };
}

/* ==========================================================================
   5. RESUMEN DE UNA UNIDAD (para la interfaz)
   ========================================================================== */

/**
 * Calcula un resumen de los datos disponibles en una unidad.
 *
 * Uso: la interfaz lo muestra en la pantalla de selección de juegos para
 * explicar al alumnado qué va a practicar, y en la pantalla de construcción
 * de un motor para hacer trazable de dónde saldrán las preguntas.
 *
 * @param {object} unidad
 * @returns {{
 *   casos: number, conceptos: number, catalogos: Record<string, number>,
 *   variantesMemory: number, plantillasSprint: number, escenarios: number,
 *   totalElementos: number
 * }}
 */
export function resumirUnidad(unidad) {
  if (!unidad) {
    return {
      casos: 0, conceptos: 0, catalogos: {},
      variantesMemory: 0, plantillasSprint: 0, escenarios: 0, totalElementos: 0,
    };
  }

  const catalogos = {};
  for (const [nombre, entradas] of Object.entries(unidad.catalogos || {})) {
    catalogos[nombre] = Array.isArray(entradas) ? entradas.length : 0;
  }

  const escenarios = (unidad.escape?.escenarios || []).length;
  const casos = (unidad.casos || []).length;
  const conceptos = (unidad.conceptos || []).length;

  return {
    casos,
    conceptos,
    catalogos,
    variantesMemory: (unidad.memoria?.configuraciones || []).length,
    plantillasSprint: (unidad.sprint?.plantillas || []).length,
    escenarios,
    totalElementos:
      casos + conceptos + escenarios + Object.values(catalogos).reduce((a, b) => a + b, 0),
  };
}

/**
 * Comprueba, en cualquier forma de dato, que las referencias a catálogos
 * existan.
 *
 * Motivo de existir: el error de contenido más difícil de detectar a simple
 * vista es una clave mal escrita que hace que N cartas de una actividad
 * queden sin pareja. Las tres unidades lo formulan con formas distintas:
 *
 *   · riesgos      →  caso.riesgo / caso.ambito
 *   · pictogramas  →  caso.pictograma
 *   · clasificacion→  caso.clasificacion.origen / .gravedad / .escenario
 *
 * En vez de hardcodear una forma por unidad, se recorre el caso y, siempre
 * que el NOMBRE de una propiedad coincida con un catálogo de la unidad, se
 * exige que su valor sea un id existente. Así una unidad nueva no necesita
 * tocar esta función.
 *
 * @param {object} caso
 * @param {Record<string, Set<string>>} indices
 * @param {string} nombreCatalogo
 * @param {string} ruta
 * @param {string[]} problemas
 */
function comprobarReferencias(caso, indices, nombreCatalogo, ruta, problemas) {
  const idsValidos = indices[nombreCatalogo];
  if (!idsValidos) return;

  for (const id of [].concat(caso)) {
    if (!idsValidos.has(id)) {
      problemas.push(
        `Caso "${ruta}": \`${nombreCatalogo}\` apunta a "${id}", que no existe en el catálogo "${nombreCatalogo}".`
      );
    }
  }
}

/**
 * Detecta errores de integridad en una unidad de datos.
 *
 * Se ejecuta al arrancar en modo desarrollo. Es barato y ha evitado más de un
 * error de contenido: ids duplicados, referencias rotas, campos vacíos.
 *
 * La comprobación decisiva es la ÚLTIMA: construir de verdad cada actividad con
 * los mismos generadores que usará el juego. Si una variante de Memory se queda
 * sin pares o un mazo de Sprint se queda sin preguntas, aquí se detecta, y no
 * en mitad de una clase.
 *
 * @param {object} unidad
 * @returns {string[]} Lista de problemas encontrados (vacía si todo está bien).
 */
export function auditarUnidad(unidad) {
  const problemas = [];
  if (!unidad) return ['Unidad nula.'];

  if (!unidad.id) problemas.push('Falta el campo `id` en la unidad.');
  if (!unidad.nombre) problemas.push(`La unidad "${unidad.id || '?'}" no tiene \`nombre\`.`);

  // Ids duplicados en catálogos.
  for (const [nombre, entradas] of Object.entries(unidad.catalogos || {})) {
    const vistos = new Set();
    for (const entrada of entradas || []) {
      if (!entrada.id) {
        problemas.push(`Catálogo "${nombre}": hay una entrada sin \`id\`.`);
      } else if (vistos.has(entrada.id)) {
        problemas.push(`Catálogo "${nombre}": id duplicado "${entrada.id}".`);
      }
      vistos.add(entrada.id);
    }
  }

  // Referencias al interior de los casos, con el nombre del catálogo como clave.
  const indices = {};
  for (const [nombre, entradas] of Object.entries(unidad.catalogos || {})) {
    indices[nombre] = new Set((entradas || []).map((entrada) => entrada.id));
  }
  const nombresCatalogo = Object.keys(indices);

  for (const caso of unidad.casos || []) {
    if (!caso.id) {
      problemas.push('Hay un caso sin `id` (su id se usa como clave de emparejamiento).');
      continue;
    }

    // Forma explícita antigua: `caso.vinculos = { catalogos: [ids] }`.
    for (const [nombre, ids] of Object.entries(caso.vinculos || {})) {
      comprobarReferencias(ids, indices, nombre, `${caso.id}.vinculos.${nombre}`, problemas);
    }

    // Forma implícita: cualquier propiedad cuyo nombre sea un catálogo.
    for (const [clave, valor] of Object.entries(caso)) {
      if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
        for (const [subClave, subValor] of Object.entries(valor)) {
          if (nombresCatalogo.includes(subClave)) {
            comprobarReferencias(subValor, indices, subClave, `${caso.id}.${clave}.${subClave}`, problemas);
          }
        }
      } else if (nombresCatalogo.includes(clave)) {
        comprobarReferencias(valor, indices, clave, `${caso.id}.${clave}`, problemas);
      }
    }
  }

  // Configuraciones de Memory: comprobar que los catálogos existen.
  for (const configuracion of unidad.memoria?.configuraciones || []) {
    if (!configuracion.izquierda || !configuracion.derecha) {
      problemas.push(`Memory "${configuracion.id}": faltan \`izquierda\` o \`derecha\`.`);
      continue;
    }
    for (const lado of ['izquierda', 'derecha']) {
      const spec = configuracion[lado];
      if (spec.fuente === 'catalogos' && !indices[spec.catalogo]) {
        problemas.push(
          `Memory "${configuracion.id}": el catálogo "${spec.catalogo}" del lado ${lado} no existe en la unidad.`
        );
      }
    }
  }

  // Escenarios: reutiliza el validador.
  const { errores } = construirEscenarios(unidad);
  problemas.push(...errores);

  // Prueba de fuego: construir cada actividad con los generadores reales.
  for (const configuracion of unidad.memoria?.configuraciones || []) {
    if (!configuracion.izquierda || !configuracion.derecha) continue;
    const { pares } = construirParesMemory(unidad, configuracion, 1);
    if (pares.length === 0) {
      problemas.push(
        `Memory "${configuracion.id}": no se resuelve ningún par. Revisa \`enlazadoPor\` (${configuracion.derecha.enlazadoPor || 'sin definir'}) y que los catálogos existan.`
      );
    }
  }

  const mazo = construirMazoSprint(unidad, 1, 1);
  if ((unidad.sprint?.plantillas || []).length > 0 && mazo.preguntas.length === 0) {
    problemas.push('Sprint: no se genera ninguna pregunta a partir de las plantillas declaradas.');
  }

  return problemas;
}
