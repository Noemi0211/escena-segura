/**
 * probar-motores.mjs — Prueba de humo de los tres motores de juego.
 *
 * Se ejecuta con `npm run test:motores`.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ HACE FALTA UN ENTORNO FALSO DE NAVEGADOR
 * ---------------------------------------------------------------------------
 * Los motores son JavaScript puro y no tocan el DOM, pero sí usan el reloj, que
 * se apoya en `requestAnimationFrame`. Para poder probarlos en Node se
 * instala aquí un `requestAnimationFrame` mínimo que avanza el tiempo de forma
 * manual, en lugar de abrir un navegador.
 *
 * Eso permite comprobar en segundos lo que importa de verdad de un motor:
 * que el estado avanza, que los contadores cuadran y que la partida TERMINA.
 * Un motor que se queda colgado en "jugando" no se ve mirando el código: se ve
 * jugando.
 *
 * Lo que NO se comprueba aquí, y hay que comprobar en el navegador: que se
 * pinte bien, que el teclado funcione y que el diseño responsive sea correcto.
 */

import { obtenerUnidad, unidades } from '../src/data/index.js';
import { crearMemory, ESTADO_CARTA } from '../src/games/memory.js';
import { crearSprint } from '../src/games/sprint.js';
import { crearEscape } from '../src/games/escape.js';

/* -------------------------------------------------------------------------
   RELOJ DE PRUEBA
   ---------------------------------------------------------------------- */

/** Cola de fotogramas: se avanza a mano con `avanzarReloj(segundos)`. */
let fotogramas = [];
let relojActual = 0;

globalThis.requestAnimationFrame = (callback) => {
  fotogramas.push({ callback, instante: relojActual });
  return fotogramas.length;
};

globalThis.cancelAnimationFrame = () => {
  fotogramas = [];
};

/**
 * Avanza el reloj `segundos` segundos, disparando los fotogramas pendientes.
 * @param {number} segundos
 */
function avanzarReloj(segundos) {
  const destino = relojActual + segundos * 1000;
  // Hasta 40 iteraciones: un motor con reloj se detiene solo en 1.
  for (let paso = 0; paso < 40 && fotogramas.length > 0; paso += 1) {
    const pendiente = fotogramas.shift();
    relojActual = destino;
    pendiente.callback(pendiente.instante + (destino - relojActual) + segundos * 1000);
  }
  if (fotogramas.length === 0) relojActual = destino;
}

/* -------------------------------------------------------------------------
   ASSERT
   ---------------------------------------------------------------------- */

let fallos = 0;
let comprobaciones = 0;

function comprobar(condicion, descripcion, detalle = '') {
  comprobaciones += 1;
  if (condicion) {
    console.log(`  OK    ${descripcion}`);
  } else {
    fallos += 1;
    console.error(`  FALLO ${descripcion}${detalle ? ` -> ${detalle}` : ''}`);
  }
}

/* =========================================================================
   MEMORY
   ========================================================================= */

