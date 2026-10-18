# Revisión de contenido — bloque 6

Documento de trabajo para la sesión conjunta de revisión de las tres unidades
(clasificación, riesgos y pictogramas). Recoge **todas** las observaciones
detectadas al leer los datos reales (`src/data/*.js`), los generadores
(`src/utils/generadores.js`) y la vista de unidad (`src/ui/vistas/unidad.js`).

**Regla vigente (§7.7, bloque 6):** no se toca `src/data/` hasta que cada punto
esté aprobado en esta sesión. Este documento no modifica nada: solo enumera.

## Cómo usar este documento

Para cada punto, marcar una de las tres columnas de decisión:

- **OK** → se queda como está.
- **Cambiar** → se aplica la propuesta indicada.
- **Debatir** → se decide en la sesión.

Al cerrar la sesión, volcar aquí las decisiones y actualizar `agents.md` §7.7
(bloque 6) con el resultado. Validación por bloque: `npm test`.

---

## A. Erratas y errores de redacción (texto que ve el alumnado)

Errores ortográficos o gramaticales que un lector detecta, pero que `npm test`
**no** caza porque su lista de erratas conocidas es cerrada (§4.3).

> **Estado: APLICADO y validado con `npm test` (88/88).** Las 17 erratas
> (A1–A17) están corregidas en `src/data/`.

### clasificacion.js

| # | Ubicación | Texto actual | Propuesta | Decisión |
|---|---|---|---|---|
| A1 | `c-siniestro-cn` (l.385) | «Hay tres vehículos **implicad**, uno de ellos ardiendo.» | «…vehículos **implicados**, uno de ellos ardiendo.» | |
| A2 | `c-ahogamiento` (l.418) | «…ha sido extraído del agua y **esta** inconsciente.» | «…y **está** inconsciente.» | |
| A3 | `c-caida-domicilio` (l.440) | «…no ha perdido el conocimiento y **no dolor de cabeza**.» | «…y **no tiene dolor de cabeza**.» | |
| A4 | Escape `f3o1` (l.789) | «…demuestra criterio profesional y reduce **laconflictividad**.» | «…reduce **la conflictividad**.» | |
| A5 | `c-vertido-cisterna` (l.306) | «El **trailer** ha cruzado la calzada.» | «El **tráiler** ha cruzado la calzada.» | |

### riesgos.js

| # | Ubicación | Texto actual | Propuesta | Decisión |
|---|---|---|---|---|
| A6 | `r-perdida-vision` (l.400) | «La persona está **palida y Mareada**.» | «La persona está **pálida y mareada**.» | |
| A7 | Escape `f2o1` (l.675) | «…la profilaxis posterior es obligatoria: **laven, retirada** de la ropa contaminada…» | «…debe hacerse el **lavado** y la **retirada** de la ropa contaminada…» | |
| A8 | `r-fuga-amoniaco` (l.422) | «El **conductor de la instalación** lleva diez minutos dentro y tose.» | «**El operario** lleva diez minutos dentro y tose.» (o «quien la revisaba»). «Conductor» no aplica a una cámara frigorífica. | |

### pictogramas.js

| # | Ubicación | Texto actual | Propuesta | Decisión |
|---|---|---|---|---|
| A9 | Catálogo `inflamable` (l.75) | «**Gasolina,-alcohol**, disolventes y barnices.» | «**Gasolina, alcohol**, disolventes y barnices.» | |
| A10 | Catálogo `corrosivo` (l.108) | «**Acido clorhídrico, Hidróxido** de sodio (sosa cáustica)…» | «**Ácido clorhídrico, hidróxido** de sodio (sosa cáustica)…» (falta tilde en «Ácido» y sobra mayúscula en «hidróxido»). | |
| A11 | Catálogo `toxicidad-aguda` (l.132) | «…**inmediata llamar** al 112 si hay exposición…» | «…**llamar de inmediato** al 112 si hay exposición…» | |
| A12 | Concepto `c-forma-rombo` (l.187) | «Un **bombo** o una cisterna a lo lejos: si se distingue el rombo…» | «Un **bidón** o una cisterna a lo lejos…» («bombo» es otra palabra). | |
| A13 | Concepto `c-leer-sin-etiqueta` (l.191) | «Si no hay etiqueta, **o la hay está dañada**» | «Si no hay etiqueta **o la que hay está dañada**». | |
| A14 | Escape f2, título (l.543) | «**El étiqute** que sí se lee» | «**La etiqueta** que sí se lee». | |
| A15 | Escape f2, texto (l.545) | «…con dos manos sobre una superficie corroída y **una superficie corroída en la parte inferior**.» | «…con dos manos **sobre una superficie y otra superficie corroídas**». (Repetición literal de «superficie corroída».) | |
| A16 | Escape f2o3 (l.578) | «**La vida** solo aparece en el pictograma de la silueta con estrella en el pecho.» | «**La silueta** solo aparece en el pictograma con estrella en el pecho.» | |
| A17 | Objetivos (l.671) | «**Deducer** la medida preventiva…» | «**Deducir** la medida preventiva…» | |

