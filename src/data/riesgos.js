/**
 * riesgos.js — Unidad temática 2: RIESGOS EN LA EMERGENCIA.
 *
 * Capa: DATOS. Contenido estructurado y nada más.
 *
 * ---------------------------------------------------------------------------
 * REGLAS DE ESTE ARCHIVO
 * ---------------------------------------------------------------------------
 * 1. Solo datos. Ninguna función, ningún `if`, ningún bucle.
 * 2. Cada entrada lleva un `id` estable (clave de emparejamiento, de
 *    almacenamiento y de URL).
 * 3. Se respeta la doble dimensión del material original: hay que distinguir
 *    los riesgos PARA LAS VÍCTIMAS de los riesgos PARA EL EQUIPO DE ACTUACIÓN.
 *    Esa distinción es el eje vertebral de esta unidad.
 *
 * ---------------------------------------------------------------------------
 * PROCEDENCIA
 * ---------------------------------------------------------------------------
 * Fuente: `_privado-NoemiCelaya/documentos-base-escena-segura/Riesgos.docx`
 * (apartados 1.3.1 riesgos para las víctimas y 1.3.2 riesgos para el equipo de
 * actuación).
 * Material de trabajo: no se publica ni se muestra al alumnado.
 *
 * @module data/riesgos
 */

/* ==========================================================================
   CATÁLOGOS DE REFERENCIA
   ========================================================================== */

