/**
 * pictogramas.js — Unidad temática 3: PICTOGRAMAS DE RIESGO QUÍMICO.
 *
 * Capa: DATOS. Contenido estructurado y nada más.
 *
 * ---------------------------------------------------------------------------
 * REGLAS DE ESTE ARCHIVO
 * ---------------------------------------------------------------------------
 * 1. Solo datos. Ninguna función, ningún `if`, ningún bucle.
 * 2. Cada entrada lleva un `id` estable.
 * 3. `imagen` es la ruta a un fichero DENTRO de `src/assets/`, nunca a
 *    `_privado-NoemiCelaya/`. Ver la nota sobre procedencia de imágenes más abajo.
 *
 * ---------------------------------------------------------------------------
 * PROCEDENCIA Y PROCEDENCIA DE LAS IMÁGENES
 * ---------------------------------------------------------------------------
 * Texto: `_privado-NoemiCelaya/documentos-base-escena-segura/pictogramas/PICTOGRAMAS.docx`.
 * Material de trabajo: no se publica, no se copia al despliegue y no se muestra
 * al alumnado.
 *
 * Imágenes: los nueve ficheros .jpg de
 * `_privado-NoemiCelaya/documentos-base-escena-segura/pictogramas/` son los
 * pictogramas normalizados del sistema armonizado europeo de clasificación y
 * etiquetado de productos químicos (SGA/CLP, Reglamento CE 1272/2008). Son
 * símbolos oficiales regulados, no una obra original de la autoría, y pueden
 * reutilizarse tal cual.
 *
 * Aun así, se han copiado de forma EXPLÍCITA a `src/assets/images/pictogramas/`
 * en lugar de enlazarlos desde `_privado-NoemiCelaya/`, por dos razones:
 *   · cumple la regla de que `_privado-NoemiCelaya/` nunca se despliega;
 *   · desacopla la aplicación de los ficheros de trabajo del profesorado, de
 *     modo que estos puedan moverse o renombrarse sin romper la aplicación.
 * La decisión queda registrada en `agents.md`.
 *
 * ---------------------------------------------------------------------------
 * RUTAS DE IMAGEN
 * ---------------------------------------------------------------------------
 * Son relativas a la raíz del proyecto, que es donde vive `index.html`.
 * Un módulo ES resuelve las rutas relativas a SU PROPIO fichero, por eso no
 * se pueden escribir como './assets/...': la aplicación siempre las trata como
 * absolutas desde la raíz.
 *
 * @module data/pictogramas
 */

/** Prefijo común de las imágenes. Evita repetirlo nueve veces. */
const RUTA_IMAGEN = 'src/assets/images/pictogramas';

/* ==========================================================================
   CATÁLOGO DE PICTOGRAMAS
   Un solo catálogo: los nueve pictogramas del sistema armonizado que aparecen
   en el material de partida. Añadir un pictograma nuevo (o uno de Environment)
   es añadir una entrada a esta lista, sin tocar ningún motor.
   ========================================================================== */