console.log('\n== Memory ==');
for (const unidad of unidades) {
  const motor = crearMemory(unidad);
  motor.iniciar();

  const estadoInicial = motor.estado();
  comprobar(
    estadoInicial.total > 0 && estadoInicial.fase === 'jugando',
    `${unidad.id}: arranca con ${estadoInicial.total} pares`
  );

  const tablero = motor.tablero();
  comprobar(
    tablero.izquierda.length === estadoInicial.total && tablero.derecha.length === estadoInicial.total,
    `${unidad.id}: dos columnas del mismo tamaño`
  );

  // El tablero NO debe rebarajarse al repintar: es la clave para poder pulsar
  // dos cartas seguidas.
  const otroTablero = motor.tablero();
  comprobar(
    tablero.izquierda.map((c) => c.id).join('|') === otroTablero.izquierda.map((c) => c.id).join('|'),
    `${unidad.id}: el tablero no se rebaraja al repintar`
  );

  // Resolver todos los pares pulsando fichas distintas que comparten pareja.
  for (const carta of tablero.izquierda) {
    const pareja = tablero.derecha.find((otra) => otra.emparejaCon === carta.emparejaCon);
    motor.responder(carta.id);
    motor.responder(pareja.id);
  }

  const estadoFinal = motor.estado();
  comprobar(
    estadoFinal.terminado && estadoFinal.resueltos.length === estadoInicial.total,
    `${unidad.id}: partida terminada con ${estadoFinal.resueltos.length}/${estadoInicial.total} pares`,
    JSON.stringify({ terminado: estadoFinal.terminado, resueltos: estadoFinal.resueltos.length })
  );
  comprobar(estadoFinal.fallos === 0, `${unidad.id}: sin fallos al resolver siempre bien`);
  comprobar(estadoFinal.terminadoCorrectamente, `${unidad.id}: marcada como correcta`);
  comprobar(
    tablero.izquierda.every((c) => c.situacion === ESTADO_CARTA.OCULTA),
    `${unidad.id}: las cartas empiezan ocultas`
  );

  // Un fallo debe contar como fallo.
  //
  // Se buscan dos cartas de DISTINTOS pares a propósito. La versión anterior
  // pulsaba `izquierda[0]` y `derecha[1]` y daba por hecho que no eran pareja,
  // pero las columnas se barajan al azar: con probabilidad 1/N son el mismo par
  // y la comprobación fallaba sin que hubiera ningún error. Un test que falla
  // sola invite a "arreglar" el motor en vez de arreglar el test.
  const motor2 = crearMemory(unidad);
  motor2.iniciar();
  const t2 = motor2.tablero();
  const parDistinto = t2.izquierda.find((a) =>
    t2.derecha.some((b) => b.emparejaCon !== a.emparejaCon)
  );
  const otra = t2.derecha.find((b) => b.emparejaCon !== parDistinto.emparejaCon);
  motor2.responder(parDistinto.id);
  motor2.responder(otra.id);
  comprobar(
    motor2.estado().fallos === 1,
    `${unidad.id}: pulsar dos cartas de pares distintos suma un fallo`,
    `fallos=${motor2.estado().fallos} (${parDistinto.emparejaCon} vs ${otra.emparejaCon})`
  );

  const resumen = motor2.resumen();
  comprobar(typeof resumen.porcentaje === 'number', `${unidad.id}: resumen con porcentaje`);
  comprobar('medalla' in resumen, `${unidad.id}: resumen con medalla`);
}

/* =========================================================================
   SPRINT
   ========================================================================= */

