/**
 * clasificacion.js — Unidad temática 1: CLASIFICACIÓN DE EMERGENCIAS.
 *
 * Capa: DATOS. Contenido estructurado y nada más.
 *
 * ---------------------------------------------------------------------------
 * REGLAS DE ESTE ARCHIVO
 * ---------------------------------------------------------------------------
 * 1. Solo datos. Ninguna función, ningún `if`, ningún bucle.
 * 2. Cada entrada lleva un `id` estable: se usa como clave de emparejamiento,
 *    de almacenamiento y de URL. Renombrar un `id` rompe el progreso ya
 *    guardado por el alumnado.
 * 3. El texto está redactado para el ciclo de Emergencias Sanitarias: frases
 *    cortas, vocabulario técnico y ejemplos reales.
 *
 * ---------------------------------------------------------------------------
 * PROCEDENCIA
 * ---------------------------------------------------------------------------
 * Fuente: `_privado-NoemiCelaya/documentos-base-escena-segura/Clasificación.docx`
 * (apartados 1.2.1 clasificación por origen, 1.2.2 por escenario y 1.2.3 por
 * gravedad).
 * Ese documento es MATERIAL DE TRABAJO: no se publica, no se copia al
 * despliegue y no se muestra al alumnado. Aquí solo queda el contenido
 * reelaborado como datos de juego.
 *
 * ---------------------------------------------------------------------------
 * CONTRATO DE DATOS (idéntico en las tres unidades)
 * ---------------------------------------------------------------------------
 *   id, nombre, subtitulo, descripcion, icono, acento, orden, objetivos
 *   catalogos : { <nombre>: [{ id, nombre, definicion, ejemplo, ... }] }
 *   conceptos : [{ id, termino, definicion, ejemplo }]
 *   casos     : [{ id, etiqueta, contexto, tipo, clasificacion, explicacion }]
 *   memoria   : { configuraciones: [{ id, titulo, izquierda, derecha, limite }] }
 *   sprint    : { cantidad, plantillas: [{ id, enunciado, correcta, ... }] }
 *   escape    : { escenarios: [{ id, titulo, briefing, fases: [...] }] }
 *
 * @module data/clasificacion
 */

/* ==========================================================================
   CATÁLOGOS DE REFERENCIA
   ========================================================================== */