---

## B. Artefactos de edición e incoherencias internas

Restos de edición que cambian el sentido del texto.

> **Estado: APLICADO y validado con `npm test` (88/88).** Los 7 artefactos
> (B1–B7) están corregidos en `src/data/`.

| # | Ubicación | Observación | Propuesta | Decisión |
|---|---|---|---|---|
| B1 | `pictogramas` Escape, título (l.489) | «Almacén de limpieza,**_PRODUCTO** desconocido en el pasillo» | «Almacén de limpieza: **producto desconocido** en el pasillo». | |
| B2 | `p-medio-ambiente` (l.304) | «Fosa con un plaguicida diluido **sin Rudy protección** en un descampado» | «…**sin protección** en un descampado». «Rudy» es un resto de edición. | |
| B3 | `r-carga-pesada` (l.378) | «…una escalera estrecha y con **dos tramos de stretcher**.» | «…con **dos tramos de escalera**». «Stretcher» es inglés y, además, no tiene sentido en esta frase. | |
| B4 | `pictogramas` Escape (l.490–492) | El briefing dice «Un domingo por la **tarde**» y la ambientación fija «**09:20 h**». | Unificar: «por la **mañana**» o cambiar la hora a la tarde. | |
| B5 | `riesgos` comentario de datos (l.293) | «…para **révision** y para la siguiente unidad.» | «…para **revisión**…». (Es comentario de código, no texto de alumnado.) | |
| B6 | `riesgos` Escape f3, comentario (l.707–710) | El comentario dice «Con **dos** opciones, y a propósito», pero la fase tiene **4** opciones y `opcionesMinimas: 4`. | Actualizar el comentario (quedó obsoleto al cerrar el bloque 5). | |
| B7 | `pictogramas` Escape f3, comentario (l.590–593) | Mismo caso: dice «Con **dos** opciones» y hay **4**. | Actualizar el comentario. | |

---

## C. Decisiones pedagógicas pendientes (§7.3 y §7.6)

Ya señaladas en `agents.md`; aprobadas en la sesión de revisión.

> **Estado: APROBADO.** C1, C2, C3 y C4 se dan por buenas tal como están. Se
> anotó en `agents.md` §7.3, §7.6 y §7.7 (bloque 6) al cerrar la sesión.

| # | Punto | Situación | Decisión |
|---|---|---|---|
| C1 | Sprint `clasificacion/sprint-tipo` | 3 opciones de `origen` (1 correcta + 2). Justificado por la fuente (§7.6). | Aprobada |
| C2 | Sprint `riesgos/sprint-ambito` | 2 opciones de `ambito` (1 correcta + 1). Justificado por la fuente (§7.4). | Aprobada |
| C3 | Escape `esc-riesgos-almacen/f3` | Ampliada a 4 opciones con `opcionesMinimas: 4` (bloque 5). ¿Nivel y distractores adecuados? | Aprobada |
| C4 | Escape `esc-pictogramas-almacen/f3` | Ampliada a 4 opciones con `opcionesMinimas: 4` (bloque 5). ¿Nivel y distractores adecuados? | Aprobada |

---

## D. Clasificaciones y decisiones de contenido a revisar

Puntos en que la clasificación del caso puede discutirse aunque no haya error.

> **Estado: RESUELTO.** Aplicados **D1** (`c-electrico` → escenario
> `espacios-publicos`) y **D5** (`r-carga-pesada` → «persona con obesidad /
> quinto piso»). **D2, D3, D4, D7**: se mantienen. **D6**: se mantiene el `id`
> (`r-perdida-vision`) y queda como deuda documentada. **D8** queda resuelto al
> aplicar E7 (se quitaron `ambito`/`riesgos` de todos los casos de pictogramas).
> Validado con `npm test` (88/88).

| # | Caso | Observación | Decisión |
|---|---|---|---|
| D1 | `clasificacion/c-electrico` (l.325–334) | «Cable de alta tensión caído sobre la fachada de un edificio» se clasifica como escenario **laboral**, pero tiene «vecinos en las ventanas». ¿No encaja mejor en doméstico o espacio público? | Aplicado |
| D2 | `clasificacion/c-ahogamiento` (l.415–424) | Se clasifica como origen **antrópico** reconociendo que el agua es natural. La explicación lo justifica; conviene que la decisión sea explícita. | Mantener |
| D3 | `clasificacion/c-incendio-forestal` (l.426–435) | Se clasifica como **antrópico** por «la mayoría de los incendios forestales». La causalidad concreta no consta en el enunciado; podría discutirse. | Mantener |
| D4 | `clasificacion/c-incendio-domestico` (l.393) | Vela mal apagada → antrópico por negligencia. Coherente, pero es el único caso doméstico de fuego con causa explícita. | Mantener |
| D5 | `riesgos/r-carga-pesada` (l.375–384) | Enunciado «Traslado de una persona **obesa**…». Valorar si el término es el adecuado para el aula o conviene otro («persona con obesidad», «persona de peso elevado»). | Aplicado |
| D6 | `riesgos/r-perdida-vision` (id, l.397) | El **id** (`r-perdida-vision`) no corresponde al contenido (fractura abierta). Los ids no se renombran a la ligera (rompen progreso); decidir si se deja como está o se documenta la deuda. | Mantener id (deuda) |
| D7 | `riesgos/r-fuga-amoniaco` (l.411) | «El conductor de la instalación» (ver A8). Además, ¿el caso es de ámbito equipo o también víctima? | Mantener |
| D8 | `pictogramas/p-peligro-grave` (l.291–301) | Se le asigna `riesgos: [quimicos, biologicos]`. El benceno es químico; revisar por qué consta «biológicos». | Resuelto con E7 |

