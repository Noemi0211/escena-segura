# Escena Segura

Recurso interactivo para el Ciclo Formativo de **Emergencias Sanitarias (TES)**.
Ayuda a clasificar situaciones de emergencia, identificar riesgos e interpretar
los pictogramas de riesgo químico.

**Material para el aula de TES, creado por Noemí Celaya Mingot con licencia
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es).**

---

## Cómo se usa en clase

No hay que instalar nada. Solo hace falta un navegador moderno.

```bash
npm start
```

Y abre <http://localhost:8080>.

> **No abras `index.html` con doble clic.** La aplicación usa módulos nativos de
> JavaScript, y el navegador los bloquea en `file://` por seguridad. Hay que
> servirla por HTTP, y por eso existe `npm start`.

En Windows también está `start.bat`; en Linux y macOS, `start.sh`. Los dos hacen
lo mismo que `npm start`.

La aplicación está preparada para usarse sin conexión a internet: no pide nada a
servidores externos ni carga fuentes ni librerías de fuera.

---

## Qué contiene

Tres unidades, cada una con tres actividades:

| Unidad | Clasificación | Memory | Sprint | Escape Room |
|---|---|---|---|---|
| Clasificación de emergencias | 21 casos | 4 tableros | 5 plantillas | 1 escenario |
| Riesgos del trabajo | 12 casos | 4 tableros | 4 plantillas | 1 escenario |
| Pictogramas de riesgo químico | 9 casos | 3 tableros | 3 plantillas | 1 escenario |

Cada actividad enseña algo distinto y ninguna es una repetición:

- **Memory** empareja concepto y definición. Sirve para fijar vocabulario.
- **Sprint** es un cuestionario con tiempo. Sirve para decidir bajo presión.
- **Escape Room** encadena decisiones dentro de una situación. Sirve para
  aplicar lo aprendido a algo que se parece a la práctica real.

Toda respuesta incorrecta tiene realimentación en tres niveles: la idea, el
porqué y cómo aplicarlo fuera del aula. En Sprint la explicación aparece
**antes** de poder continuar: responder rápido sin entender no sirve en una
actividad sobre seguridad.

El progreso se guarda en el propio navegador (`localStorage`). No hay cuentas,
ni servidor, ni seguimiento. Se puede borrar desde la pantalla de progreso.

---

## Para quien mantiene el proyecto

La documentación de decisiones no está aquí: está en [`agents.md`](agents.md),
que es la memoria del proyecto. Léelo antes de tocar nada.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Sirve la aplicación en `http://localhost:8080`. |
| `npm run check` | Sintaxis de todos los módulos + importaciones resueltas. |
| `npm test` | 88 comprobaciones sobre los datos de las unidades. |
| `npm run test:motores` | 138 comprobaciones sobre los tres motores de juego. |
| `npm run test:navegador` | Recorre la aplicación en Chrome headless; se omite si falta Node 22 o Chrome. |
| `npm run generar:pdf` | Genera en `preguntas-y-respuestas/` los cuadernillos de respuestas. Material privado: no se versiona ni se sirve. |
| `npm run verificar` | Todo lo anterior. **Pásalo antes de dar algo por terminado.** |

### Estructura

```
index.html              Armazón y enlace de salto
src/
  config.js             Constantes: rutas, juegos, reglas, medallas
  app.js                Punto de entrada: enruta, compone y audita
  data/                 Contenido. Solo datos, ni una función
    index.js            Registro explícito de unidades
  games/                Motores de juego. Sin DOM
  ui/                   DOM y navegación. Sin lógica de juego
    juegos/             Una vista por formato de juego
    vistas/             Una vista por pantalla
  utils/                Utilidades transversales
  styles/               CSS plano
  assets/
    icons/              Iconos propios
    images/pictogramas/ Los 9 pictogramas normalizados (SGA/CLP)
scripts/                Comprobaciones en Node
_privado-NoemiCelaya/  Material de trabajo. NO se despliega (ver agents.md §6)
preguntas-y-respuestas/ Cuadernillos de corrección. NO se publican (§7.11)
```

### Las tres reglas que más se incumplen

1. **Los datos no ejecutan código.** Nada de funciones ni `if` en `src/data/`.
2. **Los motores no saben de qué va el tema.** No aparece "pictograma" ni
   "emergencia" en `src/games/`.
3. **Cero dependencias.** Ni una. Si hace falta algo, se escribe.

### Añadir una unidad nueva

1. Crea el fichero en `src/data/` exportando un objeto `default` (la forma está
   en `agents.md` §4.1).
2. Decláralo en el array `unidades` de `src/data/index.js`. Si no está ahí, no
   existe.
3. `npm test` hasta que salga limpio. La auditoría construye las actividades de
   verdad: si un `enlazadoPor` está mal, no hay ni cartas, y la auditoría lo dice.

### Añadir un juego nuevo

Los tres motores comparten contrato (`agents.md` §3.3). Para un cuarto formato:
un motor más, una entrada en `src/ui/juegos/indice.js`, y nada más. Ni `app.js`
ni las vistas cambian.

---

## Accesibilidad

Requisitos, no extras: navegación completa por teclado, enlace de salto al
contenido, textos alternativos en las imágenes informativas, `role="alert"` en
la realimentación y respeto por `prefers-reduced-motion`. El color nunca es el
único indicador: el cronómetro cambia de color **y** de cifra, y las opciones
marcadas llevan texto además del color.

## Licencia

Material para el aula de TES, creado por Noemí Celaya Mingot con licencia
CC BY-NC-SA 4.0. El texto legal completo está en [`LICENSE`](LICENSE).

Los pictogramas son símbolos oficiales del sistema armonizado europeo
(Reglamento CE 1272/2008) y se reutilizan tal cual. Ver `agents.md` §6.1.