console.log('\n== Sprint ==');
for (const unidad of unidades) {
  const motor = crearSprint(unidad);
  motor.iniciar({ cantidad: 4 });

  const inicial = motor.estado();
  comprobar(inicial.total > 0, `${unidad.id}: mazo de ${inicial.total} preguntas`);

  // Responder siempre la opción correcta.
  let pregunta = motor.pregunta();
  for (let i = 0; i < 4 && pregunta; i += 1) {
    const buena = pregunta.opciones.find((o) => o.correcta);
    motor.responder(buena.id);
    comprobar(
      motor.estado().aciertos === i + 1,
      `${unidad.id}: acierto ${i + 1} registrado`,
      `aciertos=${motor.estado().aciertos}`
    );
    motor.siguiente();
    pregunta = motor.pregunta();
  }

  const final = motor.estado();
  comprobar(final.terminado, `${unidad.id}: termina tras agotar el mazo`, `indice=${final.indice}/${inicial.total}`);
  comprobar(
    final.puntos > 0,
    `${unidad.id}: suma puntos (${final.puntos})`,
    'puntos 0: revisar la puntuación de velocidad'
  );

  // Un fallo debe restar y no sumar.
  const motor2 = crearSprint(unidad);
  motor2.iniciar({ cantidad: 4 });
  const mala = motor2.pregunta().opciones.find((o) => !o.correcta);
  motor2.responder(mala.id);
  comprobar(motor2.estado().fallos === 1, `${unidad.id}: respuesta incorrecta suma un fallo`);
  comprobar(
    motor2.estado().puntos === 0,
    `${unidad.id}: la respuesta incorrecta no da puntos`,
    `puntos=${motor2.estado().puntos}`
  );

  // Agotar el tiempo debe avanzar a la siguiente pregunta, no romper nada.
  const motor3 = crearSprint(unidad);
  motor3.iniciar({ cantidad: 3 });
  const antes = motor3.estado().indice;
  avanzarReloj(60);
  comprobar(
    motor3.estado().indice > antes || motor3.estado().terminado,
    `${unidad.id}: agotar el tiempo avanza o termina`,
    `indice=${motor3.estado().indice} terminado=${motor3.estado().terminado}`
  );
  motor3.pausar();

  // `siguiente()` tiene que AVISAR a quien está escuchando. Sin ese aviso el
  // estado del motor avanza igualmente, así que consultarlo a mano no delata
  // nada: lo que se queda quieto es la pantalla, y el síntoma en el aula es
  // "la partida se ha colgado". Es el bug más caro que puede tener esta clase de
  // motor, y por eso tiene comprobación propia.
  const motor4 = crearSprint(unidad);
  motor4.iniciar({ cantidad: 3 });

  const avisos = [];
  motor4.suscribir((estado, motivo) => avisos.push(motivo));

  const primera = motor4.pregunta();
  motor4.responder(primera.opciones.find((o) => o.correcta).id);
  avisos.length = 0;
  motor4.siguiente();

  comprobar(
    avisos.length > 0,
    `${unidad.id}: siguiente() notifica a la vista`,
    'sin aviso: la pantalla no se repinta y la partida parece congelada'
  );
  comprobar(
    motor4.estado().indice === 1 && motor4.estado().respondida === false,
    `${unidad.id}: siguiente() deja preparada la pregunta siguiente`,
    `indice=${motor4.estado().indice} respondida=${motor4.estado().respondida}`
  );
  comprobar(
    motor4.estado().tiempoRestante === motor4.estado().reglas.tiempoPregunta,
    `${unidad.id}: siguiente() reinicia el reloj`,
    `tiempoRestante=${motor4.estado().tiempoRestante}`
  );
  motor4.pausar();
}

/* =========================================================================
   ESCAPE ROOM
   ========================================================================= */

console.log('\n== Escape Room ==');
for (const unidad of unidades) {
  const motor = crearEscape(unidad);
  motor.iniciar();

  const inicial = motor.estado();
  comprobar(inicial.total > 0, `${unidad.id}: escenario con ${inicial.total} fases`);
  comprobar(Boolean(inicial.briefing), `${unidad.id}: el escenario tiene briefing`);

  // No se puede avanzar sin decidir: es el comportamiento que impide saltarse
  // las explicaciones.
  motor.avanzarFase();
  comprobar(
    motor.estado().indice === 0,
    `${unidad.id}: no avanza sin decidir`,
    `indice=${motor.estado().indice}`
  );

  let fase = motor.fase();
  for (let i = 0; i < inicial.total && fase; i += 1) {
    const buena = fase.opciones.find((o) => o.correcta);
    motor.responder(buena.id);

    const detalle = motor.estado().detalle;
    comprobar(
      Boolean(detalle?.explicacion && detalle?.transferencia),
      `${unidad.id}/${fase.id}: realimentación con explicación y transferencia`,
      JSON.stringify(detalle)
    );
    comprobar(
      motor.estado().respondida === true,
      `${unidad.id}/${fase.id}: la fase queda a la espera de "continuar"`
    );

    motor.avanzarFase();
    fase = motor.fase();
  }

  const final = motor.estado();
  comprobar(final.terminado, `${unidad.id}: termina tras todas las fases`);
  comprobar(
    final.aciertos === inicial.total,
    `${unidad.id}: ${final.aciertos}/${inicial.total} fases acertadas`
  );
  comprobar(
    (final.decisiones || []).length === inicial.total,
    `${unidad.id}: guarda el registro de decisiones`
  );

  // Agotar el tiempo de una fase debe penalizar y bloquear el avance.
  const motor2 = crearEscape(unidad);
  motor2.iniciar();
  avanzarReloj(300);
  comprobar(
    motor2.estado().fallos === 1 && motor2.estado().respondida === true,
    `${unidad.id}: agotar el tiempo penaliza la fase`,
    JSON.stringify({ fallos: motor2.estado().fallos, respondida: motor2.estado().respondida })
  );
  motor2.pausar();
}