const catalogos = {
  /* --- Ámbito a quien afecta el riesgo --------------------------------- */
  ambito: [
    {
      id: 'victima',
      nombre: 'Riesgos para las víctimas',
      definicion:
        'Riesgos que pueden agravar el estado de las personas afectadas o generar otras lesiones nuevas.',
      valoracion:
        'Estado clínico de la persona afectada y condiciones del escenario: estabilidad del entorno, temperatura, presencia de sustancias peligrosas o riesgo de incendio.',
      icono: 'persona',
    },
    {
      id: 'equipo',
      nombre: 'Riesgos para el equipo de actuación',
      definicion:
        'Riesgos que pueden comprometer la seguridad de quienes prestan la asistencia.',
      valoracion:
        'La seguridad del equipo es una condición imprescindible para poder ayudar a otras personas: actuar sin valorar los riesgos convierte a los intervinientes en nuevas víctimas.',
      icono: 'escudo',
    },
  ],

  /* --- 1.3.1. Riesgos para las víctimas -------------------------------- */
  victima: [
    {
      id: 'agravamiento-lesiones',
      nombre: 'Riesgo de agravamiento de lesiones',
      ambito: 'victima',
      definicion:
        'Probabilidad de que el estado de la víctima empeore como consecuencia de movimientos, posturas o maniobras asistenciales inadecuadas.',
      ejemplo:
        'Desplazar a la víctima sin alinear cabeza, cuello y tronco convierte una lesión estable en inestable.',
      factores: [
        'Movilización sin control del eje corporal.',
        'Falta de inmovilización previa de fracturas antes de trasladarla.',
        'Posturas no seguras o mantenidas que comprometen la vía aérea.',
        'Vibraciones, sacudidas y superficies inestables durante la extracción.',
        'Maniobras repetidas o innecesarias sin un plan claro.',
      ],
      clave:
        'Cada maniobra debe estar justificada y ejecutarse de forma coordinada: repetirla sin beneficio añade riesgo sin nada a cambio.',
    },
    {
      id: 'ambientales',
      nombre: 'Riesgos ambientales',
      ambito: 'victima',
      definicion:
        'Proceden directamente de las condiciones físicas del entorno y pueden agravar el estado de la víctima si no se controlan a tiempo.',
      ejemplo:
        'Una persona empapada sobre suelo mojado pierde temperatura corporal rápidamente: la hipotermia altera la coagulación y la respuesta al tratamiento.',
      factores: [
        'Exposición al frío o a la humedad.',
        'Exposición al calor o al sol directo.',
        'Viento, lluvia o nieve.',
        'Contacto con el terreno o con materiales inadecuados.',
      ],
      clave:
        'Si la víctima permanece mucho tiempo en el lugar del incidente puede desarrollar síndrome de aplastamiento, deshidratación o agotamiento.',
    },
    {
      id: 'agentes-externos',
      nombre: 'Riesgos derivados de agentes externos',
      ambito: 'victima',
      definicion:
        'Provienen de sustancias químicas, tóxicas o biológicas presentes en el entorno y pueden causar intoxicaciones, quemaduras o reacciones adversas.',
      ejemplo:
        'Tras un incendio, el polvo del derrumbe puede contener amianto o metales pesados que se inhalan con facilidad.',
      factores: [
        'Inhalación de humos o gases tóxicos.',
        'Contacto con líquidos corrosivos o inflamables.',
        'Contaminación del terreno o de los objetos.',
        'Presencia de partículas en suspensión.',
      ],
      clave:
        'En todos estos casos, el personal de emergencias debe comunicar la situación al centro coordinador y esperar la valoración de los servicios especializados antes de acercarse a la zona.',
    },
    {
      id: 'estructurales',
      nombre: 'Riesgos estructurales',
      ambito: 'victima',
      definicion:
        'Derivan de la inestabilidad o el deterioro de construcciones, vehículos o elementos del entorno, y pueden provocar caídas, atrapamientos o lesiones adicionales.',
      ejemplo:
        'Un vehículo volcado en una carretera de montaña puede desplazarse al descargar la vía.',
      factores: [
        'Inestabilidad de estructuras, fachadas o cubiertas.',
        'Atrapamiento por paredes o maquinaria.',
        'Elementos suspendidos que pueden caer.',
      ],
      clave:
        'Antes de mover a una víctima hay que comprobar que el entorno es estable: una estructura que cede produce nuevas víctimas.',
    },
  ],

  /* --- 1.3.2. Riesgos para el equipo de actuación ------------------------ */
  equipo: [
    {
      id: 'biologicos',
      nombre: 'Riesgos biológicos',
      ambito: 'equipo',
      definicion:
        'Probabilidad de que un agente biológico provoque infección, alergia o toxicidad a las personas.',
      ejemplo:
        'Un corte con material contaminado es una vía de exposición a agentes biológicos muy frecuente en la asistencia.',
      vias: ['respiratoria', 'sanguinea', 'digestiva'],
      clave:
        'El riesgo biológico forma parte de la práctica cotidiana: por eso las precauciones universales se aplican a TODAS las personas, sin excepción.',
    },
    {
      id: 'quimicos',
      nombre: 'Riesgos químicos',
      ambito: 'equipo',
      definicion:
        'Probabilidad de lesionarse o contraer una enfermedad por la exposición no controlada a agentes químicos.',
      ejemplo:
        'Una caja de producto fitosanitario sin etiquetar en un almacén: hay que buscar la etiqueta y el pictograma antes de tocarlo.',
      vias: ['inhalatoria', 'digestiva', 'cutanea'],
      clave:
        'Las etiquetas de los productos químicos incluyen pictogramas que informan del tipo de riesgo: interpretarlos es una competencia obligatoria.',
    },
    {
      id: 'fisicos',
      nombre: 'Riesgos físicos',
      ambito: 'equipo',
      definicion:
        'Probabilidad de lesionarse o padecer una patología por la acción de uno o varios agentes físicos.',
      ejemplo:
        'Un frenazo en curva hace que el material mal fijado se desplace y cause lesiones dentro de la ambulancia.',
      vias: ['desplazamientos', 'intervencion', 'movilizacion'],
      clave:
        'Cuando hay partículas o humo en el aire, conviene situarse de forma que el viento no arrastre ese aire hacia el equipo.',
    },
    {
      id: 'psicologicos',
      nombre: 'Riesgos psicológicos',
      ambito: 'equipo',
      definicion:
        'Probabilidad de que las condiciones emocionales o laborales generen alteraciones en el bienestar mental.',
      ejemplo:
        'La exposición sostenida a situaciones traumáticas y a la presión por actuar con rapidez conduce al síndrome de burnout.',
      factores: [
        'La presión por actuar con rapidez en escenarios graves.',
        'La exposición a situaciones traumáticas.',
        'Las agresiones verbales o físicas de víctimas o familiares.',
        'La falta de descanso y la acumulación de horas de guardia.',
        'Las relaciones tensas o la falta de apoyo institucional.',
      ],
      clave:
        'El síndrome de burnout es el estado de agotamiento físico, mental y emocional que aparece tras una exposición prolongada al estrés laboral.',
    },
  ],

  /* --- Vías de transmisión de los agentes biológicos --------------------- */
  via: [
    {
      id: 'respiratoria',
      nombre: 'Vía respiratoria o aérea',
      definicion:
        'El contagio se produce por inhalación de gotitas de saliva expelidas al toser o estornudar.',
      enfermedades: 'Gripe estacional, gripe A, tuberculosis y algunas meningitis, como las bacterianas.',
      medidas: 'Emplear mascarilla para proteger las vías respiratorias.',
    },
    {
      id: 'sanguinea',
      nombre: 'Vía sanguínea',
      definicion:
        'Se produce por salpicaduras de sangre que alcanzan las mucosas, o por pinchazos y cortes con objetos contaminados.',
      enfermedades: 'VIH/sida y algunos tipos de hepatitis, como la B y la C.',
      medidas: 'Usar gafas o pantalla protectora y extremar la precaución con objetos punzantes.',
    },
    {
      id: 'digestiva',
      nombre: 'Vía digestiva',
      definicion:
        'Se produce por ingestión de agua o alimentos contaminados, o por llevar la contaminación en las manos a la boca.',
      enfermedades: 'Gastroenteritis y Hepatitis A.',
      medidas: 'Lavado de manos y no comer ni fumar con las manos sucias.',
    },
  ],

  /* --- Agentes químicos: vías de entrada --------------------------------- */
  viaQuimica: [
    {
      id: 'inhalatoria',
      nombre: 'Vía inhalatoria',
      definicion: 'Es la principal vía por la cual actúan los agentes químicos.',
      ejemplo: 'Inhalación de gases tóxicos en un incendio o en una fuga industrial.',
    },
    {
      id: 'digestiva',
      nombre: 'Vía digestiva',
      definicion: 'El agente químico llega al organismo a través del tracto digestivo.',
      ejemplo: 'Ingestión accidental de un producto de limpieza.',
    },
    {
      id: 'cutanea',
      nombre: 'Vía cutánea',
      definicion:
        'El agente químico entra en contacto con la piel o las mucosas, se absorbe a través de ellas o produce lesiones por contacto.',
      ejemplo: 'Salpicaduras de ácido sobre el antebrazo.',
    },
  ],
};

