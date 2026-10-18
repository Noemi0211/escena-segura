/**
 * escape.js — MOTOR DEL ESCAPE ROOM.
 *
 * Capa: games. LÓGICA DE JUEGO ÚNICAMENTE.
 *
 * ---------------------------------------------------------------------------
 * QUÉ HACE
 * ---------------------------------------------------------------------------
 * Presenta un escenario por fases narrativas. En cada fase hay que elegir una
 * acción, y cada acción tiene su propia realimentación con tres niveles:
 *
 *   breve        → una línea, la idea clave;
 *   explicacion  → por qué es así, con el contexto de la fase;
 *   transferencia→ cómo se aplica fuera del ejercicio.
 *
 * Es el juego con más carga formativa, y por eso los tres niveles son
 * OBLIGATORIOS: `construirEscenarios()` ya falla si una opción llega sin ellos.
 *
 * ---------------------------------------------------------------------------
 * DIFERENCIA CON RESPONDER EN SPRINT
 * ---------------------------------------------------------------------------
 * En Sprint responder cierra la pregunta; en Escape Room responder abre la
 * realimentación y la decisión de continuar es de quien está jugando. Por eso
 * el motor separa `responder()` de `avanzar()`: son dos gestos distintos y
 * confundirlos hacía que el escenario saltase a la siguiente fase sin dejar leer
 * la explicación, que es justo lo que no debe pasar en una actividad sobre
 * decisiones en emergencias.
 *
 * ---------------------------------------------------------------------------
 * TIEMPO
 * ---------------------------------------------------------------------------
 * El tiempo se cuenta por fase, con el valor declarado en el propio escenario
 * (`fase.tiempoLimite`) y, si no existe, con el valor por defecto de
 * `REGLAS.escape.tiempoFase`. Al agotarse la fase, se salta a la siguiente
 * contando un fallo: quedarse sin tiempo es una decisión, en el sentido de que
 * también informa de la presión con la que se decide en un caso real.
 *
 * @module games/escape
 */

import {
  crearMotorBase,
  crearReloj,
  reglasDe,
  calcularPorcentaje,
  medallaPara,
} from './motor.js';
import { construirEscenarios } from '../utils/generadores.js';

/* ==========================================================================
   MOTOR
   ========================================================================== */

/**
 * Crea un motor de Escape Room listo para jugar.
 *
 * @param {object} unidad  Unidad temática de `src/data/`.
 * @param {object} [opciones] Opciones que se aplican en `iniciar()`.
 * @returns {object} Motor con `iniciar`, `responder`, `avanzar` y `resumen`.
 */
