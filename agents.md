# agents.md — Documentación viva del proyecto

Este fichero es la memoria del proyecto. No es documentación para el alumnado ni
para quien usa la aplicación en clase: es para quien la mantiene. Se actualiza
**cuando se toma una decisión**, no cuando se escribe código.

Si algo de lo que hay aquí ya no es cierto, está mal: un documento desactualizado
miente peor que uno ausente.

## 1. Qué es esto

Recurso interactivo estático para el Ciclo Formativo de Emergencias Sanitarias
(TES), creado por Noemí Celaya Mingot. Tres unidades temáticas, cada una con
tres actividades (Memory, Sprint, Escape Room). JavaScript nativo con módulos
ES, **cero dependencias**, sin servidor ni cuentas: el progreso vive en el
`localStorage` del navegador. Licencia CC BY-NC-SA 4.0 (ver §6.1).

## 2. Arquitectura

### 2.1 Capas

| Capa | Carpeta | Regla |
|---|---|---|
| Datos | `src/data/` | Solo datos. Ni una función, ni un `if`, ni un bucle. |
| Motores | `src/games/` | Lógica de partida. No conocen de qué va el tema. |
| Interfaz | `src/ui/` | DOM y navegación. Sin lógica de juego. |
| Utilidades | `src/utils/` | Transversales; `generadores.js` es el puente datos→motores. |
| Comprobaciones | `scripts/` | Se ejecutan en Node; ninguna se importa desde `src/`. |

La regla de oro, escrita en la cabecera de `src/games/motor.js`: **los motores
no conocen el contenido y los datos no conocen los motores.** Si una unidad
nueva necesita tocar un motor, el diseño está roto.

Unidades registradas: el único punto de publicación es el array `unidades` de
`src/data/index.js`. Si un fichero no está ahí, no existe para la aplicación.

#### 2.1.1 El fallo de `vistaEncabezada()`

Las cinco vistas que usaban `vistaEncabezada()` mostraban su cuerpo como el
texto literal `[object HTMLElement]`: el error estaba en cómo se componía el
DOM, no en los datos, y **ningún test lo cazó**. De ahí que exista el recorrido
en navegador (`scripts/recorrer.mjs`) como paso separado de `npm test`
(ver §7.2). Referenciado desde el comentario cabecera de ese mismo script.

## 3. Los tres motores

### 3.1 Memory

`src/games/memory.js` — `crearMemory(unidad, opciones)`. Dos columnas de cartas
barajadas por separado; el usuario elige una de cada columna y el motor
comprueba el par. No se rebaraja al repintar: el tablero se construye una vez
al iniciar.

### 3.2 Sprint

`src/games/sprint.js` — `crearSprint(unidad, opciones)`. Mazo de preguntas con
reloj por pregunta. La realimentación se muestra **antes** de poder continuar:
en una actividad sobre seguridad, seguir sin entender no cuenta como avanzar.
El tiempo agotado cuenta como fallo y avanza.

### 3.3 Contrato común

`src/games/motor.js` es el contrato que cumplen los tres. Un motor:

1. **Recibe** una unidad temática y un identificador de juego.
2. **Prepara** una partida: lista de elementos o fases, con semilla opcional
   para partidas reproducibles.
3. **Expone** un estado con SIEMPRE estas claves —
   `id, juego, unidad, titulo, instruccion, fase ('preparando' | 'jugando' |
   'terminado'), indice, total, aciertos, fallos, puntos, tiempoRestante,
   terminado, terminadoCorrectamente, mensaje` — para que la interfaz lea sin
   preguntar de qué juego se trata.
4. **Acepta** una acción (`responder`, `avanzar`).
5. **Avisa** de los cambios mediante `suscribir()`.

La interfaz no necesita un `if` por juego para el ciclo de partida: usa el mismo
contrato y solo cambia lo que pinta. Un cuarto formato = un motor más y una
entrada en `src/ui/juegos/indice.js`; ni `app.js` ni las vistas cambian.

