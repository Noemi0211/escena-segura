/**
 * sprint.js — MOTOR DEL SPRINT.
 *
 * Capa: games. LÓGICA DE JUEGO ÚNICAMENTE.
 *
 * ---------------------------------------------------------------------------
 * QUÉ HACE
 * ---------------------------------------------------------------------------
 * Presenta las preguntas de una unidad una detrás de otra, con cuenta atrás, y
 * puntúa dos cosas: acertar y rapidez. Al responder muestra la realimentación
 * (acierto, error y explicación) antes de pasar a la siguiente, porque en un
 * sprint de seguridad la explicación es el contenido con más valor didáctico:
 * responder rápido sin entender no sirve de nada.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ES REUTILIZABLE PARA UNA UNIDAD NUEVA
 * ---------------------------------------------------------------------------
 * No hay ni un solo texto formativo aquí. El motor consume el mazo que
 * `construirMazoSprint()` produce y que ya viene normalizado: cada pregunta tiene
 * `enunciado`, `opciones` (con `correcta`), `correctaId` y `retroalimentacion`.
 * Añadir una unidad con preguntas nuevas no requiere tocar este fichero.
 *
 * ---------------------------------------------------------------------------
 * PUNTUACIÓN
 * ---------------------------------------------------------------------------
 *   acierto  = puntosAcierto + puntosVelocidad * (tiempoRestante / tiempoTotal)
 *
 * El componente de velocidad se pondera por el tiempo restante, no por un
 * "bono si_acertaste_rápido": así la diferencia entre responder en el segundo 2
 * y en el segundo 18 es proporcional y explicable, que es como debe ser en un
 * recurso formativo. Si además se falla, la resta es fija: así el error siempre
 * cuesta.
 *
 * @module games/sprint
 */

import {
  crearMotorBase,
  crearReloj,
  reglasDe,
  calcularPorcentaje,
  medallaPara,
} from './motor.js';
import { construirMazoSprint } from '../utils/generadores.js';

/* ==========================================================================
   MOTOR
   ========================================================================== */

/**
 * Crea un motor de Sprint listo para jugar.
 *
 * @param {object} unidad  Unidad temática de `src/data/`.
 * @param {object} [opciones] Opciones que se aplican en `iniciar()`.
 * @returns {object} Motor con `iniciar`, `responder`, `siguiente` y `resumen`.
 */