const catalogos = {
  /* --- 1.2.1. Clasificación por ORIGEN --------------------------------- */
  origen: [
    {
      id: 'natural',
      nombre: 'Origen natural',
      definicion:
        'Se producen como consecuencia de fenómenos de la naturaleza, sin intervención directa de las personas.',
      ejemplo:
        'Inundaciones, tormentas, nevadas, olas de calor o de frío, terremotos o deslizamientos de tierra.',
      implicacion:
        'Dificultan el acceso de los equipos de emergencia, alteran la estabilidad de las estructuras y ponen en riesgo la seguridad de quienes intervienen.',
      medida:
        'Seguir las alertas meteorológicas y coordinar la actuación con protección civil y rescate.',
      icono: 'gota',
    },
    {
      id: 'tecnologico',
      nombre: 'Origen tecnológico',
      definicion:
        'Su causa es el fallo o mal funcionamiento de infraestructuras, sistemas o equipos creados por las personas.',
      ejemplo:
        'Accidentes industriales, explosiones, fugas de sustancias peligrosas o accidentes de transporte.',
      implicacion:
        'El riesgo químico, eléctrico o estructural obliga a extremar las medidas de protección y, en muchos casos, a esperar la autorización de los equipos especializados.',
      medida: 'Coordinarse con bomberos y servicios técnicos antes de acceder a la zona.',
      icono: 'engranaje',
    },
    {
      id: 'antropico',
      nombre: 'Origen antrópico',
      definicion:
        'Son provocadas directamente por la acción humana, de forma intencionada o por negligencia.',
      ejemplo: 'Agresiones, atentados terroristas o accidentes domésticos o de tráfico.',
      implicacion:
        'Suelen requerir la intervención de las fuerzas de seguridad antes de iniciar la asistencia sanitaria, porque pueden implicar riesgos activos para el personal o para las víctimas.',
      medida: 'Documentar la intervención con rigor: puede tener relevancia legal.',
      icono: 'persona',
    },
  ],

  /* --- 1.2.3. Clasificación por GRAVEDAD ------------------------------- */
  gravedad: [
    {
      id: 'leve',
      nombre: 'Emergencia leve',
      definicion: 'Afecta habitualmente a una sola persona y no supone riesgo vital.',
      ejemplo: 'Caída sin lesión grave de una persona mayor en su domicilio.',
      consecuencia: 'Puede resolverse en el lugar, con traslado opcional.',
      icono: 'punto-verde',
    },
    {
      id: 'grave',
      nombre: 'Emergencia grave',
      definicion: 'Implica riesgo vital o lesiones de importancia.',
      ejemplo: 'Accidente de tráfico con una víctima fracturada y consciente.',
      consecuencia: 'Activa recursos y personal, y exige traslado hospitalario.',
      icono: 'punto-amarillo',
    },
    {
      id: 'muy-grave',
      nombre: 'Emergencia muy grave',
      definicion: 'Supone una amenaza inmediata para la vida o la integridad de varias personas.',
      ejemplo: 'Incendio en un almacén con sustancias químicas y varios afectados.',
      consecuencia:
        'Activa servicios de varios organismos y exige coordinación previa al acceso.',
      icono: 'punto-naranja',
    },
    {
      id: 'catastrofica',
      nombre: 'Emergencia catastrófica',
      definicion:
        'Desbordan los recursos disponibles por el elevado número de víctimas o la magnitud del suceso.',
      ejemplo: 'Terremoto que derriba viviendas y deja aislada una localidad.',
      consecuencia:
        'Requiere activar planes de protección civil y apoyo de medios extraordinarios.',
      icono: 'punto-rojo',
    },
  ],

  /* --- 1.2.2. Clasificación por ESCENARIO ------------------------------ */
  escenario: [
    {
      id: 'domestico',
      nombre: 'Escenario doméstico',
      accesibilidad: 'Escaleras, ascensores, espacios reducidos, etc.',
      riesgos: 'Gas doméstico, objetos personales, mascotas, etc.',
      evacuacion: 'Dificultad para las maniobras y peso en las escaleras.',
      coordinacion: 'Gestión de los familiares presentes.',
    },
    {
      id: 'laboral',
      nombre: 'Escenario laboral',
      accesibilidad: 'Variable según el tipo de espacio.',
      riesgos: 'Maquinaria, sustancias químicas, altura, espacios confinados, etc.',
      evacuacion: 'Condicionada por los riesgos profesionales presentes.',
      coordinacion: 'Servicios de prevención e investigación posterior obligatoria.',
    },
    {
      id: 'trafico',
      nombre: 'Escenario de tráfico',
      accesibilidad: 'Generalmente buena, con circulación activa.',
      riesgos: 'Atropello, colisión secundaria, combustibles, etc.',
      evacuacion: 'Condicionada por la circulación y los riesgos presentes en la vía.',
      coordinacion: 'Fuerzas de seguridad siempre presentes.',
    },
    {
      id: 'deportivo',
      nombre: 'Escenario deportivo',
      accesibilidad: 'Muy variable según la ubicación.',
      riesgos: 'Riesgos asociados a la actividad: altura, agua, espacios naturales, etc.',
      evacuacion: 'Puede requerir rescate especializado.',
      coordinacion: 'Servicios de rescate específicos (montaña, acuático, etc.).',
    },
    {
      id: 'espacios-publicos',
      nombre: 'Espacio público',
      accesibilidad: 'Generalmente buena, aunque pueden existir aglomeraciones.',
      riesgos: 'Control de curiosos y visibilidad pública.',
      evacuacion: 'Necesidad de mantener un espacio de trabajo seguro.',
      coordinacion: 'Fuerzas de seguridad para el control de accesos.',
    },
    {
      id: 'rural-aislado',
      nombre: 'Escenario rural y aislado',
      accesibilidad: 'Limitada, caminos en mal estado, grandes distancias, etc.',
      riesgos: 'Condiciones meteorológicas adversas, comunicaciones deficientes, etc.',
      evacuacion: 'Tiempos prolongados y posible necesidad de medios extraordinarios.',
      coordinacion: 'Helicóptero, vehículos especiales y otros recursos específicos.',
    },
  ],
};

/* ==========================================================================
   CONCEPTOS CLAVE
   ========================================================================== */

const conceptos = [
  {
    id: 'c-clasificar',
    termino: 'Clasificar una situación de emergencia',
    definicion:
      'Identificar de qué tipo se trata para poder actuar con mayor eficacia y seguridad.',
    ejemplo:
      'No es lo mismo intervenir en un accidente de tráfico que en una inundación o en una emergencia doméstica.',
  },
  {
    id: 'c-para-que-sirve',
    termino: 'Para qué sirve clasificar',
    definicion:
      'Permite anticipar los riesgos, preparar los materiales necesarios para responder con rapidez y aplicar los protocolos específicos más adecuados.',
    ejemplo:
      'Saber que hay riesgo químico permite pedir el equipo de protección adecuado antes de bajar del vehículo.',
  },
  {
    id: 'c-factores',
    termino: 'Factores que condicionan la clasificación',
    definicion:
      'Las causas que originan la emergencia, el escenario donde ocurre y la gravedad de sus efectos condicionan la organización del trabajo y la coordinación con otros servicios.',
    ejemplo:
      'Una misma fuga de gas en una fábrica (laboral) y en una vivienda (doméstico) no se organizan igual.',
  },
  {
    id: 'c-evaluacion-dinamica',
    termino: 'Evaluación dinámica de riesgos',
    definicion:
      'Proceso continuo mediante el cual el personal de emergencias observa, interpreta y actualiza la información del entorno durante toda la intervención.',
    ejemplo:
      'Lo que era seguro al llegar puede dejar de serlo cuando cambia el viento o se acumula más gente.',
  },
];