/**
 * Catálogo unificado de riesgos.
 * Existe además de `victima` y `equipo` porque las actividades necesitan una
 * única colección contra la que emparejar "situación ↔ tipo de riesgo".
 * No duplica contenido: se compone a partir de los dos catálogos anteriores.
 */
catalogos.riesgo = [...catalogos.victima, ...catalogos.equipo];

/* ==========================================================================
   CONCEPTOS CLAVE
   ========================================================================== */

const conceptos = [
  {
    id: 'c-evaluacion-dinamica',
    termino: 'Evaluación dinámica de riesgos',
    definicion:
      'Proceso continuo mediante el cual se observa, interpreta y actualiza la información del entorno durante toda la intervención.',
    ejemplo:
      'A diferencia de una evaluación inicial estática, esta se repite constantemente porque las condiciones pueden cambiar en cuestión de segundos.',
  },
  {
    id: 'c-peligro-riesgo',
    termino: 'Peligro y riesgo no son lo mismo',
    definicion:
      'El peligro es cualquier elemento o situación que puede causar un daño. El riesgo se refiere a la probabilidad de que ese daño ocurra en un momento determinado.',
    ejemplo:
      'Un cable eléctrico en el suelo es el peligro; el riesgo depende de si va a haber contacto y de cuándo.',
  },
  {
    id: 'c-doble-dimension',
    termino: 'Doble dimensión de la evaluación',
    definicion:
      'La evaluación siempre tiene dos apartados: los riesgos para las víctimas y los riesgos para el equipo de actuación.',
    ejemplo:
      'Una cubierta de amianto amenaza a la víctima que está debajo y al equipo que sube a la cubierta.',
  },
  {
    id: 'c-precauciones-universales',
    termino: 'Precauciones universales',
    definicion:
      'Conjunto de medidas que se aplican a cualquier situación y a todas las personas, sin excepción, para proteger al personal y a las personas usuarias de infecciones.',
    ejemplo:
      'Guantes nuevos entre una víctima y otra, gafas si puede haber salpicaduras de sangre y apósitos impermeables sobre heridas propias.',
  },
  {
    id: 'c-profilaxis',
    termino: 'Profilaxis',
    definicion:
      'Medidas destinadas a evitar la aparición o la propagación de enfermedades.',
    ejemplo:
      'La vacunación frente a hepatitis B es profilaxis previa a la exposición; lavar y desinfectar tras un pinchazo es profilaxis posterior.',
  },
];

/* ==========================================================================
   CASOS: SITUACIONES DONDE HAY QUE DETECTAR RIESGOS
   `riesgo` es el riesgo principal (el que empareja Memory y Sprint).
   `riesgos` es la lista completa, para revisión y para la siguiente unidad.
   ========================================================================== */