const catalogos = {
  pictograma: [
    {
      id: 'explosivo',
      nombre: 'Explosivo',
      imagen: `${RUTA_IMAGEN}/explosivo.jpg`,
      significado:
        'Sustancia que puede hacer explosión bajo el efecto de una llama o por choque o fricción.',
      ejemplo:
        'Nitroglicerina, dinamita o aerosoles presurizados que pueden detonar con un golpe.',
      consejo:
        'Mantener distancia, no golpear ni generar chispas. No acercar el material a fuentes de ignición.',
      gravedadVisual: 'peligro',
    },
    {
      id: 'inflamable',
      nombre: 'Inflamable',
      imagen: `${RUTA_IMAGEN}/inflamable.jpg`,
      significado:
        'Sustancia que se puede inflamar en contacto con una fuente de ignición.',
      ejemplo:
        'Gasolina, alcohol, disolventes y barnices. También gases inflamables a presión.',
      consejo:
        'Alejar de llamas, chispas y superficies calientes. Ventilar la zona si no hay riesgo de ignición.',
      gravedadVisual: 'peligro',
    },
    {
      id: 'comburente',
      nombre: 'Comburente',
      imagen: `${RUTA_IMAGEN}/comburente.jpg`,
      significado:
        'Sustancia que tiene la capacidad de facilitar la combustión de sustancias inflamables.',
      ejemplo:
        'Agua oxigenada, permanganato de potasio o nitratos, que hacen que arda antes los materiales inflamables.',
      consejo:
        'Puede no ser inflamable en sí mismo y aun así hacer arder cualquier material inflamable cercano.',
      gravedadVisual: 'peligro',
    },
    {
      id: 'gas-presion',
      nombre: 'Gas a presión',
      imagen: `${RUTA_IMAGEN}/gas-presion.jpg`,
      significado: 'Sustancia gaseosa contenida en un envase a presión.',
      ejemplo: 'Bombonas de gas, extintores y aerosoles presurizados.',
      consejo:
        'Recipiente cerrado con calor o impacto: puede reventar. No exponer al fuego ni a golpes.',
      gravedadVisual: 'atencion',
    },
    {
      id: 'corrosivo',
      nombre: 'Corrosivo',
      imagen: `${RUTA_IMAGEN}/corrosivo.jpg`,
      significado:
        'Sustancia que causa destrucción cutánea o lesiones oculares graves por contacto, o sustancias corrosivas para los metales.',
      ejemplo: 'Ácido clorhídrico, hidróxido de sodio (sosa cáustica) o agua oxigenada concentrada.',
      consejo:
        'Evitar todo contacto con piel y ojos. Requiere protección ocular y guantes resistentes.',
      gravedadVisual: 'peligro',
    },
    {
      id: 'peligro-salud',
      nombre: 'Peligro para la salud',
      imagen: `${RUTA_IMAGEN}/peligro-salud.jpg`,
      significado:
        'Sustancia nociva en caso de ingestión, por contacto con la piel o por inhalación. Puede causar irritación ocular, cutánea y de las vías respiratorias, y provocar somnolencia o vértigo.',
      ejemplo: 'Disolventes, productos de limpieza con amoníaco o aerosoles de uso doméstico.',
      consejo:
        'No se inhala el humo ni se toca sin guantes. Los síntomas pueden aparecer horas después.',
      gravedadVisual: 'atencion',
    },
    {
      id: 'toxicidad-aguda',
      nombre: 'Toxicidad aguda',
      imagen: `${RUTA_IMAGEN}/toxicidad-aguda.jpg`,
      significado:
        'Puede llegar a ser mortal en caso de ingestión, por contacto con la piel o por inhalación.',
      ejemplo: 'Cloruro, cianuros o metanol en concentraciones elevadas.',
      consejo:
        'El pictograma más severo: llamar de inmediato al 112 si hay exposición, aunque la persona parezca bien.',
      gravedadVisual: 'peligro',
    },
    {
      id: 'peligro-grave-salud',
      nombre: 'Peligro grave para la salud',
      imagen: `${RUTA_IMAGEN}/peligro-grave-salud.jpg`,
      significado:
        'Puede ser mortal en caso de ingestión y penetración en las vías respiratorias. Puede afectar a determinados órganos, a la fertilidad y al feto, y provocar cáncer.',
      ejemplo: 'Benceno, amianto o monóxido de carbono.',
      consejo:
        'Efectos graves y a largo plazo. Evitar la exposición y no usarlo en espacios cerrados.',
      gravedadVisual: 'peligro',
    },
    {
      id: 'peligro-medio-ambiente',
      nombre: 'Peligro para el medio ambiente',
      imagen: `${RUTA_IMAGEN}/peligro-medio-ambiente.jpg`,
      significado:
        'Tóxico o muy tóxico para los organismos acuáticos, con efectos nocivos duraderos.',
      ejemplo: 'Pesticidas o productos de limpieza con tensioactivos.',
      consejo:
        'No verter al desagüe ni al terreno. La contaminación persiste aunque desaparezca el producto de la superficie.',
      gravedadVisual: 'atencion',
    },
  ],
};