/* ==========================================================================
   CASOS: SITUACIONES REALES
   Cada caso se clasifica por los TRES ejes. Este es el material que alimenta
   Memory (emparejar) y Sprint (preguntar).
   ========================================================================== */

const casos = [
  /* --- Origen natural --------------------------------------------------- */
  {
    id: 'c-terremoto',
    etiqueta: 'Un terremoto derriba viviendas y aísla a una localidad',
    contexto:
      'Ha temblado toda la noche. Hay edificios derrumbados, cortes de agua y luz, y la única vía de acceso está cortada.',
    tipo: 'Terremoto',
    clasificacion: { origen: 'natural', gravedad: 'catastrofica', escenario: 'rural-aislado' },
    riesgos: ['estructurales', 'ambientales'],
    explicacion:
      'El origen es natural porque el seísmo ha ocurrido sin intervención humana. La gravedad es catastrófica porque amenaza a toda la población y desborda los recursos disponibles. El escenario es rural y aislado porque las comunicaciones y los accesos son deficientes.',
  },
  {
    id: 'c-inundacion-urbana',
    etiqueta: 'Lluvia torrencial inunda las calles del centro de una ciudad',
    contexto:
      'El agua llega a la altura del tobillo y sigue subiendo. Hay vehículos atrapados y un garaje con instalación de gas.',
    tipo: 'Inundación',
    clasificacion: { origen: 'natural', gravedad: 'muy-grave', escenario: 'espacios-publicos' },
    riesgos: ['agentes-externos', 'estructurales'],
    explicacion:
      'Es natural por la lluvia intensa, muy grave porque el agua avanza y hay varias personas aisladas, y ocurre en un espacio público donde además hay que controlar la circulación.',
  },
  {
    id: 'c-nevada',
    etiqueta: 'Una nevada intensa aísla un pueblo durante 48 horas',
    contexto:
      'La carretera de acceso está cortada y las temperaturas bajan de 15 grados bajo cero.',
    tipo: 'Nevada',
    clasificacion: { origen: 'natural', gravedad: 'grave', escenario: 'rural-aislado' },
    riesgos: ['ambientales', 'psicologicos'],
    explicacion:
      'Es natural, grave por el riesgo de hipotermia, y rural aislado: sin acceso, los tiempos de evacuación se prolongan y hacen falta medios extraordinarios.',
  },
  {
    id: 'c-ola-calor',
    etiqueta: 'Ola de calor con varias personas mayores desmayadas',
    contexto:
      'Se superan los 42 grados en una residencia. Tres vecinos presentan confusión y deshidratación.',
    tipo: 'Ola de calor',
    clasificacion: { origen: 'natural', gravedad: 'grave', escenario: 'espacios-publicos' },
    riesgos: ['ambientales'],
    explicacion:
      'Es natural y grave: afecta a un grupo vulnerable con riesgo vital, pero no llega a la categoría catastrófica porque no hay un número de víctimas que desborde los recursos.',
  },
  {
    id: 'c-deslizamiento',
    etiqueta: 'Un deslizamiento de ladera corta una carretera de montaña',
    contexto:
      'Cientos de metros de tierra y piedra cubren la calzada. Sigue lloviendo con fuerza y hay vehículos atrapados en el tramo.',
    tipo: 'Deslizamiento de tierra',
    clasificacion: { origen: 'natural', gravedad: 'muy-grave', escenario: 'rural-aislado' },
    riesgos: ['estructurales', 'ambientales'],
    explicacion:
      'El deslizamiento es un fenómeno natural. Es muy grave porque hay una amenaza inmediata para la integridad de las personas atrapadas. El escenario es rural porque el acceso es limitado.',
  },
  {
    id: 'c-tormenta',
    etiqueta: 'Tormenta eléctrica con viento fuerte sobre una vía de circulación',
    contexto:
      'Hay ramas caídas sobre los coches, transformadores volcados y cableado en el suelo. La tormenta continúa.',
    tipo: 'Tormenta',
    clasificacion: { origen: 'natural', gravedad: 'grave', escenario: 'trafico' },
    riesgos: ['fisicos', 'ambientales'],
    explicacion:
      'Es natural, grave por el riesgo de electrocución y de lesiones por objetos que caen, y en escenario de tráfico por la vía y los vehículos afectados.',
  },

  /* --- Origen tecnológico ----------------------------------------------- */
  {
    id: 'c-fuga-gas',
    etiqueta: 'Fuga de gas natural en una instalación industrial',
    contexto:
      'Se detecta un fuerte olor a gas junto a la nave de producción. Hay doce trabajadores en el interior.',
    tipo: 'Fuga de gas',
    clasificacion: { origen: 'tecnologico', gravedad: 'muy-grave', escenario: 'laboral' },
    riesgos: ['quimicos', 'fisicos'],
    explicacion:
      'El fallo de una instalación construida por las personas lo convierte en origen tecnológico. Es muy grave por el riesgo de explosión. El personal de emergencias debe esperar la valoración de los servicios especializados.',
  },
  {
    id: 'c-vertido-cisterna',
    etiqueta: 'Un camión cisterna vuelca y vierte combustible en la carretera',
    contexto:
      'El tráiler ha cruzado la calzada. Hay un charco que se extiende y empieza a alcanzar el arcén.',
    tipo: 'Vertido de sustancias peligrosas',
    clasificacion: { origen: 'tecnologico', gravedad: 'muy-grave', escenario: 'trafico' },
    riesgos: ['quimicos', 'ambientales', 'agentes-externos'],
    explicacion:
      'Es tecnológico por ser un accidente de transporte. Muy grave por la amenaza inmediata de incendio. En tráfico hay que señalizar y protegerse del atropello mientras se trabaja.',
  },
  {
    id: 'c-incendio-quimico',
    etiqueta: 'Incendio en un almacén que guarda sustancias químicas',
    contexto:
      'Sale humo denso del almacén. En el exterior hay contenedores de productos químicos esperando ser evacuados.',
    tipo: 'Incendio con productos químicos',
    clasificacion: { origen: 'tecnologico', gravedad: 'muy-grave', escenario: 'laboral' },
    riesgos: ['quimicos', 'agentes-externos', 'fisicos'],
    explicacion:
      'Un incendio en un almacén de productos es tecnológico por el almacenamiento y el proceso industrial. La combinación de fuego y químicos obliga a esperar a bomberos antes de acceder.',
  },
  {
    id: 'c-electrico',
    etiqueta: 'Cable de alta tensión caído sobre la fachada de un edificio',
    contexto:
      'El cable hace contacto con la estructura metálica y se ven chispas. Hay vecinos en las ventanas.',
    tipo: 'Electrocución',
    clasificacion: { origen: 'tecnologico', gravedad: 'grave', escenario: 'espacios-publicos' },
    riesgos: ['fisicos', 'estructurales'],
    explicacion:
      'El fallo de la instalación es tecnológico. Grave por el riesgo de electrocución. No se accede a la zona hasta que los servicios técnicos confirmen su seguridad.',
  },
  {
    id: 'c-ascensor',
    etiqueta: 'Persona atrapada en el ascensor de un edificio de oficinas',
    contexto:
      'El ascensor se ha detenido entre plantas. La persona está consciente y se encuentra bien.',
    tipo: 'Atrapamiento en ascensor',
    clasificacion: { origen: 'tecnologico', gravedad: 'leve', escenario: 'laboral' },
    riesgos: ['psicologicos'],
    explicacion:
      'Avería de un elemento construido por las personas, pero sin riesgo vital para una sola persona: es una emergencia leve. Aun así, hay que mantener a la persona calmada y no dejarla sola.',
  },
  {
    id: 'c-vertido-rio',
    etiqueta: 'Vertido de un residuo tóxico en un río que atraviesa una finca',
    contexto:
      'El agua ha cambiado de color y huele mal. Hay peces muertos en la orilla y una finca de regadío sin agua potable.',
    tipo: 'Contaminación ambiental',
    clasificacion: { origen: 'tecnologico', gravedad: 'grave', escenario: 'rural-aislado' },
    riesgos: ['agentes-externos', 'ambientales', 'quimicos'],
    explicacion:
      'El vertido procede de una actividad humana con una instalación que ha fallado. Grave por la exposición a toxinas y por su impacto en la salud de las personas que usan el agua.',
  },

  /* --- Origen antrópico -------------------------------------------------- */
  {
    id: 'c-atentado',
    etiqueta: 'Explosión en el aparcamiento de un centro comercial',
    contexto:
      'Hay daños estructurales en el techo y numerosas personas heridas en el aparcamiento.',
    tipo: 'Atentado terrorista',
    clasificacion: { origen: 'antropico', gravedad: 'catastrofica', escenario: 'espacios-publicos' },
    riesgos: ['estructurales', 'psicologicos', 'agentes-externos'],
    explicacion:
      'El origen es antrópico e intencionado. Catastrófico por el número de víctimas. Necesita fuerzas de seguridad antes de iniciar la asistencia sanitaria.',
  },
  {
    id: 'c-agresion',
    etiqueta: 'Agresión con arma blanca dentro de una vivienda',
    contexto:
      'La puerta está rota. Dentro hay una persona herida y el agresor sigue dentro.',
    tipo: 'Agresión',
    clasificacion: { origen: 'antropico', gravedad: 'grave', escenario: 'domestico' },
    riesgos: ['psicologicos', 'fisicos'],
    explicacion:
      'Agresión intencionada: origen antrópico. Grave por riesgo vital. En un espacio doméstico se suman problemas de accesibilidad y la presencia de familiares.',
  },
  {
    id: 'c-siniestro-cn',
    etiqueta: 'Siniestro mortal en una carretera nacional con mala visibilidad',
    contexto:
      'Hay tres vehículos implicados, uno de ellos ardiendo. La vía está cortada y hay peatones en las aceras.',
    tipo: 'Accidente de tráfico',
    clasificacion: { origen: 'antropico', gravedad: 'muy-grave', escenario: 'trafico' },
    riesgos: ['estructurales', 'agentes-externos', 'fisicos'],
    explicacion:
      'La causa inmediata es la velocidad o el fallo humano, no un fenómeno natural: origen antrópico por negligencia. Muy grave por la amenaza inmediata a varias personas.',
  },
  {
    id: 'c-incendio-domestico',
    etiqueta: 'Incendio en una vivienda causado por una vela mal apagada',
    contexto:
      'Sale humo espeso por las ventanas. Dentro hay una persona de 78 años con movilidad reducida.',
    tipo: 'Incendio doméstico',
    clasificacion: { origen: 'antropico', gravedad: 'grave', escenario: 'domestico' },
    riesgos: ['agentes-externos', 'estructurales', 'psicologicos'],
    explicacion:
      'La causa es la negligencia humana: origen antrópico. Grave por la vulnerabilidad de la persona. En un espacio doméstico la evacuación es especialmente complicada.',
  },
  {
    id: 'c-caida-deporte',
    etiqueta: 'Caída de altura durante una competición en un pabellón cubierto',
    contexto:
      'Un deportista cae de la plataforma y golpea el suelo. No se ha aislado todavía del resto de la competición.',
    tipo: 'Accidente deportivo',
    clasificacion: { origen: 'antropico', gravedad: 'grave', escenario: 'deportivo' },
    riesgos: ['agravamiento-lesiones', 'estructurales', 'psicologicos'],
    explicacion:
      'Accidente ligado al rendimiento deportivo, de origen humano. Grave por la posible lesión medular. No mover a la víctima sin control del eje corporal es crítico.',
  },
  {
    id: 'c-ahogamiento',
    etiqueta: 'Ahogamiento de un nadador en la piscina de un centro deportivo',
    contexto:
      'El nadador ha sido extraído del agua y está inconsciente. En la orilla hay socorristas y padres expectantes.',
    tipo: 'Ahogamiento',
    clasificacion: { origen: 'antropico', gravedad: 'muy-grave', escenario: 'deportivo' },
    riesgos: ['ambientales', 'psicologicos'],
    explicacion:
      'Aunque el agua es un elemento natural, el episodio se produce por una conducta humana, por lo que en este banco se clasifica como antrópico. Muy grave por la parada cardiorrespiratoria.',
  },
  {
    id: 'c-incendio-forestal',
    etiqueta: 'Incendio forestal que amenaza una urbanización de casas',
    contexto:
      'El fuego avanza con viento hacia las viviendas. Hay un depósito de gasoil cerca.',
    tipo: 'Incendio forestal',
    clasificacion: { origen: 'antropico', gravedad: 'catastrofica', escenario: 'rural-aislado' },
    riesgos: ['ambientales', 'agentes-externos', 'estructurales'],
    explicacion:
      'La mayoría de los incendios forestales tienen causa humana. Catastrófico porque amenaza a toda una población y puede evolucionar rápidamente con el viento.',
  },
  {
    id: 'c-caida-domicilio',
    etiqueta: 'Una persona mayor cae en su domicilio y se levanta sin lesiones',
    contexto:
      'Está consciente, no ha perdido el conocimiento y no tiene dolor de cabeza. Vive sola.',
    tipo: 'Caída doméstica',
    clasificacion: { origen: 'antropico', gravedad: 'leve', escenario: 'domestico' },
    riesgos: ['agravamiento-lesiones', 'psicologicos'],
    explicacion:
      'La gravedad depende de las consecuencias, no de la edad: sin riesgo vital y con una sola persona afectada, es leve. Aun así, una caída en una persona mayor requiere valoración.',
  },
  {
    id: 'c-mareo-via',
    etiqueta: 'Una persona se marea y cae en la vía pública sin lesionarse',
    contexto:
      'Se ha levantado mareado, ha caído y se ha incorporado solo. No se golpeó la cabeza.',
    tipo: 'Síncope en vía pública',
    clasificacion: { origen: 'antropico', gravedad: 'leve', escenario: 'espacios-publicos' },
    riesgos: ['ambientales', 'fisicos'],
    explicacion:
      'Sin riesgo vital y con una sola persona afectada: emergencia leve. En espacio público hay que controlar la visibilidad y el riesgo de atropello.',
  },
];