const casos = [
  {
    id: 'r-practicante-movilidad',
    etiqueta: 'Víctima de tráfico con posible lesión cervical en el asiento trasero',
    contexto:
      'El conductor se lleva las manos a la nuca y nota dolor. No quiere que le muevan la cabeza.',
    riesgo: 'agravamiento-lesiones',
    ambito: 'victima',
    riesgos: ['agravamiento-lesiones', 'fisicos'],
    explicacion:
      'El riesgo principal es el agravamiento de lesiones: mover a la víctima sin alinear cabeza, cuello y tronco puede convertir una lesión estable en inestable. El control manual del eje cervical es la primera medida.',
  },
  {
    id: 'r-suelo-mojado',
    etiqueta: 'Ciclista caído sobre asfalto mojado tras la lluvia, con ropa empapada',
    contexto:
      'La persona ciclista está consciente, pero tiembla. La calzada está mojada y sigue lloviendo.',
    riesgo: 'ambientales',
    ambito: 'victima',
    riesgos: ['ambientales', 'agravamiento-lesiones', 'estructurales'],
    explicacion:
      'El riesgo ambiental domina: la ropa empapada y el suelo mojado provocan una pérdida rápida de temperatura. La hipotermia altera la coagulación y la respuesta al tratamiento.',
  },
  {
    id: 'r-vertido-ignoto',
    etiqueta: 'Contenedor volcado con líquido desconocido que huele fuerte',
    contexto:
      'El líquido se extiende por la calzada y ya ha alcanzado la acera. Nadie conoce el producto.',
    riesgo: 'agentes-externos',
    ambito: 'victima',
    riesgos: ['agentes-externos', 'quimicos', 'ambientales', 'fisicos'],
    explicacion:
      'Un producto desconocido obliga a trabajar como si fuera peligroso. Se comunica al centro coordinador y se espera a los servicios especializados antes de acercarse.',
  },
  {
    id: 'r-derrumbe-amianto',
    etiqueta: 'Afectado atrapado bajo un derrumbe con polvo en suspensión',
    contexto:
      'Cae polvo de una estructura demolida. Al retirar los escombros hay placas de un material desconocido.',
    riesgo: 'estructurales',
    ambito: 'victima',
    riesgos: ['estructurales', 'agentes-externos', 'ambientales'],
    explicacion:
      'El riesgo estructural obliga a comprobar la estabilidad antes de mover nada. Además, el polvo puede contener materiales tóxicos como amianto o metales pesados que se inhalan con facilidad.',
  },
  {
    id: 'r-sangre-en-manos',
    etiqueta: 'Herida profunda sangrante durante la asistencia a un accidentado',
    contexto:
      'Al cortar la ropa se produce un sangrado abundante. No hay guantes a mano en este momento.',
    riesgo: 'biologicos',
    ambito: 'equipo',
    riesgos: ['biologicos', 'psicologicos'],
    explicacion:
      'El riesgo biológico es el más habitual en la práctica cotidiana. Se aplican precauciones universales: guantes entre una víctima y otra, gafas si puede haber salpicaduras y después cubrirse las heridas propias.',
  },
  {
    id: 'r-pinchazo',
    etiqueta: 'Pinchazo con una aguja usada al recoger material del escenario',
    contexto:
        'Al retirar unos restos del suelo se produce un pinchazo en el dedo a través de los guantes.',
    riesgo: 'biologicos',
    ambito: 'equipo',
    riesgos: ['biologicos', 'psicologicos'],
    explicacion:
      'Es una exposición por vía sanguínea. La profilaxis posterior exige retirar el objeto, limpiar la herida, permitir el sangrado, desinfectar y cubrir la zona. Después se informa al Servicio de Salud Laboral.',
  },
  {
    id: 'r-gases-incendio',
    etiqueta: 'Humo denso en el pasillo de un piso mientras se busca a una persona',
    contexto:
      'La visibilidad es casi nula. Hay una puerta cerrada al fondo y se oyen toses detrás.',
    riesgo: 'quimicos',
    ambito: 'equipo',
    riesgos: ['quimicos', 'agentes-externos', 'fisicos', 'ambientales'],
    explicacion:
      'El humo contiene gases tóxicos que desplazan el oxígeno y provocan asfixia o intoxicación. La vía inhalatoria es la principal vía de entrada de los agentes químicos.',
  },
  {
    id: 'r-carga-pesada',
    etiqueta: 'Traslado de una persona con obesidad desde un quinto piso sin ascensor',
    contexto:
      'La persona no puede caminar. Hay que bajarla por una escalera estrecha y con dos tramos de escalera.',
    riesgo: 'fisicos',
    ambito: 'equipo',
    riesgos: ['fisicos', 'agravamiento-lesiones'],
    explicacion:
      'La movilización de personas es la principal situación de riesgo físico y la que más bajas laborales produce. Se aplica mecánica corporal correcta y se evitan sobreesfuerzos.',
  },
  {
    id: 'r-agresion-familiar',
    etiqueta: 'Familiar que amenaza al equipo mientras se atiende a su familiar',
    contexto:
      'Grita y amenaza con pegar al técnico. Hay otra persona en el suelo que necesita atención urgente.',
    riesgo: 'psicologicos',
    ambito: 'equipo',
    riesgos: ['psicologicos'],
    explicacion:
      'La exposición a agresiones verbales o físicas en momentos de estrés es uno de los factores de riesgo psicológico más frecuentes. Forma parte del riesgo del equipo, no de la víctima.',
  },
  {
    id: 'r-perdida-vision',
    etiqueta: 'Fractura abierta en un miembro con fragmentos óseos expuestos',
    contexto:
      'La fractura está abierta y se ve el hueso. La persona está pálida y mareada.',
    riesgo: 'agravamiento-lesiones',
    ambito: 'victima',
    riesgos: ['agravamiento-lesiones', 'biologicos'],
    explicacion:
      'Manipular la fractura o trasladarla en camilla sin férulas ni sujeciones favorece el desplazamiento de fragmentos óseos, el dolor y la hemorragia, y dificulta el control posterior.',
  },
  {
    id: 'r-vehiculo-estable',
    etiqueta: 'Vehículo volcado en una pendiente con el conductor dentro',
    contexto:
      'El coche está tumbado en una pendiente del 15 %. El conductor se mueve y responde a la voz.',
    riesgo: 'estructurales',
    ambito: 'victima',
    riesgos: ['estructurales', 'agravamiento-lesiones', 'fisicos'],
    explicacion:
      'Un vehículo en pendiente puede desplazarse durante la extracción. Es un riesgo estructural: hay que estabilizar antes de abrir y sacar a la persona.',
  },
  {
    id: 'r-fuga-amoniaco',
    etiqueta: 'Olor fuerte a amoníaco en una cámara frigorífica de una empresa alimentaria',
    contexto:
      'El operario lleva diez minutos dentro y tose. La puerta está abierta.',
    riesgo: 'quimicos',
    ambito: 'equipo',
    riesgos: ['quimicos', 'agentes-externos', 'fisicos', 'ambientales'],
    explicacion:
      'El amoníaco es un gas irritante: entra por vía inhalatoria y puede causar quemaduras y lesiones respiratorias graves. Hay que consultar el pictograma de la instalación y entrar solo con protección.',
  },
];