/* ==========================================================================
   CONCEPTOS CLAVE
   ========================================================================== */

const conceptos = [
  {
    id: 'c-para-que-sirven',
    termino: 'Para qué sirven los pictogramas',
    definicion:
      'Las etiquetas de los productos químicos incluyen pictogramas que informan del tipo de riesgo de cada producto, y permiten anticipar medidas de protección antes de manipularlo.',
    ejemplo:
      'En un almacén, ver el pictograma de corrosivo en un bidón indica que hay que pedir guantes y gafas antes de abrirlo.',
  },
  {
    id: 'c-rotulo-h-infra',
    termino: 'Elementos de una etiqueta de producto químico',
    definicion:
      'Una etiqueta de producto peligroso incluye el nombre del producto, los pictogramas de peligro, las frases H (indicaciones de peligro) y las frases P (consejos de prudencia).',
    ejemplo:
      'Un envase de lejía muestra el pictograma de corrosivo y frases que indican que no debe mezclarse con ácidos.',
  },
  {
    id: 'c-forma-rombo',
    termino: 'Cómo es un pictograma',
    definicion:
      'Es un rombo rojo con fondo blanco y un símbolo negro en el interior. La forma de rombo permite reconocerlo en vertical, a contraluz o desde lejos.',
    ejemplo:
      'Un bidón o una cisterna a lo lejos: si se distingue el rombo, ya se sabe que hay un peligro.',
  },
  {
    id: 'c-leer-sin-etiqueta',
    termino: 'Si no hay etiqueta o la que hay está dañada',
    definicion:
      'Un producto sin etiqueta se trata como peligroso por defecto: se comunica al centro coordinador y se espera a los servicios especializados.',
    ejemplo:
      'Un bidón caducado sin etiqueta en el fondo de un almacén: se comunica y no se manipula.',
  },
];

/* ==========================================================================
   CASOS
   Cada caso es un producto o una situación en la que hay que interpretar un
   pictograma. `pictograma` es el identificador que empareja Memory y Sprint.
   ========================================================================== */