/* =========================================================================
   RESUMEN
   ========================================================================= */

/* =========================================================================
   REVISIÓN DE LA PARTIDA
   ========================================================================= */

/*
 * La revisión es lo que hace útil una pantalla de resultados: sin ella solo hay
 * un marcador, y el alumno se va sin ver la respuesta correcta de lo que falló.
 * Estas comprobaciones miran las tres cosas de las que depende:
 *
 *   1. que exista una entrada por pregunta o por fase;
 *   2. que cada entrada lleve la respuesta correcta, aunque el alumno acertara;
 *   3. que lo fallado quede marcado como fallado y no como acierto.
 */

console.log('\n== Revisión de la partida ==');

for (const unidad of unidades) {
  // --- Memory ---
  const m = crearMemory(unidad);
  m.iniciar();
  const pares = m.tablero();
  const parBueno = pares.izquierda[0];
  const suPareja = pares.derecha.find((c) => c.emparejaCon === parBueno.emparejaCon);
  m.responder(parBueno.id);
  m.responder(suPareja.id);
  const revMemoria = m.revision();
  comprobar(
    Array.isArray(revMemoria) && revMemoria.length === m.estado().total,
    `${unidad.id}/memory: la revisión tiene una entrada por pareja`,
    `${revMemoria?.length} de ${m.estado().total}`
  );
  comprobar(
    revMemoria.every((p) => p.explicacion),
    `${unidad.id}/memory: cada pareja lleva su explicación`,
    `${revMemoria.filter((p) => !p.explicacion).length} de ${revMemoria.length} sin ella`
  );
  comprobar(
    revMemoria.some((p) => p.acierto) && revMemoria.some((p) => !p.acierto),
    `${unidad.id}/memory: la revisión distingue el acierto del fallo`
  );
  comprobar(
    revMemoria.every((p) => p.izquierda && p.derecha),
    `${unidad.id}/memory: cada pareja enseña sus dos cartas`
  );

  // --- Sprint ---
  const s = crearSprint(unidad);
  s.iniciar({ cantidad: 4, semilla: 99 });
  const pregunta = s.pregunta();
  const mala = pregunta.opciones.find((o) => !o.correcta);
  s.responder(mala.id);
  const revSprint = s.revision();
  comprobar(
    revSprint.length === s.estado().total,
    `${unidad.id}/sprint: la revisión tiene una entrada por pregunta`,
    `${revSprint.length} de ${s.estado().total}`
  );
  const fallada = revSprint.find((p) => !p.acierto);
  comprobar(
    Boolean(fallada?.correcta),
    `${unidad.id}/sprint: la pregunta fallada enseña su respuesta correcta`
  );
  comprobar(
    Boolean(fallada?.elegida) && fallada.elegida !== fallada.correcta,
    `${unidad.id}/sprint: la fallada enseña también lo que se eligió`
  );
  comprobar(
    revSprint.every((p) => p.correcta),
    `${unidad.id}/sprint: TODAS las preguntas llevan su respuesta correcta, aciertos y fallos`
  );
  comprobar(
    revSprint.filter((p) => p.acierto).length === s.estado().aciertos,
    `${unidad.id}/sprint: los aciertos de la revisión cuadran con el marcador`,
    `${revSprint.filter((p) => p.acierto).length} vs ${s.estado().aciertos}`
  );
  comprobar(
    typeof revSprint[0].explicacion === 'string',
    `${unidad.id}/sprint: la revisión lleva explicación, aunque salga vacía`
  );
  s.pausar();
}

console.log('\n== Resumen ==');
if (fallos === 0) {
  console.log(`${comprobaciones} comprobaciones correctas.`);
} else {
  console.error(`${fallos} de ${comprobaciones} comprobaciones han fallado.`);
  process.exitCode = 1;
}

void obtenerUnidad;