/* ==========================================================================
   MEMORY: CONFIGURACIONES DECLARATIVAS
   Aquí no se escribe ninguna carta. Solo se declara QUÉ campos se emparejan.
   `clave` indica por qué campo se indexa la contraparte; por defecto es `id`.
   ========================================================================== */

const memoria = {
  configuraciones: [
    {
      id: 'situacion-clasificacion',
      titulo: 'Situación ↔ Tipo de emergencia',
      instruccion:
        'Une cada situación con el tipo de emergencia que representa. Antes de clasificar, pregúntate qué está ocurriendo exactamente.',
      izquierda: { fuente: 'casos', campo: 'etiqueta', etiqueta: 'Situación' },
      derecha: {
        fuente: 'casos',
        clave: 'tipo',
        campo: 'tipo',
        enlazadoPor: 'tipo',
        etiqueta: 'Tipo',
      },
      limite: 8,
    },
    {
      id: 'situacion-origen',
      titulo: 'Situación ↔ Origen',
      instruccion:
        'Une cada situación con su clasificación por origen: natural, tecnológico o antrópico.',
      izquierda: { fuente: 'casos', campo: 'etiqueta', etiqueta: 'Situación' },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'origen',
        campo: 'nombre',
        enlazadoPor: 'clasificacion.origen',
        etiqueta: 'Origen',
      },
      limite: 8,
    },
    {
      id: 'situacion-gravedad',
      titulo: 'Situación ↔ Gravedad',
      instruccion:
        'Une cada situación con su nivel de gravedad. Recuerda: la gravedad depende de las consecuencias, no del aspecto de la escena.',
      izquierda: { fuente: 'casos', campo: 'etiqueta', etiqueta: 'Situación' },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'gravedad',
        campo: 'nombre',
        enlazadoPor: 'clasificacion.gravedad',
        etiqueta: 'Gravedad',
      },
      limite: 8,
    },
    {
      id: 'situacion-escenario',
      titulo: 'Situación ↔ Escenario',
      instruccion:
        'Une cada situación con el escenario donde se produce. El escenario decide cómo se trabaja, no solo dónde.',
      izquierda: { fuente: 'casos', campo: 'etiqueta', etiqueta: 'Situación' },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'escenario',
        campo: 'nombre',
        enlazadoPor: 'clasificacion.escenario',
        etiqueta: 'Escenario',
      },
      limite: 8,
    },
  ],
};