---

## E. Datos declarados que ningún juego ni vista usa

No es un error, pero conviene decidir si se mantiene (preparado para el futuro)
o se retira, porque un dato muerto aparenta estar en uso.

> **Estado: RESUELTO.** **E7 aplicado**: se han quitado `ambito` y `riesgos` de
> los nueve casos de pictogramas (incluida la contradicción `'ambiente'`).
> **E1–E6 y E8 se mantienen** como material de referencia sin uso, documentado
> aquí. Validado con `npm test` y `npm run check`.

| # | Catálogo / campo | Observación | Decisión |
|---|---|---|---|
| E1 | `riesgos.catalogos.via` y `viaQuimica` | Ninguna actividad los consume ni se muestran. `victima/biologicos.vias` apunta a ids de `via` y `quimicos.vias` a ids de `viaQuimica`, pero esas referencias no se auditan ni se pintan. `fisicos.vias` (`desplazamientos`, `intervencion`, `movilizacion`) no existe en ningún catálogo. | Mantener |
| E2 | `clasificacion.catalogos.escenario` | Campos `accesibilidad`, `riesgos`, `evacuacion`, `coordinacion` declarados y nunca mostrados (la vista solo pinta conceptos y casos; los juegos solo usan `nombre`). | Mantener |
| E3 | `clasificacion.catalogos.gravedad` | Campo `consecuencia` sin uso. | Mantener |
| E4 | `clasificacion.catalogos.origen` | Campos `definicion`, `ejemplo`, `implicacion` sin uso (solo se usan `nombre` y `medida`). | Mantener |
| E5 | `riesgos` catálogo `victima`/`equipo` | Campos `factores` y `vias` sin uso (solo `nombre`, `definicion`, `ejemplo`, `clave`). | Mantener |
| E6 | `origen`, `gravedad` y `ambito`: campo `icono` | Sin uso: los juegos toman los iconos de `src/config.js`/`iconos.js`. | Mantener |
| E7 | `pictogramas` casos: campos `ambito` y `riesgos` | La unidad de pictogramas no tiene catálogos `ambito` ni `riesgo`, así que estos campos son referencias muertas. En particular `p-medio-ambiente` (l.309) tiene `ambito: 'ambiente'`, un **tercer ámbito** que contradice la doctrina de §7.4 (solo víctimas y equipo). | Aplicado |
| E8 | `clasificacion.c-evaluacion-dinamica` y `riesgos.c-evaluacion-dinamica` | Concepto duplicado en dos unidades, con redacción distinta. Decidir si es intencionado. | Mantener (referencia) |

---

## F. Observaciones menores de formato

| # | Ubicación | Observación | Decisión |
|---|---|---|---|
| F1 | `clasificacion.js:427` | `etiqueta:` con 6 espacios de sangría (el resto usa 4), en `c-incendio-forestal`. | Aplicado |
| F2 | `riesgos.js:334` | `contexto:` con 8 espacios de sangría en `r-derrumbe-amianto`. | Aplicado |
| F3 | `riesgos.js:680` | `texto:` con sangría descuadrada en el Escape `f2o2`. | Aplicado |
| F4 | `pictogramas.js:50–52` | Bloque de comentario con una línea `*` sin alinear. | Aplicado |

> **Estado: APLICADO.** Las cuatro correcciones de formato están hechas.

---

## Cierre de la sesión

Guion seguido: A y B se aprobaron en bloque (correcciones objetivas); C se cerró
en las cuatro decisiones pedagógicas; D se revisó caso a caso; E y F se
decidieron al final.

- **Aplicado en `src/data/`:** A1-A17, B1-B7, D1, D5, E7 y F1-F4.
- **Aprobado sin cambios:** C1-C4.
- **Mantenido a propósito:** D2, D3, D4, D6, D7 y E1-E6, E8.
- **Deuda conocida:** el `id` de `r-perdida-vision` no describe su contenido; no
  se renombra porque los ids son la clave de progreso.
- **Registro en `agents.md`:** §7.3, §7.6 y §7.7 (bloque 6).
- **Validación:** `npm run verificar` — 38 ficheros, 88 comprobaciones de datos,
  138 de motores y el recorrido en navegador, todo correcto.