export function crearEscape(unidad, opciones = {}) {
  const reglasPorDefecto = reglasDe('escape');

  let escenarios = [];
  let escenario = null;
  let reloj = null;
  /** `true` cuando la fase actual ya tiene decisión tomada. */
  let decidida = false;

  /** Fase que toca ahora, o `null`. */
  function faseActual() {
    const estado = motor.estado();
    if (!escenario || estado.terminado) return null;
    return escenario.fases?.[estado.indice] || null;
  }

  const motor = crearMotorBase({
    juego: 'escape',
    titulo: 'Escape Room',
    reglas: reglasPorDefecto,

    alIniciar(estado, opcionesInicio) {
      const { escenarios: validados, errores } = construirEscenarios(unidad);
      escenarios = validados;

      if (errores.length > 0) {
        // No se oculta el problema: un escenario con dos opciones correctas es
        // un error de contenido y debe verse en consola, no descubrirse en
        // mitad de una clase.
        console.warn(`[escape] Errores de contenido en "${unidad?.id}":`, errores);
      }

      const pedido = opcionesInicio?.escenario;
      escenario = escenarios.find((e) => e.id === pedido) || escenarios[0] || null;

      decidida = false;
      estado.id = `${unidad?.id || 'unidad'}:escape`;
      estado.unidad = unidad;
      estado.titulo = escenario?.titulo || 'Escape Room';
      estado.ambientacion = escenario?.ambientacion || '';
      estado.briefing = escenario?.briefing || '';
      estado.escenarioActual = escenario?.id || null;
      estado.escenariosDisponibles = escenarios.map((e) => e.id);
      estado.total = escenario?.fases?.length || 0;
      estado.indice = 0;
      estado.respondida = false;
      estado.opcionElegida = null;

      if (!escenario || estado.total === 0) {
        estado.fase = 'terminado';
        estado.terminado = true;
        estado.terminadoCorrectamente = false;
        estado.mensaje = 'Esta unidad todavía no tiene escenarios.';
        return;
      }

      estado.fase = 'jugando';
      estado.instruccion = 'Elige la acción correcta y lee la explicación antes de continuar.';
      estado.mensaje = escenario.briefing || 'Lee la situación y decide.';

      if (!reloj) {
        reloj = crearReloj({
          alTick: (restante) => {
            const actual = motor.estado();
            if (actual.terminado) return;
            actual.tiempoRestante = restante;
            motor.avisar('tick');
          },
          alAgotar: () => {
            const actual = motor.estado();
            if (actual.terminado) return;
            actual.fallos += 1;
            actual.mensaje = '¡Se acabó el tiempo de esta fase!';
            actual.detalle = {
              breve: 'Sin tiempo para decidir.',
              explicacion:
                'En una emergencia real, el tiempo para decidir es limitado. Ensayar la decisión antes es lo que permite actuar.',
              transferencia:
                'Practica con casos reales hasta que la primera decisión sea la correcta sin tener que pensarla.',
            };
            actual.respondida = true;
            decidida = true;
            motor.avisar('tiempo-agotado');
          },
        });
      }

      estado.tiempoRestante = tiempoDeFase(escenario.fases[0], estado);
      reloj.arrancar(estado.tiempoRestante);
    },

    alResponder(estado, idOpcion) {
      if (estado.terminado || decidida) return;

      const fase = faseActual();
      if (!fase) return;

      const elegida = fase.opciones.find((opcion) => opcion.id === idOpcion);
      if (!elegida) return;

      decidida = true;
      estado.respondida = true;
      estado.opcionElegida = idOpcion;
      reloj?.detener();

      const retro = elegida.retroalimentacion || {};

      if (elegida.correcta) {
        estado.aciertos += 1;
        estado.puntos += estado.reglas.puntosFase ?? 10;
        estado.mensaje = retro.breve || 'Decisión correcta.';
      } else {
        estado.fallos += 1;
        estado.mensaje = retro.breve || 'Decisión incorrecta.';
      }

      // Se guarda la decisión para poder mostrar al final qué se eligió.
      estado.decisiones = [
        ...(estado.decisiones || []),
        { fase: fase.id, elegida: idOpcion, correcta: Boolean(elegida.correcta) },
      ];

      estado.detalle = {
        breve: retro.breve || '',
        explicacion: retro.explicacion || '',
        transferencia: retro.transferencia || '',
      };
    },
  });

  /**
   * Segundos disponibles para una fase: lo que declare el escenario manda.
   * @param {object} fase
   * @param {object} estado
   * @returns {number}
   */
  function tiempoDeFase(fase, estado) {
    return fase?.tiempoLimite ?? estado.reglas.tiempoFase ?? 60;
  }

  /**
   * Pasa a la fase siguiente (o termina la partida).
   * @returns {object} Estado resultante.
   */
  motor.avanzarFase = () => {
    const estado = motor.estado();
    if (estado.terminado) return estado;

    // No se avanza sin decidir: se muestra el aviso y se queda en la fase.
    if (!estado.respondida) {
      estado.mensaje = 'Elige una de las acciones disponibles antes de continuar.';
      return estado;
    }

    estado.indice += 1;
    decidida = false;
    estado.respondida = false;
    estado.opcionElegida = null;
    estado.detalle = null;

    if (estado.indice >= (escenario?.fases?.length || 0)) {
      motor.finalizar();
      return estado;
    }

    const siguiente = escenario.fases[estado.indice];
    estado.mensaje = siguiente.texto || '';
    estado.tiempoRestante = tiempoDeFase(siguiente, estado);
    reloj?.arrancar(estado.tiempoRestante);
    motor.avisar('fase');
    return estado;
  };

  /** Fase visible ahora mismo, o `null`. */
  motor.fase = () => faseActual();

  /** Detiene el reloj. La interfaz la llama al salir de la pantalla. */
  motor.pausar = () => {
    reloj?.detener();
  };

  /**
   * Revisión de la partida: una entrada por fase, con lo que se eligió, lo que
   * era correcto y por qué.
   *
   * Se construye al terminar, no durante: leer el escenario por su cuenta para
   * cada decisión mezcla lo que pasó con lo que pudo pasar, y al guardado solo
   * le interesa lo que pasó.
   *
   * @returns {object[]}
   */
  motor.revision = () => {
    const estado = motor.estado();
    const fases = escenario?.fases || [];
    const decisiones = estado.decisiones || [];

    return decisiones.map((decision, indice) => {
      const fase = fases.find((f) => f.id === decision.fase) || fases[indice] || {};
      const acciones = Array.isArray(fase.opciones) ? fase.opciones : [];
      const elegida = acciones.find((a) => a.id === decision.elegida);
      const correcta = acciones.find((a) => a.correcta);
      const retro = correcta?.retroalimentacion || {};

      return {
        numero: indice + 1,
        titulo: fase.texto || fase.titulo || `Fase ${indice + 1}`,
        acierto: decision.correcta,
        elegida: elegida?.texto || null,
        correcta: correcta?.texto || null,
        breve: retro.breve || '',
        explicacion: retro.explicacion || '',
        transferencia: retro.transferencia || '',
      };
    });
  };

  /** Resumen de la partida, listo para la pantalla de resultados. */
  motor.resumen = () => {
    const estado = motor.estado();
    const porcentaje = calcularPorcentaje(estado.aciertos, estado.total || 1);
    return {
      juego: 'escape',
      titulo: estado.titulo,
      ambientacion: estado.ambientacion,
      aciertos: estado.aciertos,
      fallos: estado.fallos,
      puntos: estado.puntos,
      total: estado.total,
      porcentaje,
      medalla: medallaPara(porcentaje),
      completado: estado.terminado,
      revision: motor.revision(),
    };
  };

  if (opciones && Object.keys(opciones).length > 0) motor.iniciar(opciones);

  return motor;
}