/* ==========================================================================
   SPRINT: PLANTILLAS DE PREGUNTAS
   `correcta` NO contiene la respuesta: indica de dónde la obtiene el motor.
   El contexto de resolución es `{ caso, unidad }`, de modo que los marcadores
   `{caso.etiqueta}` se rellenan con el caso elegido en esa ronda.
   ========================================================================== */

const sprint = {
  cantidad: 10,
  plantillas: [
    {
      id: 'sprint-origen',
      tipo: 'opcion-multiple',
      // Tres opciones: 1 correcta y 2 distractores. El original enumera
      // exactamente tres orígenes (natural, tecnológico, antrópico) y un cuarto
      // sería inventar taxonomía. Ver `agents.md` §7.6.
      opcionesMinimas: 3,
      enunciado: '¿Cuál es el origen de esta situación? «{caso.etiqueta}»',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'origen',
        enlazadoPor: 'clasificacion.origen',
        campo: 'nombre',
      },
      distractores: { fuente: 'catalogos', catalogo: 'origen', campo: 'nombre', cantidad: 3 },
      retroalimentacion: {
        acierto: 'Correcto. El origen determina qué recursos hay que activar.',
        error:
          'No es esa. Repasa los tres orígenes: natural (fenómenos de la naturaleza), tecnológico (fallo de lo construido por las personas) y antrópico (acción humana directa).',
        explicacion: '{caso.explicacion}',
      },
      dificultad: 'basica',
    },
    {
      id: 'sprint-gravedad',
      tipo: 'opcion-multiple',
      enunciado: '¿Qué nivel de gravedad tiene esta situación? «{caso.etiqueta}»',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'gravedad',
        enlazadoPor: 'clasificacion.gravedad',
        campo: 'nombre',
      },
      distractores: { fuente: 'catalogos', catalogo: 'gravedad', campo: 'nombre', cantidad: 3 },
      retroalimentacion: {
        acierto: 'Bien. El nivel de gravedad marca los recursos que hay que activar.',
        error:
          'Repasa los criterios: leve, una persona sin riesgo vital; grave, riesgo vital o lesiones importantes; muy grave, amenaza inmediata para varias personas; catastrófica, desborda los recursos.',
        explicacion: '{caso.explicacion}',
      },
      dificultad: 'media',
    },
    {
      id: 'sprint-escenario',
      tipo: 'opcion-multiple',
      enunciado: '¿En qué escenario se produce esta emergencia? «{caso.etiqueta}»',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'escenario',
        enlazadoPor: 'clasificacion.escenario',
        campo: 'nombre',
      },
      distractores: { fuente: 'catalogos', catalogo: 'escenario', campo: 'nombre', cantidad: 3 },
      retroalimentacion: {
        acierto: 'Acertaste. El escenario condiciona la accesibilidad, la evacuación y la coordinación.',
        error:
          'El escenario no es solo el lugar: es el tipo de espacio que determina cómo se trabaja (doméstico, laboral, tráfico, deportivo, espacio público o rural aislado).',
        explicacion: '{caso.explicacion}',
      },
      dificultad: 'media',
    },
    {
      id: 'sprint-tipo',
      tipo: 'opcion-multiple',
      enunciado: '¿Qué tipo de incidente describe esta situación? «{caso.etiqueta}»',
      pista: '{caso.contexto}',
      correcta: { fuente: 'casos', clave: 'tipo', campo: 'tipo', enlazadoPor: 'tipo' },
      distractores: {
        fuente: 'casos',
        clave: 'tipo',
        campo: 'tipo',
        mismoGrupoPor: 'clasificacion.origen',
        cantidad: 3,
      },
      retroalimentacion: {
        acierto: 'Correcto. Has identificado el tipo concreto de emergencia.',
        error:
          'Vuelve a leer el enunciado y fíjate en la causa principal y en lo que está pasando ahora mismo, no en el lugar donde ocurre.',
        explicacion: '{caso.explicacion}',
      },
      dificultad: 'avanzada',
    },
    {
      id: 'sprint-medida',
      tipo: 'opcion-multiple',
      enunciado: '¿Qué primera medida de coordinación corresponde a esta situación? «{caso.etiqueta}»',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'origen',
        enlazadoPor: 'clasificacion.origen',
        campo: 'medida',
      },
      distractores: { fuente: 'catalogos', catalogo: 'origen', campo: 'medida', cantidad: 3 },
      retroalimentacion: {
        acierto: 'Sí: la primera medida depende del origen y de los recursos que deben coordinarse.',
        error:
          'Cada origen tiene una medida asociada: en el natural se siguen las alertas y se coordinan con protección civil; en el tecnológico se espera a los servicios especializados; en el antrópico se coordinan fuerzas de seguridad y se documenta la intervención.',
        explicacion:
          'La causa de la emergencia condiciona la coordinación. Identificarla bien evita acercarse a una zona donde todavía no se puede trabajar.',
      },
      dificultad: 'avanzada',
    },
  ],
};