const casos = [
  {
    id: 'p-explosivo',
    etiqueta: 'Cartón de dinamita en el almacén de una mina abandonada',
    contexto:
      'La caja lleva el pictograma de explosivo y está caducada. Alguien la ha movido para hacer sitio.',
    pictograma: 'explosivo',
    imagen: `${RUTA_IMAGEN}/explosivo.jpg`,
    explicacion:
      'El pictograma de explosivo indica que puede detonar con una llama, por choque o por fricción. La caja caducada aumenta la inestabilidad del explosivo. No se manipula y se comunica la situación.',
  },
  {
    id: 'p-inflamable',
    etiqueta: 'Bidones de 200 litros de disolvente en el sótano de una imprenta',
    contexto:
      'Junto al disolvente hay una caldera encendida y cableado eléctrico sin protección.',
    pictograma: 'inflamable',
    imagen: `${RUTA_IMAGEN}/inflamable.jpg`,
    explicacion:
      'El disolvente se puede inflamar en contacto con una fuente de ignición. Con una caldera encendida al lado, el riesgo de incendio es inmediato.',
  },
  {
    id: 'p-comburente',
    etiqueta: 'Frasco de agua oxigenada junto a un montón de ropa de algodón',
    contexto:
      'En una empresa de limpieza hay un bote de agua oxigenada al lado de un montón de vendas de algodón.',
    pictograma: 'comburente',
    imagen: `${RUTA_IMAGEN}/comburente.jpg`,
    explicacion:
      'El agua oxigenada no arde, pero facilita la combustión de lo inflamable que tenga cerca: el algodón puede arder con mucha facilidad en su presencia.',
  },
  {
    id: 'p-gas-presion',
    etiqueta: 'Bombona de gas butano pegada a una cocina',
    contexto:
      'La bombona está en el hueco de la cocina, junto a una estufa encendida.',
    pictograma: 'gas-presion',
    imagen: `${RUTA_IMAGEN}/gas-presion.jpg`,
    explicacion:
      'Un envase a presión puede reventar con el calor o con un golpe. En una cocina, junto a una estufa, el calor es la amenaza inmediata.',
  },
  {
    id: 'p-corrosivo',
    etiqueta: 'Barril de ácido clorhídrico con la etiqueta medio borrada',
    contexto:
      'El barril se ha movido y el líquido ha salpicado el suelo del pasillo. Hay una puerta cortafuegos que se cierra.',
    pictograma: 'corrosivo',
    imagen: `${RUTA_IMAGEN}/corrosivo.jpg`,
    explicacion:
      'El ácido produce destrucción cutánea y lesiones oculares graves por contacto. Un derrame en un pasillo obliga a señalizar, ventilar si es seguro y a proteger piel y ojos.',
  },
  {
    id: 'p-peligro-salud',
    etiqueta: 'Aerosol de limpieza WC en un local rotulado como de uso doméstico',
    contexto:
      'El bote está mal cerrado y se ha usado en un local de 40 personas sin ventilación.',
    pictograma: 'peligro-salud',
    imagen: `${RUTA_IMAGEN}/peligro-salud.jpg`,
    explicacion:
      'Es nocivo por inhalación, por contacto y por ingestión, y puede irritar las vías respiratorias. En un local cerrado y sin ventilación, la concentración llega a ser peligrosa.',
  },
  {
    id: 'p-toxicidad',
    etiqueta: 'Bote de insecticida sin cierre en una vivienda',
    contexto:
      'El bote está abierto junto a la cama de un niño. Huele fuerte en toda la habitación.',
    pictograma: 'toxicidad-aguda',
    imagen: `${RUTA_IMAGEN}/toxicidad-aguda.jpg`,
    explicacion:
      'Puede ser mortal por ingestión, por contacto con la piel o por inhalación. La exposición en curso es una urgencia vital: hay que ventilar y llamar al 112.',
  },
  {
    id: 'p-peligro-grave',
    etiqueta: 'Bidón de benceno etiquetado en una empresa de limpieza industrial',
    contexto:
      'El operario que lo transporta lleva las manos descubiertas y no conoce las medidas de seguridad del producto.',
    pictograma: 'peligro-grave-salud',
    imagen: `${RUTA_IMAGEN}/peligro-grave-salud.jpg`,
    explicacion:
      'El benceno es mortal por ingestión e inhalación, daña órganos, afecta a la fertilidad y al feto y es cancerígeno. Es un riesgo a medio y largo plazo además de inmediato.',
  },
  {
    id: 'p-medio-ambiente',
    etiqueta: 'Fosa con un plaguicida diluido sin protección en un descampado',
    contexto:
      'El producto ha llegado a un arroyo cercano. Hay peces sin movimiento en la orilla.',
    pictograma: 'peligro-medio-ambiente',
    imagen: `${RUTA_IMAGEN}/peligro-medio-ambiente.jpg`,
    explicacion:
      'Es tóxico para los organismos acuáticos con efectos duraderos. El riesgo no termina al evacuar el producto: la contaminación del suelo y del agua permanece.',
  },
];

/* ==========================================================================
   MEMORY: CONFIGURACIONES DECLARATIVAS
   El campo `como: 'imagen'` fuerza que el valor se presente como imagen aunque
   en los datos esté guardado como una ruta de texto.
   ========================================================================== */