/* ==========================================================================
   MEMORY: CONFIGURACIONES DECLARATIVAS
   ========================================================================== */

const memoria = {
  configuraciones: [
    {
      id: 'situacion-riesgo',
      titulo: 'Situación ↔ Tipo de riesgo',
      instruccion:
        'Une cada situación con el riesgo principal que hay que detectar antes de intervenir. Pregúntate siempre: ¿qué puede pasar si actúo ahora mismo?',
      izquierda: { fuente: 'casos', campo: 'etiqueta', etiqueta: 'Situación' },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'riesgo',
        campo: 'nombre',
        enlazadoPor: 'riesgo',
        etiqueta: 'Riesgo',
      },
      limite: 8,
    },
    {
      id: 'riesgo-definicion',
      titulo: 'Riesgo ↔ Definición',
      instruccion:
        'Une cada riesgo con su definición. Distinguir bien las definiciones es lo que permite reconocer el riesgo en una situación real.',
      izquierda: { fuente: 'catalogos', catalogo: 'riesgo', campo: 'nombre', etiqueta: 'Riesgo' },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'riesgo',
        campo: 'definicion',
        enlazadoPor: 'id',
        etiqueta: 'Definición',
      },
      limite: 8,
    },
    {
      id: 'riesgo-ejemplo',
      titulo: 'Riesgo ↔ Ejemplo',
      instruccion:
        'Une cada riesgo con un ejemplo real. El ejemplo es lo que conecta el concepto con la práctica en una emergencia.',
      izquierda: { fuente: 'catalogos', catalogo: 'riesgo', campo: 'nombre', etiqueta: 'Riesgo' },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'riesgo',
        campo: 'ejemplo',
        enlazadoPor: 'id',
        etiqueta: 'Ejemplo',
      },
      limite: 8,
    },
    {
      id: 'riesgo-ambito',
      titulo: 'Riesgo ↔ ¿A quién afecta?',
      instruccion:
        'Une cada riesgo con quién sufre sus consecuencias: la persona afectada o el equipo de actuación. Esta distinción es la clave del apartado 1.3.',
      izquierda: { fuente: 'catalogos', catalogo: 'riesgo', campo: 'nombre', etiqueta: 'Riesgo' },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'ambito',
        campo: 'nombre',
        enlazadoPor: 'ambito',
        etiqueta: 'Ámbito',
      },
      limite: 8,
    },
  ],
};