export function crearSprint(unidad, opciones = {}) {
  const reglasPorDefecto = reglasDe('sprint');

  let mazo = [];
  let reloj = null;
  /** `true` cuando la pregunta actual ya está respondida (muestra realimentación). */
  let respondida = false;

  /**
   * Pregunta que toca ahora, o `null` si la partida terminó.
   * @returns {object|null}
   */
  function preguntaActual() {
    const estado = motor.estado();
    if (estado.terminado) return null;
    return mazo[estado.indice] || null;
  }

  const motor = crearMotorBase({
    juego: 'sprint',
    titulo: 'Sprint',
    reglas: reglasPorDefecto,

    alIniciar(estado, opcionesInicio) {
      const semilla = opcionesInicio?.semilla;
      const pedidas = opcionesInicio?.cantidad ?? estado.reglas.cantidad ?? 10;

      mazo = construirMazoSprint(unidad, pedidas, semilla).preguntas;
      respondida = false;

      estado.id = `${unidad?.id || 'unidad'}:sprint`;
      estado.unidad = unidad;
      estado.titulo = 'Sprint';
      estado.instruccion =
        'Responde antes de que se agote el tiempo. Cada acierto suma más cuanto antes llega.';
      estado.total = mazo.length;
      estado.indice = 0;
      estado.respondida = false;
      estado.opcionElegida = null;

      if (mazo.length === 0) {
        estado.fase = 'terminado';
        estado.terminado = true;
        estado.terminadoCorrectamente = false;
        estado.mensaje = 'Esta unidad todavía no tiene preguntas de sprint.';
        return;
      }

      estado.fase = 'jugando';
      estado.mensaje = 'Primera pregunta. ¡Conta con el reloj!';

      // El reloj se crea una sola vez por partida y se rearranca por pregunta.
      if (!reloj) {
        reloj = crearReloj({
          alTick: (restante) => {
            const actual = motor.estado();
            if (actual.terminado) return;
            actual.tiempoRestante = restante;
            // Un tique no es una respuesta: se avisa por el canal de avisos
            // para que la interfaz refresque el contador sin reinterpretar el
            // gesto como un acierto.
            motor.avisar('tick');
          },
          alAgotar: () => {
            const actual = motor.estado();
            if (actual.terminado) return;
            actual.mensaje = '¡Se acabó el tiempo!';
            // Agotar el tiempo cuenta como fallo, no como acierto.
            actual.fallos += 1;
            actual.puntos = Math.max(0, actual.puntos - (actual.reglas.puntosFallo ?? 25));
            // La pregunta que se ha quedado sin contestar entra en la revisión
            // como fallada. Sin esto, agotar el reloj hacía desaparecer la
            // pregunta de la revisión y el alumno no veía su respuesta
            // correcta, que es justo lo que necesita repasar.
            const sinContestar = preguntaActual();
            if (sinContestar) sinContestar.elegidaId = null;
            actual.indice += 1;
            if (actual.indice >= mazo.length) {
              motor.finalizar();
              return;
            }
            actual.fase = 'jugando';
            actual.respondida = false;
            actual.opcionElegida = null;
            actual.mensaje = 'Sin tiempo. Siguiente pregunta.';
            actual.tiempoRestante = actual.reglas.tiempoPregunta;
            reloj.arrancar(actual.reglas.tiempoPregunta);
            motor.avisar('tiempo-agotado');
          },
        });
      }

      estado.tiempoRestante = estado.reglas.tiempoPregunta;
      reloj.arrancar(estado.reglas.tiempoPregunta);
    },

    alResponder(estado, idOpcion) {
      if (estado.terminado || respondida) return;

      const pregunta = preguntaActual();
      if (!pregunta) return;

      const elegida = pregunta.opciones.find((opcion) => opcion.id === idOpcion);
      if (!elegida) return;

      respondida = true;
      estado.respondida = true;
      estado.opcionElegida = idOpcion;

      // Se anota qué se eligió en ESTA pregunta. Es lo que permite después
      // mostrar la respuesta correcta de lo fallado, en vez de un marcador
      // sin nada que repasar. Se escribe en la pregunta y no en el estado
      // porque el mazo es lo que se recorre al construir la revisión.
      pregunta.elegidaId = idOpcion;

      if (elegida.correcta) {
        const { puntosAcierto, puntosVelocidad, tiempoPregunta } = estado.reglas;
        const restante = Math.max(0, estado.tiempoRestante ?? 0);
        const proporcion = tiempoPregunta > 0 ? restante / tiempoPregunta : 0;

        estado.aciertos += 1;
        estado.puntos += Math.round(puntosAcierto + puntosVelocidad * proporcion);
        estado.mensaje = pregunta.retroalimentacion?.acierto || 'Correcto.';
        estado.detalle = { explicacion: pregunta.retroalimentacion?.explicacion || '' };
      } else {
        estado.fallos += 1;
        estado.puntos = Math.max(0, estado.puntos - (estado.reglas.puntosFallo ?? 25));
        estado.mensaje = pregunta.retroalimentacion?.error || 'Respuesta incorrecta.';
        estado.detalle = { explicacion: pregunta.retroalimentacion?.explicacion || '' };
      }

      // El reloj se para: la realimentación se lee sin presión.
      reloj?.detener();
      estado.tiempoRestante = estado.tiempoRestante ?? 0;
    },
  });

  /**
   * Pasa a la siguiente pregunta (o termina la partida).
   * @returns {object} Estado resultante.
   */
  motor.siguiente = () => {
    const estado = motor.estado();
    if (estado.terminado) return estado;

    estado.indice += 1;
    respondida = false;
    estado.respondida = false;
    estado.opcionElegida = null;
    estado.detalle = null;

    if (estado.indice >= mazo.length) {
      motor.finalizar();
      return estado;
    }

    estado.mensaje = 'Siguiente pregunta.';
    estado.tiempoRestante = estado.reglas.tiempoPregunta;
    reloj?.arrancar(estado.reglas.tiempoPregunta);
    // Sin este aviso la vista no se repinta y la partida parece congelada: el
    // cambio de pregunta no es una respuesta, pero sí es un cambio de pantalla.
    motor.avisar('siguiente');
    return estado;
  };

  /** Pregunta visible ahora mismo, o `null`. */
  motor.pregunta = () => preguntaActual();

  /** Detiene el reloj. La interfaz la llama al salir de la pantalla de juego. */
  motor.pausar = () => {
    reloj?.detener();
  };

  /**
   * Revisión pregunta a pregunta: qué se respondió, cuál era la correcta y por
   * qué. Es lo que convierte la pantalla de resultados en un repaso y no en un
   * marcador.
   *
   * El mazo se recorre entero, también las preguntas no contestadas: el valor
   * de la revisión está en ver la respuesta correcta de lo que se falló, y una
   * pregunta sin contestar también se falló.
   *
   * @returns {object[]}
   */
  motor.revision = () => {
    return mazo.map((pregunta, indice) => {
      const elegida = pregunta.opciones.find(
        (opcion) => opcion.id === pregunta.elegidaId
      );
      const correcta = pregunta.opciones.find((opcion) => opcion.correcta);
      const retro = pregunta.retroalimentacion || {};
      const respondida = Boolean(pregunta.elegidaId);

      return {
        numero: indice + 1,
        titulo: pregunta.enunciado,
        respondida,
        acierto: respondida && elegida?.correcta === true,
        elegida: elegida?.texto || null,
        correcta: correcta?.texto || null,
        breve: respondida
          ? elegida?.correcta
            ? retro.acierto || ''
            : retro.error || ''
          : retro.error || '',
        explicacion: retro.explicacion || '',
        transferencia: retro.transferencia || '',
      };
    });
  };

  /** Resumen de la partida, listo para la pantalla de resultados. */
  motor.resumen = () => {
    const estado = motor.estado();
    const respondidas = estado.aciertos + estado.fallos;
    const porcentaje = calcularPorcentaje(estado.aciertos, respondidas || 1);
    return {
      juego: 'sprint',
      titulo: estado.titulo,
      aciertos: estado.aciertos,
      fallos: estado.fallos,
      puntos: estado.puntos,
      total: mazo.length,
      porcentaje,
      medalla: medallaPara(porcentaje),
      completado: estado.terminado,
      revision: motor.revision(),
    };
  };

  if (opciones && Object.keys(opciones).length > 0) motor.iniciar(opciones);

  return motor;
}