const memoria = {
  configuraciones: [
    {
      id: 'pictograma-nombre',
      titulo: 'Pictograma ↔ Nombre',
      instruccion:
        'Une cada imagen de pictograma con su nombre. Fíjate en el símbolo, no en la posición de la carta.',
      izquierda: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        campo: 'imagen',
        como: 'imagen',
        etiqueta: 'Pictograma',
      },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        campo: 'nombre',
        enlazadoPor: 'id',
        etiqueta: 'Nombre',
      },
      limite: 8,
    },
    {
      id: 'pictograma-significado',
      titulo: 'Pictograma ↔ Significado',
      instruccion:
        'Une cada pictograma con lo que significa. Reconocer el símbolo es solo el primer paso: hay que saber qué riesgo indica.',
      izquierda: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        campo: 'imagen',
        como: 'imagen',
        etiqueta: 'Pictograma',
      },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        campo: 'significado',
        enlazadoPor: 'id',
        etiqueta: 'Significado',
      },
      limite: 6,
    },
    {
      id: 'nombre-significado',
      titulo: 'Nombre ↔ Significado',
      instruccion:
        'Une cada nombre de pictograma con su significado. En un producto real solo tienes unos segundos para decidir.',
      izquierda: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        campo: 'nombre',
        etiqueta: 'Nombre',
      },
      derecha: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        campo: 'significado',
        enlazadoPor: 'id',
        etiqueta: 'Significado',
      },
      limite: 6,
    },
  ],
};

/* ==========================================================================
   SPRINT: PLANTILLAS DE PREGUNTAS
   `ilustracion` declara la imagen que acompaña al enunciado.
   ========================================================================== */