/* ==========================================================================
   SPRINT: PLANTILLAS DE PREGUNTAS
   ========================================================================== */

const sprint = {
  cantidad: 10,
  plantillas: [
    {
      id: 'sprint-riesgo',
      tipo: 'opcion-multiple',
      enunciado: '¿Cuál es el riesgo principal en esta situación? «{caso.etiqueta}»',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'riesgo',
        enlazadoPor: 'riesgo',
        campo: 'nombre',
      },
      distractores: { fuente: 'catalogos', catalogo: 'riesgo', campo: 'nombre', cantidad: 3 },
      retroalimentacion: {
        acierto: 'Correcto. Has identificado el riesgo que hay que controlar antes de intervenir.',
        error:
          'Repasa los ocho riesgos: cuatro afectan a las víctimas (agravamiento, ambientales, agentes externos y estructurales) y cuatro al equipo (biológicos, químicos, físicos y psicológicos).',
        explicacion: '{caso.explicacion}',
      },
      dificultad: 'basica',
    },
    {
      id: 'sprint-ambito',
      tipo: 'opcion-multiple',
      // Dos opciones son la respuesta, no un descarte: el original enumera
      // exactamente dos ámbitos, 1.3.1 víctimas y 1.3.2 equipo. Ver
      // `agents.md` §7.4.
      opcionesMinimas: 2,
      enunciado: '¿A quién afecta este riesgo? «{caso.etiqueta}»',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'ambito',
        enlazadoPor: 'ambito',
        campo: 'nombre',
      },
      distractores: { fuente: 'catalogos', catalogo: 'ambito', campo: 'nombre', cantidad: 1 },
      retroalimentacion: {
        acierto: 'Bien. La evaluación de riesgos tiene siempre dos apartados.',
        error:
          'La evaluación dinámica distingue entre riesgos para las víctimas y riesgos para el equipo. Los dos existen a la vez: proteger a la persona no autoriza a exponerse.',
        explicacion:
          'La seguridad del equipo es una condición imprescindible para poder ayudar: actuar sin valorar los riesgos convierte a los intervinientes en nuevas víctimas.',
      },
      dificultad: 'basica',
    },
    {
      id: 'sprint-definicion',
      tipo: 'opcion-multiple',
      // Sin el índice: `resolverPlantilla()` solo admite `\w` y `.`, así que un
      // marcador con `[0]` se quedaría literal en la pregunta del alumnado.
      enunciado: '¿Cuál es la definición del riesgo principal en esta situación? «{caso.etiqueta}»',
      pista: 'Piensa en la diferencia entre peligro y riesgo antes de elegir.',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'riesgo',
        enlazadoPor: 'riesgo',
        campo: 'definicion',
      },
      distractores: { fuente: 'catalogos', catalogo: 'riesgo', campo: 'definicion', cantidad: 3 },
      retroalimentacion: {
        acierto: 'Definición correcta.',
        error:
          'Fíjate en la palabra clave de la definición: el riesgo siempre incluye la idea de probabilidad, y el peligro es el elemento que puede causar el daño.',
        explicacion:
          'Distinguir las definiciones es lo que permite reconocer un riesgo real: sin definición clara, un mismo concepto se interpreta de forma distinta en cada persona del equipo.',
      },
      dificultad: 'media',
    },
    {
      id: 'sprint-factor',
      tipo: 'opcion-multiple',
      enunciado: '¿Qué factor agrava más este riesgo? «{caso.etiqueta}»',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'riesgo',
        enlazadoPor: 'riesgo',
        campo: 'clave',
      },
      distractores: { fuente: 'catalogos', catalogo: 'riesgo', campo: 'clave', cantidad: 3 },
      retroalimentacion: {
        acierto: 'Correcto. Reconocer el factor que agrava es lo que permite prevenirlo.',
        error:
          'Cada riesgo tiene situaciones concretas que lo agravan. Vuelve a la definición del riesgo y pregúntate qué condiciones aumentan la probabilidad de que ocurra.',
        explicacion: '{caso.explicacion}',
      },
      dificultad: 'avanzada',
    },
  ],
};