El reloj (`crearReloj`) usa `requestAnimationFrame` con acumulado de un segundo
en vez de `setInterval`, para que un tick perdido no descuente tiempo real de
más. Es el único sitio del proyecto con temporizadores: limpiar el reloj es
responsabilidad del motor, no de la vista.

### 3.4 Escape Room

`src/games/escape.js` — `crearEscape(unidad, opciones)`. Escenario con briefing
y fases encadenadas; no se avanza de fase sin haber decidido. Cada opción
lleva realimentación en **tres niveles obligatorios** (`breve`, `explicacion`,
`transferencia`): `construirEscenarios()` falla si falta alguna. El motor
registra `decisiones[]` para la revisión final.

## 4. Los datos

Además de lo que sigue, los datos personales del alumnado: **cero**. El
progreso vive en el `localStorage` del navegador con estadísticas agregadas y
la revisión de la última partida por actividad; no hay cuentas, ni servidores,
ni trazas por persona (`src/utils/storage.js`, comentario de `revisiones`).

### 4.1 Forma de un fichero de unidad

Contrato idéntico en las tres unidades (documentado también en la cabecera de
`src/data/clasificacion.js`):

```
id, nombre, subtitulo, descripcion, icono, acento, orden, objetivos
catalogos : { <nombre>: [{ id, nombre, definicion, ejemplo, ... }] }
conceptos : [{ id, termino, definicion, ejemplo }]
casos     : [{ id, etiqueta, contexto, tipo, clasificacion, explicacion }]
memoria   : { configuraciones: [{ id, titulo, izquierda, derecha, limite }] }
sprint    : { cantidad, plantillas: [{ id, enunciado, correcta, ... }] }
escape    : { escenarios: [{ id, titulo, briefing, fases: [...] }] }
```

Reglas que los tests hacen cumplir:

- **Ids estables.** Un `id` es clave de emparejamiento, de progreso guardado y
  de URL. Renombrarlo rompe el progreso del alumnado; no se renombra a la ligera.
- **Memoria y Sprint no escriben cartas ni preguntas.** Declaran *qué* campos
  se emparejan (`fuente`, `campo`, `clave`, `enlazadoPor`) y los generadores
  (`src/utils/generadores.js`) construyen las actividades reales.
- `correcta` en una plantilla de Sprint **no contiene la respuesta**: indica de
  dónde la obtiene el generador (catálogo o casos), con el mismo `enlazadoPor`
  que la contraparte.
- `auditarUnidad()` (y `npm test`) construye cada actividad con los generadores
  de verdad: si un `enlazadoPor` está mal, no hay cartas, y la auditoría lo dice.

**El `alt` de una imagen nunca es su ruta.** El contenido gráfico (`como:
'imagen'`, `ilustracion`, `imagen` de fase) lleva un `alt` humano: el nombre de
la entrada del catálogo o el que declara la plantilla. El `alt` es lo que
enseña el navegador si la imagen no carga (servidor caído, pestaña guardada) y
es además el texto que el repaso de Memory convierte en pantalla: una ruta
`src/assets/...` no le dice nada a quien estudia. Antes del 2026-10-18 la ruta
era el `alt` por defecto en las cartas de pictogramas; `descripcionDe()`
(`src/utils/generadores.js`) es quien lo impide ahora.

### 4.2 Claves que se propagan

Cuando un campo declarado en `src/data/` debe llegar al motor o al auditor
(p. ej. `opcionesMinimas` de una fase), hay que **propagarlo explícitamente**
en `construirEscenarios()` / generadores. Una clave escrita en el sitio
equivocado o no propagada deja la actividad sin efecto en silencio: el dato
existe, pero nadie lo lee. Ver comentario en `src/utils/generadores.js`
(propagación de `opcionesMinimas`).

### 4.3 Erratas conocidas (lista cerrada)