const sprint = {
  cantidad: 10,
  plantillas: [
    {
      id: 'sprint-nombre',
      tipo: 'opcion-multiple',
      enunciado: '¿Qué pictograma es este?',
      ilustracion: '{caso.imagen}',
      altIlustracion: 'Pictograma de riesgo químico que hay que identificar',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        enlazadoPor: 'pictograma',
        campo: 'nombre',
      },
      distractores: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        campo: 'nombre',
        cantidad: 3,
      },
      retroalimentacion: {
        acierto: 'Correcto. Reconocer el pictograma es el primer paso para protegerse.',
        error:
          'Repasa el símbolo: explosivo (llama sobre ondas), inflamable (llama), comburente (llama sobre un círculo), corrosivo (dos manos y una superficie corroídas), gas a presión (cilindro), salud (silueta con una estrella en el pecho) y medio ambiente (árbol y pez).',
        explicacion: '{caso.explicacion}',
      },
      dificultad: 'basica',
    },
    {
      id: 'sprint-significado',
      tipo: 'opcion-multiple',
      enunciado: '¿Qué significa este pictograma?',
      ilustracion: '{caso.imagen}',
      altIlustracion: 'Pictograma cuyo significado hay que elegir',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        enlazadoPor: 'pictograma',
        campo: 'significado',
      },
      distractores: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        campo: 'significado',
        cantidad: 3,
      },
      retroalimentacion: {
        acierto: 'Correcto. El significado es lo que dice qué medida hay que tomar.',
        error:
          'El símbolo es un recordatorio visual, pero lo que obliga a actuar es el significado. Léelo entero antes de decidir.',
        explicacion: '{caso.explicacion}',
      },
      dificultad: 'media',
    },
    {
      id: 'sprint-consejo',
      tipo: 'opcion-multiple',
      enunciado: '¿Qué medida de prevención corresponde a este pictograma?',
      ilustracion: '{caso.imagen}',
      altIlustracion: 'Pictograma del que hay que deducir la medida preventiva',
      pista: '{caso.contexto}',
      correcta: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        enlazadoPor: 'pictograma',
        campo: 'consejo',
      },
      distractores: {
        fuente: 'catalogos',
        catalogo: 'pictograma',
        campo: 'consejo',
        cantidad: 3,
      },
      retroalimentacion: {
        acierto: 'Correcto: el pictograma existe para que esta medida se tome antes de tocar nada.',
        error:
          'Cada pictograma tiene una consecuencia clara: fuego, reacción violenta, corrosión, exposición o contaminación. Piensa en qué medida la evita.',
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
      id: 'esc-pictogramas-almacen',
      titulo: 'Almacén de limpieza: producto desconocido en el pasillo',
      briefing:
        'Un domingo por la tarde. Entras en un almacén de productos de limpieza y el pasillo huele a fuerte. Hay un charco y varios envases sin etiqueta. Tu trabajo es decidir sin tocar nada.',
      ambientacion: 'Almacén de limpieza · 17:20 h',
      tiempoTotal: 300,
      fases: [
        {
          id: 'f1',
          titulo: 'El primer envase',
          texto:
            'En el suelo hay un charco que ya ha alcanzado la rejilla de desagüe. Junto a la pared hay un envase de cristal sin etiqueta, con el cuello corroído y el líquido goteando.',
          tiempoLimite: 60,
          puntos: 10,
          opciones: [
            {
              id: 'f1o1',
              texto: 'Tratarlo como corrosivo hasta que alguien demuestre lo contrario, y proteger piel y ojos.',
              correcta: true,
              retroalimentacion: {
                breve: 'Correcto: sin etiqueta, se trabaja como si fuera peligroso.',
                explicacion:
                  'Un producto desconocido puede ser corrosivo, y el único dato que no tienes es precisamente el que lo diría. El fallo del envase (el cuello corroído) es un indicio adicional de posible corrosión.',
                transferencia:
                  'La norma de trabajo es simple: si no puedes identificar el producto, lo tratas como peligroso, te proteges y esperas a los servicios especializados.',
              },
            },
            {
              id: 'f1o2',
              texto: 'Recoger el líquido con una fregona, porque parece agua.',
              correcta: false,
              retroalimentacion: {
                breve: 'Que parezca agua es precisamente el motivo del peligro.',
                explicacion:
                  'Un producto no identificado puede reaccionar con el agua o con el material de la fregona, y el contacto directo con la piel es la vía más frecuente de lesión.',
                transferencia:
                  'Absorber o limpiar sin saber qué es el producto es una exposición sin control, no una solución.',
              },
            },
            {
              id: 'f1o3',
              texto: 'Ventilar y esperar, sin tocar nada y sin proteger el equipo.',
              correcta: false,
              retroalimentacion: {
                breve: 'Ventilar está bien, pero sin protección sigues expuesto.',
                explicacion:
                  'Ventilar reduce la concentración en el aire, pero si el producto es corrosivo o el charco está en una zona de paso, el contacto sigue siendo posible. La protección individual no se negocia.',
                transferencia:
                  'Ventilar, protegerse y avisar son tres acciones, no tres alternativas.',
              },
            },
          ],
        },
        {
          id: 'f2',
          titulo: 'La etiqueta que sí se lee',
          texto:
            'Más adelante encuentras un envase CON etiqueta. Mira el símbolo y decide qué significa.',
          imagen: `${RUTA_IMAGEN}/corrosivo.jpg`,
          altImagen: 'Pictograma de riesgo corrosivo que hay que identificar',
          tiempoLimite: 60,
          puntos: 10,
          opciones: [
            {
              id: 'f2o1',
              texto: 'Es corrosivo: busco guantes resistentes y gafas, y no dejo que nadie lo toque sin protección.',
              correcta: true,
              retroalimentacion: {
                breve: 'Correcto. Has interpretado el símbolo y has actuado en consecuencia.',
                explicacion:
                  'El pictograma de corrosivo indica destrucción cutánea o lesiones oculares graves por contacto. La protección mínima es guantes resistentes y gafas o pantalla.',
                transferencia:
                  'Interpretar el pictograma y convertirlo en medidas concretas es la competencia que se evalúa en esta unidad.',
              },
            },
            {
              id: 'f2o2',
              texto: 'Es comburente: la llama sobre el círculo indica que la sustancia arde.',
              correcta: false,
              retroalimentacion: {
                breve: 'La forma del símbolo no es la de un pictograma de llama.',
                explicacion:
                  'El comburente muestra una llama sobre un círculo, no dos manos. Las manos sobre una superficie corroída identifican un riesgo de corrosión cutánea.',
                transferencia:
                  'Confundir estos dos símbolos lleva a la protección equivocada: unos guantes sin gafas no protegen los ojos.',
              },
            },
            {
              id: 'f2o3',
              texto: 'Es peligro para la salud: solo hay que evitar inhalarlo.',
              correcta: false,
              retroalimentacion: {
                breve: 'La silueta solo aparece en el pictograma con estrella en el pecho.',
                explicacion:
                  'La silueta humana con una estrella en el pecho es el pictograma de peligro para la salud. Las manos sobre una superficie corroída es el de corrosivo, que además de la vía inhalatoria ataca piel y ojos.',
                transferencia:
                  'Un pictograma no excluye a otro: muchos productos llevan varios a la vez.',
              },
            },
          ],
        },
        {
          id: 'f3',
          titulo: 'Lo que se lleva el equipo',
          // Ampliada a cuatro opciones (bloque 5): la pregunta es qué se
          // comunica al final. La decisión está en `agents.md` §7.7.
          opcionesMinimas: 4,
          texto:
            'Al salir, la responsable del almacén te pregunta cómo ha ido todo y qué productos hay que retirar. Tú no has podido identificar todos.',
          tiempoLimite: 60,
          puntos: 10,
          opciones: [
            {
              id: 'f3o1',
              texto:
                'Informar de los envases identificados por pictograma y señalar como desconocido el que no tiene etiqueta.',
              correcta: true,
              retroalimentacion: {
                breve: 'Correcto: informas de lo que sabes y de lo que no.',
                explicacion:
                  'Un informe útil dice dos cosas: qué se ha identificado y con qué evidencia (el pictograma), y qué queda sin identificar. Con eso la empresa puede retirar los productos y pedir el MSDS del que falta.',
                transferencia:
                  'Comunicar la incertidumbre con precisión es parte del trabajo técnico y también es prevención.',
              },
            },
            {
              id: 'f3o2',
              texto: 'Dejar el almacén tal cual y no decir nada hasta que aparezca el producto concreto.',
              correcta: false,
              retroalimentacion: {
                breve: 'Un producto desconocido sin etiqueta es un riesgo que se repite cada día.',
                explicacion:
                  'Un envase sin etiqueta en un almacén al que puede acceder cualquier persona vuelve a exponer a quien entre. La comunicación del riesgo es parte de la prevención.',
                transferencia:
                  'Cada vez que no se comunica un riesgo, se deja que el riesgo se mantenga.',
              },
            },
            {
              id: 'f3o3',
              texto: 'Guardar solo el envase identificado y no mencionar los demás.',
              correcta: false,
              retroalimentacion: {
                breve: 'Ocultar un envase desconocido no lo hace seguro.',
                explicacion:
                  'El resto de los envases sin etiqueta siguen en el almacén: hay que señalarlos como desconocidos para que se retiren de forma segura.',
                transferencia:
                  'La seguridad del almacén no depende solo del producto que has identificado, sino de todos los que no lo están.',
              },
            },
            {
              id: 'f3o4',
              texto: 'Identificar el producto por el olor y anotarlo con el nombre que has supuesto.',
              correcta: false,
              retroalimentacion: {
                breve: 'Ningún olor sustituye a la etiqueta ni a la ficha de datos.',
                explicacion:
                  'Identificar por el olfato es extremadamente arriesgado y puede dar información falsa. Los envases sin etiqueta se deben tratar como desconocidos.',
                transferencia:
                  'La incertidumbre hay que registrarla, no adivinarla.',
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
  id: 'pictogramas',
  orden: 3,
  nombre: 'Pictogramas químicos',
  subtitulo: 'Interpretar las señales de peligro antes de tocar nada',
  descripcion:
    'Aprende a reconocer los pictogramas de riesgo del sistema armonizado, a interpretar su significado y a deducir la medida preventiva que exige cada uno antes de acercarse a un producto peligroso.',
  icono: 'pictogramas',
  acento: 'quimico',
  objetivos: [
    'Reconocer los nueve pictogramas de riesgo del sistema armonizado.',
    'Interpretar el significado de cada pictograma sin vacilar.',
    'Deducir la medida preventiva que exige cada pictograma.',
    'Actuar ante un producto no identificado o sin etiqueta.',
  ],
  catalogos,
  conceptos,
  casos,
  memoria,
  sprint,
  escape,
};