/* ==========================================================================
   ESCAPE ROOM: ESCENARIO
   `construirEscenarios()` lo valida: exactamente una opción correcta por fase
   y realimentación en todas las opciones (requisito didáctico obligatorio).
   ========================================================================== */

const escape = {
  escenarios: [
    {
      id: 'esc-clasificacion-centro',
      titulo: 'Turno de tarde en el centro de coordinación',
      briefing:
        'Eres la persona técnica que recibe los avisos. La primera decisión no es salir: es clasificar. De esa clasificación dependen el equipo, el material y a quién llamas.',
      ambientacion: 'Centro de coordinación de emergencias · 17:42 h',
      tiempoTotal: 300,
      fases: [
        {
          id: 'f1',
          titulo: 'Llega el primer aviso',
          texto:
            'Una llamada informa de un incendio en una nave industrial del polígono. El sistema de detección de incendios lleva diez minutos averiado y en el exterior hay contenedores de productos químicos.',
          tiempoLimite: 60,
          puntos: 10,
          opciones: [
            {
              id: 'f1o1',
              texto: 'Clasificarlo como emergencia leve hasta saber cuántas víctimas hay.',
              correcta: false,
              retroalimentacion: {
                breve: 'Un incendio con productos químicos nunca es leve a la espera.',
                explicacion:
                  'La gravedad no se decide contando víctimas visibles, sino por la amenaza potencial. Un incendio con químicos implica una amenaza inmediata para la integridad de quienes están dentro.',
                transferencia:
                  'Esperar a "ver cuántos hay" antes de clasificar puede costar la vida de quien llama.',
              },
            },
            {
              id: 'f1o2',
              texto: 'Clasificarlo como origen tecnológico, muy grave y en escenario laboral.',
              correcta: true,
              retroalimentacion: {
                breve: 'Correcto: hay un fallo de una instalación construida por las personas.',
                explicacion:
                  'La detección de incendios averiada es un fallo de una instalación, de ahí el origen tecnológico. La presencia de químicos y la amenaza para la integridad de quienes están dentro lo hacen muy grave, y una nave industrial es escenario laboral.',
                transferencia:
                  'Esta clasificación es la que hace que se solicite protección química y que se coordine con bomberos antes de acceder.',
              },
            },
            {
              id: 'f1o3',
              texto: 'Clasificarlo como origen natural, porque el fuego es un fenómeno natural.',
              correcta: false,
              retroalimentacion: {
                breve: 'El fuego no convierte en natural un incendio causado por un fallo industrial.',
                explicacion:
                  'Los fenómenos naturales (inundación, terremoto, tormenta, nevada) ocurren sin intervención humana. Un incendio en una nave es tecnológico o antrópico, nunca natural.',
                transferencia:
                  'Clasificar mal el origen lleva a no pedir los recursos adecuados y a esperar al equipo equivocado.',
              },
            },
            {
              id: 'f1o4',
              texto: 'Clasificarlo como origen antrópico por negligencia de la empresa.',
              correcta: false,
              retroalimentacion: {
                breve: 'El aviso no aporta datos suficientes para atribuir la causa a una negligencia.',
                explicacion:
                  'El origen se determina por la causa que origina la emergencia. Un fallo del sistema de detección es un origen tecnológico; solo pasaría a antrópico si se confirmara una acción u omisión humana.',
                transferencia:
                  'En una activación real se pregunta de forma explícita por la causa: "¿han intervenido personas o solo ha fallado la instalación?".',
              },
            },
          ],
        },
        {
          id: 'f2',
          titulo: 'Llega un segundo aviso incompatible',
          texto:
            'Mientras coordinas entra otro aviso: una persona de 17 años con el brazo roto tras una caída en un pabellón deportivo. Desde el otro extremo de la línea te piden que salgas inmediatamente.',
          tiempoLimite: 60,
          puntos: 10,
          opciones: [
            {
              id: 'f2o1',
              texto: 'Salir hacia el pabellón, porque una fractura aislada es más urgente que un incendio.',
              correcta: false,
              retroalimentacion: {
                breve: 'Salir hacia la fractura abandonaría un incendio con químicos.',
                explicacion:
                  'La urgencia no se compara solo por el número de personas. Hay un incendio con productos químicos activo, que es una amenaza inmediata para la vida y la integridad de quienes están dentro, y eso es una emergencia muy grave.',
                transferencia:
                  'El centro coordinador ordena por gravedad clasificada y por recursos disponibles, no por lo que resulta más visible.',
              },
            },
            {
              id: 'f2o2',
              texto:
                'Clasificar el aviso del pabellón como grave, antrópico y en escenario deportivo, y mantener el incendio como prioridad de activación.',
              correcta: true,
              retroalimentacion: {
                breve: 'Correcto: has clasificado los dos avisos y has priorizado bien.',
                explicacion:
                  'La fractura por una caída durante una competición es antrópica, grave (hay lesión de importancia) y en escenario deportivo. El incendio con químicos sigue siendo muy grave, de modo que la activación de recursos va primero a él.',
                transferencia:
                  'Priorizar exige tener la clasificación clara: sin ella, la decisión de qué activar es una opinión.',
              },
            },
            {
              id: 'f2o3',
              texto: 'Considerar los dos avisos una única emergencia catastrófica y activar todos los medios.',
              correcta: false,
              retroalimentacion: {
                breve: 'Son dos emergencias independientes, no una sola.',
                explicacion:
                  'Una emergencia catastrófica se define porque desborda los recursos disponibles. Dos avisos separados en lugares distintos no forman una sola emergencia, aunque ocurran en el mismo momento.',
                transferencia:
                  'Unificar avisos sin necesidad consume recursos que otros servicios necesitan.',
              },
            },
          ],
        },
        {
          id: 'f3',
          titulo: 'Cierre del turno',
          texto:
            'La ambulancia de apoyo queda asignada al incendio. La persona del pabellón sigue esperando y pregunta por qué no va nadie.',
          tiempoLimite: 60,
          puntos: 10,
          opciones: [
            {
              id: 'f3o1',
              texto:
                'Explicar que la clasificación de gravedad del incendio, muy grave, activa antes los recursos que ella necesita.',
              correcta: true,
              retroalimentacion: {
                breve: 'Exacto: la clasificación explica la decisión.',
                explicacion:
                  'Comunicar el motivo de la decisión forma parte del trabajo. Quien llama tiene derecho a saber por qué se organiza así, y la explicación parte de la clasificación, no de la impresión personal.',
                transferencia:
                  'Explicar "es que hay un incendio con químicos, es muy grave y por eso se activan estos medios antes" demuestra criterio profesional y reduce la conflictividad.',
              },
            },
            {
              id: 'f3o2',
              texto: 'Explicar que su caso es menos importante y que tendrá que esperar.',
              correcta: false,
              retroalimentacion: {
                breve: 'Es una emergencia grave, no un caso "menos importante".',
                explicacion:
                  'Llamar "menos importante" a una emergencia grave minimiza la situación de la persona y es una mala práctica de comunicación.',
                transferencia:
                  'Habla de prioridad y no de importancia: la prioridad es una decisión operativa; la persona no es menos importante.',
              },
            },
            {
              id: 'f3o3',
              texto: 'No dar explicaciones: el centro coordinador ya ha decidido y no se cuestionan sus decisiones.',
              correcta: false,
              retroalimentacion: {
                breve: 'La decisión se comunica, aunque se explique con más detalle después.',
                explicacion:
                  'La comunicación de la decisión es parte de la labor de la persona técnica. Ocultarla genera desconfianza y, en muchos casos, impide la adopción de medidas.',
                transferencia:
                  'Explicar no equivale a cuestionar. Es profesional y necesario.',
              },
            },
          ],
        },
      ],
    },
  ],
};

/* ==========================================================================
   EXPORTACIÓN
   ========================================================================== */

export default {
  id: 'clasificacion',
  orden: 1,
  nombre: 'Clasificación de emergencias',
  subtitulo: 'Identificar de qué tipo de emergencia se trata antes de actuar',
  descripcion:
    'Aprende a clasificar una situación de emergencia por su origen, su escenario y su gravedad, y a justificar cada decisión con criterios y no con impresiones.',
  icono: 'clasificacion',
  acento: 'sanitario',
  objetivos: [
    'Distinguir emergencias de origen natural, tecnológico y antrópico.',
    'Identificar los riesgos específicos de cada escenario de intervención.',
    'Valorar la gravedad de una emergencia según sus consecuencias.',
    'Relacionar la clasificación con los recursos que hay que activar.',
  ],
  catalogos,
  conceptos,
  casos,
  memoria,
  sprint,
  escape,
};