/* ==========================================================================
   ESCAPE ROOM: ESCENARIO
   ========================================================================== */

const escape = {
  escenarios: [
    {
      id: 'esc-riesgos-almacen',
      titulo: 'Almacén de productos químicos, turno de noche',
      briefing:
        'Te avisan de un derrame dentro de un almacén. No hay víctimas visibles, y eso es exactamente lo que te preocupa: el peligro se detecta antes de que haya alguien en el suelo.',
      ambientacion: 'Polígono industrial · 03:15 h',
      tiempoTotal: 300,
      fases: [
        {
          id: 'f1',
          titulo: 'El primer olor',
          texto:
            'Al llegar a la puerta del almacén notas un olor dulzón que irrita la garganta. La puerta está cerrada. Dentro se ve movimiento de personal.',
          tiempoLimite: 60,
          puntos: 10,
          opciones: [
            {
              id: 'f1o1',
              texto: 'Entrar con una mascarilla de protección y sacar a quien esté dentro.',
              correcta: false,
              retroalimentacion: {
                breve: 'No se entra sin valoración de los servicios especializados.',
                explicacion:
                  'Un olor que irrita la garganta y la vía respiratoria indica exposición a un agente químico por vía inhalatoria, la principal vía de entrada de estos agentes. El riesgo aquí es químico, y afecta tanto a las víctimas que ya están dentro como al equipo que entraría.',
                transferencia:
                  'La norma es clara: comunicar la situación al centro coordinador y esperar la valoración de los servicios especializados antes de acercarse a la zona.',
              },
            },
            {
              id: 'f1o2',
              texto: 'Comprobar primero en qué tipo de riesgo se clasifica: biológico, químico, físico o psicológico.',
              correcta: true,
              retroalimentacion: {
                breve: 'Correcto: clasificar el riesgo es el paso previo a cualquier decisión.',
                explicacion:
                  'Los cuatro riesgos del equipo son equiproblemente importantes, pero se responden de forma distinta. Sin clasificar el riesgo no se puede elegir ni el equipo de protección ni el procedimiento indicado.',
                transferencia:
                  'La evaluación dinámica de riesgos es un proceso continuo: se hace al llegar y se repite mientras dura la intervención, porque las condiciones cambian.',
              },
            },
            {
              id: 'f1o3',
              texto: 'Forzar la entrada y sacar a la gente que hay dentro lo antes posible.',
              correcta: false,
              retroalimentacion: {
                breve: 'Entrar sin protección convierte al equipo en nuevas víctimas.',
                explicacion:
                  'Entrar en una atmósfera contaminada sin protección respiratoria es exactamente el error que los riesgos químicos describen: exposición no controlada a agentes químicos.',
                transferencia:
                  'La urgencia por salvar vidas no puede ejecutarse con una técnica que mate a quien la ejecuta.',
              },
            },
          ],
        },
        {
          id: 'f2',
          titulo: 'La decisión de proteger a los demás',
          texto:
            'Un compañero del almacén ha salido al exterior tosiendo y dice que le arden los ojos. Te pregunta si puede volver a entrar a buscar a su compañero.',
          tiempoLimite: 60,
          puntos: 10,
          opciones: [
            {
              id: 'f2o1',
              texto: 'Explicarle que ha estado expuesto por vía inhalatoria y que debe salir de la zona y ser atendido.',
              correcta: true,
              retroalimentacion: {
                breve: 'Exacto: reconociste la vía de entrada y actuaste en consecuencia.',
                explicacion:
                  'Tos y ardor en los ojos son signos de irritación de las vías respiratorias y de las mucosas por vía inhalatoria. La exposición ya ha ocurrido: ahora se trata de sacarlo de la fuente y valorar los daños.',
                transferencia:
                  'Después de una exposición, la profilaxis posterior es obligatoria: debe hacerse el lavado y la retirada de la ropa contaminada, además de comunicarlo al Servicio de Salud Laboral.',
              },
            },
            {
              id: 'f2o2',
              texto: 'Dejarlo volver a entrar, porque su compañero sigue dentro y la prioridad es sacarlo con seguridad.',
              correcta: false,
              retroalimentacion: {
                breve: 'El compromiso con el compañero no puede ejecutarse con una técnica que mate a quien la ejecuta.',
                explicacion:
                  'Quien ya ha estado expuesto puede arrastrar la exposición al resto del equipo. El trabajo en equipo empieza por no exponer a quien ya está expuesto.',
                transferencia:
                  'El objetivo es llegar a la otra persona, y para eso hace falta un equipo sano, no un equipo contaminado.',
              },
            },
            {
              id: 'f2o3',
              texto: 'Ir tú mismo a buscar a su compañero mientras él espera fuera.',
              correcta: false,
              retroalimentacion: {
                breve: 'Una entrada en solitario multiplica el riesgo en vez de reducirlo.',
                explicacion:
                  'Si el riesgo no está clasificado ni controlado, entrar en solitario elimina además el factor de rescate. En riesgo químico, la regla es esperar a los servicios especializados.',
                transferencia:
                  'Trabajar en pareja no reduce el riesgo químico: reduce las consecuencias de que algo salga mal.',
              },
            },
          ],
        },
        {
          id: 'f3',
          titulo: 'Qué queda registrado',
          // Ampliada a cuatro opciones (bloque 5): la pregunta es "¿qué dato hay
          // que dejar escrito?", no "elige entre cuatro opciones". La decisión
          // está en `agents.md` §7.7.
          opcionesMinimas: 4,
          texto:
            'La empresa pregunta qué ha ocurrido exactamente. La persona de turno del almacén no recuerda el nombre del producto: el bidón que ha caducado no tiene etiqueta.',
          tiempoLimite: 60,
          puntos: 10,
          opciones: [
            {
              id: 'f3o1',
              texto: 'Registrar que el producto no está identificado y que la etiqueta y los pictogramas son datos que deben aportarse.',
              correcta: true,
              retroalimentacion: {
                breve: 'Correcto: un dato que falta se documenta como dato que falta.',
                explicacion:
                  'Registrar con rigor que el producto es desconocido es lo que permite a los servicios especializados actuar y a la empresa tomar medidas. La documentación es también prevención.',
                transferencia:
                  'La documentación de la intervención puede tener relevancia legal y forma parte del trabajo del técnico de emergencias.',
              },
            },
            {
              id: 'f3o2',
              texto: 'Anotar el nombre del producto más parecido que conocer, para avanzar más rápido.',
              correcta: false,
              retroalimentacion: {
                breve: 'Un dato aproximado en un informe es un dato peligroso.',
                explicacion:
                  'Registrar un producto que no se ha identificado puede orientar mal a los servicios especializados, que dependen de ese dato para elegir el nivel de protección.',
                transferencia:
                  'Documentar la incertidumbre es más útil que documentar una suposición.',
              },
            },
            {
              id: 'f3o3',
              texto: 'Describir el aspecto físico y el olor sin mencionar que falta la etiqueta.',
              correcta: false,
              retroalimentacion: {
                breve: 'Los servicios especializados necesitan saber si el producto está identificado.',
                explicacion:
                  'Indicar un olor o un color ayuda, pero lo decisivo es dejar constancia de que no existe etiqueta ni ficha de seguridad disponible en ese momento.',
                transferencia:
                  'Un informe completo separa "lo que se ve" de "lo que no se sabe".',
              },
            },
            {
              id: 'f3o4',
              texto: 'Asegurar el área y no anotar nada en el parte hasta recibir la hoja de datos.',
              correcta: false,
              retroalimentacion: {
                breve: 'El parte debe registrarse en el momento, con los datos disponibles.',
                explicacion:
                  'La responsabilidad no se pospone: hay que registrar el hallazgo (envase sin etiqueta, derrame) y lo que se ha hecho para proteger la zona.',
                transferencia:
                  'La trazabilidad de la intervención empieza con lo que se deja escrito en ese momento.',
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
  id: 'riesgos',
  orden: 2,
  nombre: 'Riesgos en la emergencia',
  subtitulo: 'Reconocer el peligro antes de que se convierta en daño',
  descripcion:
    'Aprende a evaluar los riesgos de una situación de emergencia, distinguiendo los que afectan a las víctimas de los que afectan al equipo de actuación, e interpreta las señales de peligro presentes en el escenario.',
  icono: 'riesgos',
  acento: 'advertencia',
  objetivos: [
    'Diferenciar peligro y riesgo, y explicar la diferencia.',
    'Identificar los riesgos para las víctimas y para el equipo de actuación.',
    'Reconocer las vías de exposición biológica, química y física.',
    'Aplicar la evaluación dinámica de riesgos durante toda la intervención.',
  ],
  catalogos,
  conceptos,
  casos,
  memoria,
  sprint,
  escape,
};