`npm test` no usa un corrector: detecta una **lista cerrada** de erratas
conocidas, en `ERRATAS_CONOCIDAS` (`scripts/probar-generadores.mjs`). Cada
entrada salió de un fallo real de este repositorio. Solo se amplía cuando
alguien encuentra un caso nuevo; un corrector de estilo la resolvería solo.
Junto a ella, patrones de palabras inglesas, palabras pegadas, mayúsculas
inexplicadas y alfabetos ajenos, siempre sobre el **texto visible** del
alumnado (nunca sobre identificadores de código).

## 5. Cómo se verifica

`npm run verificar` = `check` + `test` + `test:motores` + `test:navegador`.
Pásalo antes de dar algo por terminado. Qué caza cada paso: ver la tabla de
comandos en `README.md`. Regla de reparto (§7.2): los avisos de **contenido**
los da `npm test`; el recorrido en navegador caza fallos de **composición del
DOM** y de navegación.

## 6. Material de trabajo privado

Todo el material de partida original (documentos .docx, .pdf, imágenes y
auxiliares) **debe encontrarse íntegramente en _privado-NoemiCelaya/**.
- La consulta de la fuente se realiza únicamente desde esa carpeta. No se busca
  material fuera de ella.
- Los .docx son el formato preferido para extraer el contenido estructurado.
- Los .pdf pueden usarse para contrastar cuando proceda.
- _privado-NoemiCelaya/ está en .gitignore y scripts/servir.mjs deniega el
  acceso desde el servidor de desarrollo.
- No se copia material de trabajo a src/.
- `knowledge-base/` **se eliminó**: era un duplicado byte a byte de
  _privado-NoemiCelaya/ (mismos .docx y .jpg) y contradecía esta regla. No se
  recrea. La única fuente de material de trabajo es _privado-NoemiCelaya/.

Contenido actual (verificado 2026-10-16):
- `documentos-base-escena-segura/` — `Clasificación.docx/.pdf`,
  `Riesgos.docx/.pdf` y `pictogramas/` (PICTOGRAMAS.docx/.pdf + los nueve .jpg).
- `documentos-base/` — copia antigua de los nueve .jpg y `PICTOGRAMAS.docx`.

### 6.1 Pictogramas, licencia y reimágenes

- El **texto** de la unidad de pictogramas se reelaboró desde
  `_privado-NoemiCelaya/documentos-base-escena-segura/pictogramas/PICTOGRAMAS.docx`.
- Los nueve pictogramas son **símbolos oficiales** del sistema armonizado
  europeo de clasificación y etiquetado (SGA/CLP, Reglamento CE 1272/2008).
  No son obra original de la autoría: se reutilizan tal cual y **no se
  modifican** (ni recorte, ni color, ni rotación).
- Se copiaron de forma explícita a `src/assets/images/pictogramas/` en lugar
  de enlazarlos desde `_privado-NoemiCelaya/`, por dos razones: la carpeta
  privada nunca se despliega, y así el material de trabajo puede moverse sin
  romper la aplicación.
- Las rutas de imagen en los datos son relativas a la raíz del proyecto (donde
  vive `index.html`), nunca relativas al módulo.
- El material de autoría (textos, casos, actividades) es de Noemí Celaya
  Mingot con licencia CC BY-NC-SA 4.0. Créditos visibles en `acerca-de` y en
  `src/config.js` (`CREDITOS`, `LICENCIA`, `AUTORIA`).

## 7. Decisiones registradas

### 7.1 Node >=18 y ninguna instalación obligatoria

`package.json` fija `engines.node >=18`: es lo que necesita `npm start` para
servir estáticamente. `test:navegador` necesita Node 22+ (WebSocket global) y
Chrome; si falta cualquiera de los dos **avisa y termina con éxito**, porque
`npm run verificar` tiene que poder pasar en el portátil de quien mantiene sin
obligarle a instalar nada, y un fallo por falta de Chrome no dice nada del
código. `SIN_NAVEGADOR=1` lo salta siempre (integración continua sin
navegador).

### 7.2 Contenido vs navegador

`npm test` valida datos y motores; el recorrido en navegador valida la
composición del DOM, la navegación, el teclado y que el servidor no sirve el
material privado. Los avisos de contenido (erratas, campos sin trazar) los da
`npm test`, no el recorrido: el recorrido no lee el texto con lupa.

### 7.3 Decisiones pedagógicas aprobadas (bloque 6)

Aprobadas sin cambios en la sesión de revisión (ver `revision-contenido.md` §C):
- **C1** Sprint `clasificacion/sprint-tipo`: 3 opciones (1 correcta + 2).
- **C2** Sprint `riesgos/sprint-ambito`: 2 opciones (1 correcta + 1).
- **C3** Escape `esc-riesgos-almacen/f3` ampliada a 4 opciones.
- **C4** Escape `esc-pictogramas-almacen/f3` ampliada a 4 opciones.

### 7.4 Dos ámbitos, no tres

El catálogo `ambito` de la unidad de riesgos tiene **exactamente dos**
entradas, porque el material de partida enumera exactamente dos apartados
(1.3.1 riesgos para las víctimas, 1.3.2 riesgos para el equipo). No se inventa
un tercer ámbito para completar distractores: `sprint-ambito` declara
`opcionesMinimas: 2` y el auditor lo respeta. Una contradicción de este tipo
(ámbito «ambiente» en pictogramas) fue E7 de la revisión y se corrigió
quitando `ambito`/`riesgos` de los casos de pictogramas.

### 7.5 (Sección perdida)

Esta sección existía y su contenido no dejó rastro en el código ni en los
documentos supervivientes. No se reconstruye por inventarla: si alguien
recuerda qué decisión cubría, escribirla aquí.

### 7.6 El número de opciones lo dice la fuente

Las plantillas de Sprint declaran `opcionesMinimas` (por defecto 3) y el
auditor compara contra ese campo, no contra un número fijo. Si la fuente
enumera tres orígenes (natural, tecnológico, antrópico), un cuarto sería
inventar taxonomía, y la plantilla lo dice en su comentario. Un aviso que no
se puede cerrar acaba ignorándose; mejor declarar la intención y que el
auditor la respete.

### 7.7 Escape: realimentación obligatoria y regla de contenido

- **Bloque 5.** Las fases `f3` de los escapes de riesgos y pictogramas se
  ampliaron a cuatro opciones con `opcionesMinimas: 4`: la pregunta es «¿qué
  dato hay que dejar escrito?», no «elige entre cuatro». El campo se propaga
  en `construirEscenarios()` (ver §4.2).
- **Realimentación.** Toda opción de Escape lleva `breve`, `explicacion` y
  `transferencia`. No es opcional: `construirEscenarios()` falla si falta
  alguna, y `npm test` lo comprueba fase a fase.
- **Bloque 6 (regla de sesión).** No se toca `src/data/` sin que cada punto
  esté aprobado por la autora. La sesión de revisión se documentó en
  `revision-contenido.md` (bloque 6 cerrado: A1-A17, B1-B7, D1, D5, E7 y
  F1-F4 aplicados; C1-C4 aprobados).

### 7.8 Estado actual y punto de partida

- El proyecto pasa `npm run verificar` en verde: 38 ficheros, 88 comprobaciones
  de datos, 138 de motores y recorrido en navegador correcto (reconfirmado
  2026-10-16 tras la revisión de procedencia). Para el estado de la primera
  publicación, ver §7.12.
- La carpeta _privado-NoemiCelaya/ contiene el material de las tres unidades
  activas (Clasificación, Riesgos, Pictogramas; ver §6).
- **Punto de partida:** las unidades futuras listadas (Prevención de incendios,
  Soporte vital básico, Ataque al corazón) **no cuentan con material de partida
  en _privado-NoemiCelaya/**. Antes de implementarlas, debe añadirse ahí el
  .docx correspondiente y confirmar con la autora el objetivo y el alcance. Si
  no existe el material, no se implementa nada.

### 7.9 Revisión de procedencia (2026-10-16)

Sesión dedicada a garantizar que el contenido se trabaja **únicamente** desde
_privado-NoemiCelaya/. Decisiones tomadas y **aplicadas**:

- `knowledge-base/` se eliminó por ser duplicado byte a byte de _privado (§6).
- `scripts/servir.mjs` bloquea ahora `_privado-NoemiCelaya` (antes bloqueaba
  `knowledge-base`, de modo que el material original quedaba accesible por HTTP).
  El test de `scripts/recorrer.mjs` comprueba el 403 de `_privado-NoemiCelaya/...`.
- Cabeceras de procedencia corregidas en `src/data/clasificacion.js`,
  `riesgos.js`, `pictogramas.js`, y comentario en `src/utils/dom.js`.
- `README.md` y `.gitignore` actualizados.
- Verificado tras los cambios: 38 ficheros, 88 datos, 138 motores y recorrido en
  navegador (incluidos los 403 de _privado), todo correcto.

**Pendiente para la próxima sesión — contenido sin trazar a los .docx privados.**
Regla vigente: no se toca `src/data/` sin aprobación de la autora.

- Pictogramas: campos `ejemplo` y `consejo` de los nueve pictogramas; el concepto
  `c-rotulo-h-infra` (frases H y P) no aparece en el `.docx`.
- Clasificación: `gravedad[].ejemplo` y `gravedad[].consecuencia`; el `.docx` solo
  define los niveles, no los ejemplifica.
- Riesgos: `via[].enfermedades` de la vía digestiva («Gastroenteritis y Hepatitis
  A») y `quimicos.ejemplo` («producto fitosanitario»).
- Casos, sprints y escapes de las tres unidades: son redacción propia derivada del
  material. Decidir si se aceptan como «contenido de aplicación».
- `c-evaluacion-dinamica` está en clasificación pero su definición proviene del
  `.docx` de riesgos (duplicado; ya anotado como E8 en `revision-contenido.md`).
- La tabla de «riesgos estructurales» de `Riesgos.docx` va incrustada como imagen:
  no se ha podido verificar su trazabilidad de forma automática.

### 7.10 Reconstrucción de este documento (2026-10-16)

Este fichero llegó truncado: citaba §2.1.1, §3.3, §4.1–§4.3, §6.1 y §7.1–§7.7
que ya no existían en el texto. Esas secciones se reconstruyeron **solo con
evidencia del repositorio** (cabeceras de `motor.js`, `clasificacion.js`,
`pictogramas.js`, comentarios de `generadores.js`, `probar-generadores.mjs`,
`recorrer.mjs`, `storage.js` y el cierre del bloque 6 en
`revision-contenido.md`). La única excepción es §7.5, de la que no queda rastro
y que se marcó como perdida en vez de inventarla. README.md y
revision-contenido.md se usaron como contraste, no como fuente única.

### 7.11 Cuadernillos de respuestas: se generan, no se publican (2026-10-18)

`npm run generar:pdf` (`scripts/generar-pdfs.mjs`) escribe los cuadernillos de
respuestas de las nueve actividades en `preguntas-y-respuestas/`. Es material de
corrección para la autora, con la misma consideración que el material de trabajo
(§6): **no se versiona ni se despliega**. Decisión del 2026-10-18, al preparar la
primera publicación del repositorio.

- La carpeta está en `.gitignore`, junto a `_privado-NoemiCelaya/`. Un
  `git add -A` ya no la sube.
- `scripts/servir.mjs` la incluye en `CARPETAS_PROHIBIDAS` y responde 403 (no
  404): la comprobación es por nombre, así que no depende de que los PDF existan
  en esa máquina. `scripts/recorrer.mjs` lo comprueba para el `.pdf` y para la
  carpeta.
- El script necesita Chrome; si no lo encuentra, avisa y termina sin generar. No
  forma parte de `npm run verificar` porque su salida no se publica.

Corrección de una cifra: el README anunciaba 82 comprobaciones de datos y son 88
(la tabla se quedó atrás en una revisión anterior). `npm test` es la fuente.

### 7.12 Estado de la primera publicación (2026-10-18)

Sesión de preparación del primer subida a GitHub. **Aquí se retoma.**

Hecho y verificado (`npm run verificar` en verde: 88 datos, 138 motores,
recorrido en navegador con los cuatro 403):

- **Repaso de Memory: las imágenes se ven.** El fallo era la conversión
  imagen→texto: `textoDe()` (`src/ui/vistas/repaso.js`) devolvía la ruta y el
  `alt` de las cartas de pictogramas era la ruta del fichero. Ahora
  `descripcionDe()` (`src/utils/generadores.js`) da un `alt` humano (el nombre
  del pictograma, nunca la ruta) y `cartaRepaso()` pinta un `<img>`. Regla
  nueva en §4.1. Afecta a las tres vistas que reutilizan el bloque de repaso
  (`resultado.js`, `repaso-pantalla.js`, `repaso.js`); las comprobaciones del
  recorrido en navegador lo fijan.
- **Los cuadernillos de respuestas no se publican** (§7.11): `.gitignore`,
  403 en `servir.mjs` y dos comprobaciones nuevas en `recorrer.mjs`.
- **`LICENSE`**: texto legal completo de CC BY-NC-SA 4.0 con una nota de
  alcance que excluye los nueve pictogramas SGA/CLP (no son obra de la autoría;
  §6.1). El README enlaza el fichero.
- **README**: cifra correcta (88), fila de `npm run generar:pdf`,
  `preguntas-y-respuestas/` en la estructura y errata «Decládalo» corregida.

- **Repositorio inicializado (2026-10-18).** `git init` + commit raíz
  `37af573` con 64 ficheros. Índice verificado: `_privado-NoemiCelaya/`,
  `preguntas-y-respuestas/` y `*.docx` no entran (`.gitignore` §6 y §7.11).
- **`revision-contenido.md` NO se publica**: se quitó del índice y va en
  `.gitignore` como material de trabajo (§6). Las referencias que hay a él en
  este documento valen para quien mantiene, que dispone del fichero en local.

Pendiente:

- Ninguno abierto en esta sesión. El push se hizo el 2026-10-18:
  https://github.com/Noemi0211/escena-segura (pública, rama `master`).
  `git status --porcelain` limpio; el material privado no está en el historial.

### 7.13 Memory en móvil y despliegue en Pages (2026-10-18)

El proyecto está publicado en GitHub Pages desde el mismo repo
(pestaña «Pages» de GitHub; no hay build, se sirve la raíz). Ajustes hechos
tras verlo en un móvil real:

- **Texto del anverso de Memory en móvil.** El fallo: el `clamp()` base del
  anverso (`0.58rem, 0.8vw, 0.72rem`) caía siempre al mínimo en móvil, porque
  `0.8vw` de una pantalla de teléfono son casi 3px: la letra salía de ~9px.
  Solución en `src/styles/juegos.css`: en `@media (max-width: 48rem)` el
  anverso fija `clamp(1rem, 3.6vw, 1.2rem)` y suben también `.carta-memory__tipo`
  y el texto del dorso; el clamp de escritorio sube a `0.7rem–0.875rem`.
  Regla práctica: **en móvil el tamaño de letra no se escala con `vw` de la
  pantalla**, se fija en el media query; `vw` solo sirve como techo.
- Aceptado por la autora tal cual («así se queda»). Si en el futuro se
  quisiera letra aún mayor: pasar a 3 columnas en móvil normal (hoy solo en
  `max-width: 24rem`), no seguir subiendo el `clamp`.
- `npm run verificar` en verde tras los cambios. Commits: `d7f6774` (fuente),
  `515c6f3` (revision-contenido.md fuera), `bea0076` (cierre de §7.12).
