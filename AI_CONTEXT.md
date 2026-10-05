# Infrafolio — Contexto técnico para IA

> Documento de referencia generado a partir del código. Describe **qué es el sitio, cómo
> está construido, cómo está armada cada sección y qué reglas/convenciones hay que respetar**
> al modificarlo.
>
> Última revisión: commit `5814d45` (rama `main`, árbol limpio).

---

## Índice

1. [Resumen en una línea](#1-resumen-en-una-línea)
2. [Stack y restricciones](#2-stack-y-restricciones)
3. [Estructura de archivos](#3-estructura-de-archivos)
4. [Ejecución y despliegue](#4-ejecución-y-despliegue)
5. [Sistema de diseño (tokens)](#5-sistema-de-diseño-tokens)
6. [Anatomía de la página, sección por sección](#6-anatomía-de-la-página-sección-por-sección)
7. [Arquitectura CSS](#7-arquitectura-css)
8. [Comportamientos de JavaScript](#8-comportamientos-de-javascript)
9. [Accesibilidad](#9-accesibilidad)
10. [Rendimiento](#10-rendimiento)
11. [Responsive](#11-responsive)
12. [Datos de contenido](#12-datos-de-contenido)
13. [Convenciones y trampas conocidas](#13-convenciones-y-trampas-conocidas)
14. [Recetas: cómo hacer cambios comunes](#14-recetas-cómo-hacer-cambios-comunes)
15. [Observaciones / riesgos detectados](#15-observaciones--riesgos-detectados)

---

## 1. Resumen en una línea

Portafolio personal de **una sola página** para *Leyver Aarón González Mendoza* (Cloud
Engineer / DevOps). Sitio estático sin framework y sin paso de build: HTML5 semántico + CSS3
con custom properties + JavaScript nativo. La única librería es **GSAP 3.13 + ScrollTrigger**,
vendorizada en `public/vendor/`. Se sirve con un servidor estático mínimo de `node:http`.

**Idioma de la UI:** español (es-IM / es-MX). Todos los textos visibles están en español.

**Identidad visual:** "sistema operativo / terminal". Fondo casi negro, tipografía monoespaciada,
acento *acid green* (`#c8ff3d`), retícula técnica, números de sección, labels con formato de
comando de shell (`> whoami`, `> stack --overview`).

---

## 2. Stack y restricciones

| Capa | Tecnología | Notas |
| --- | --- | --- |
| Marcado | HTML5 semántico | Un solo documento: `public/index.html` (268 líneas) |
| Estilos | CSS3 | Custom properties, Grid, `clamp()`, sin preprocesador (28 KB / 178 líneas, formato compacto de una regla por línea) |
| Interactividad | JS nativo + GSAP 3.13.0 / ScrollTrigger | Vendorizado, no se instala con npm |
| Servidor | Node.js ≥ 20, `node:http` + `node:fs` | Solo para desarrollo local |
| Dependencias npm | **Ninguna** | `package.json` no tiene `dependencies` ni `devDependencies` |
| Deploy | GitHub Actions → GitHub Pages | Sube `public/` tal cual |
| Licencia | MIT © 2026 | |

**Restricciones duras del proyecto:**

- **No introducir framework ni bundler.** No hay `node_modules` en el flujo del sitio.
- **No hay build.** `public/` *es* el producto final. El script `npm run build` solo imprime
  un mensaje de confirmación.
- **No agregar dependencias npm.** Si se necesita una librería, se vendoriza en `public/vendor/`
  y se carga con `<script defer>`.
- **Node ≥ 20** por `engines` (usa `node:` prefix imports y ESM con `"type": "module"`).

---

## 3. Estructura de archivos

```
infrafolio/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Deploy a GitHub Pages en cada push a main
├── public/                   # Raíz servida (site root)
│   ├── index.html            # Documento único: todas las secciones
│   ├── styles.css            # Sistema visual completo (incluye tokens)
│   ├── app.js                # Terminal, reveal, rail nav, placeholders, GSAP
│   ├── favicon.svg           # Monograma [L/A] dibujado en trazo ácido
│   ├── og-image.jpg          # Preview 1200×630 para redes sociales
│   ├── img/projects/         # 3 capturas WebP + README de formatos
│   └── vendor/
│       ├── gsap.min.js       # GSAP 3.13.0
│       └── ScrollTrigger.min.js
├── scripts/
│   └── check.mjs             # Verificación sin dependencias (`npm test`)
├── server.js                 # Servidor estático de desarrollo
├── package.json
├── LICENSE                   # MIT
├── README.md                 # Documentación de proyecto (ya existe; este archivo la complementa)
└── AI_CONTEXT.md             # Este documento
```

Tamaños relevantes: `styles.css` 28 KB · `index.html` 23 KB · `app.js` 6 KB ·
GSAP 70 KB · ScrollTrigger 43 KB · las 3 capturas WebP suman **45 KB**.
**Peso completo de `public/`: ~265 KB.**

---

## 4. Ejecución y despliegue

### Local

```bash
npm start          # o npm run dev -> node server.js
# http://localhost:3000
```

Puerto configurable: `PORT=8080 npm start` (POSIX) o `$env:PORT=8080; npm start` (PowerShell).

`server.js` (43 líneas) hace exactamente tres cosas:

1. Mapea MIME types por extensión (fallback `application/octet-stream`).
2. `/` → `/index.html`.
3. **Anti path traversal:** `normalize()` + quitar barras iniciales + validar que
   `filePath.startsWith(root)`; si no, `404 Not found`.

Envía `Cache-Control: no-cache` (relevante solo en local, GitHub Pages no lo usa).

### Verificación

```bash
npm test      # node scripts/check.mjs
```

Sin dependencias. Comprueba lo que en este proyecto se rompe **en silencio**:

1. Cada referencia local `href`/`src` apunta a un archivo que existe.
2. **Ninguna ruta local es absoluta con `/`** — en GitHub Pages el sitio vive bajo un
   subpath y `/styles.css` resolvería a la raíz del dominio. Este fue un fallo real:
   producción cargaba sin CSS ni JS.
3. Cada ancla `#id`, `aria-labelledby` y `aria-describedby` tiene un `id` destino.
4. No hay `id` duplicados.
5. Toda custom property usada en CSS o HTML está declarada (incluye las inline
   `--progress`, que viven en los `style` de las barras).

Imprime además el peso total de `public/`. Está cableado como job `verify` previo al
deploy en `.github/workflows/deploy.yml`, así que un fallo bloquea la publicación.

### Deploy

`.github/workflows/deploy.yml`: trigger en `push` a `main` y `workflow_dispatch`.
Dos jobs: `verify` (corre `scripts/check.mjs`) y `deploy` (`needs: verify`).

- `permissions: contents:read, pages:write, id-token:write`
- `concurrency: { group: pages, cancel-in-progress: true }`
- Job `deploy` en `ubuntu-latest`, environment `github-pages`:
  `actions/checkout@v4` → `actions/configure-pages@v5` →
  `actions/upload-pages-artifact@v3` (path: `public`) → `actions/deploy-pages@v4`.

Requisito de configuración manual (una sola vez en el repo):
**Settings → Pages → Build and deployment → Source → GitHub Actions**.
URL esperada: `https://leyveraaa.github.io/Leyver_Aaron_Profile-/`.

---

## 5. Sistema de diseño (tokens)

Todos los tokens viven en `:root` (`public/styles.css`, líneas 1–23). **No hay stylesheets
parciales**: todo el sistema visual está en un único archivo.

### Color

| Token | Valor | Uso |
| --- | --- | --- |
| `--ink` | `#0b0d0c` | Fondo global |
| `--ink-soft` | `#131715` | Fondo de frame de imagen, footer |
| `--paper` | `#e9ece5` | Texto principal, fondo de secciones inversas (Stack, Contacto) |
| `--paper-dim` | `#b7bcb3` | Texto secundario |
| `--acid` | `#c8ff3d` | Acento: números, `<em>` en `h1/h2`, iconos, degradados |
| `--amber` | `#ffb44b` | Estrellas de logros, punto medio de la barra de terminal |
| `--line` | `rgba(233,236,229,.17)` | Bordes hairline, base de todo el sistema |
| `--muted` | `#7e877e` | Texto terciario, watermarks |

> `--blue` se eliminó: estaba declarado y no lo usaba ninguna regla.

En secciones de fondo claro se **hardcodean** los equivalentes oscuros (`#486c00`,
`#5c8700`, `#527900`, `#a6aea3`, `#596058`…) en lugar de definir tokens semánticos.
Si agregas una sección invertida, replica ese criterio: no introduzcas un cuarto sistema.

### Tipografía

- `--sans`: **Space Grotesk** (400/500/600/700) — titulares y UI.
- `--mono`: **IBM Plex Mono** (400/500/600) con fallbacks de sistema — etiquetas, terminal, datos.
- Cargadas desde Google Fonts con `preconnect` a `fonts.googleapis.com` y `fonts.gstatic.com`.
- Escala fluida con `clamp()`: `h1` `clamp(45px, 6.35vw, 104px)`, `h2` de sección
  `clamp(36px, 4.7vw, 74px)`, `h2` de contacto `clamp(43px, 7vw, 110px)`.
- `letter-spacing` negativo aggressive en titulares (`-.075em` a `-.04em`).
- **Piso tipográfico:** nada por debajo de `--fs-micro: 10px`. Ese token existe para
  centralizar la regla.

### Espaciado y layout

| Token | Valor | Papel |
| --- | --- | --- |
| `--rail` | `84px` (→ `0px` en móvil) | Ancho del riel lateral fijo |
| `--topbar-h` | `84px` (→ `64px` en móvil) | Alto del topbar sticky; alimenta `scroll-margin-top` |
| `--gutter` | `clamp(22px, 8vw, 150px)` | Margen derecho de las secciones |
| `--gutter-num` | `clamp(22px, 3.2vw, 48px)` | Padding del número de sección |
| `--section-y` | `clamp(82px, 11vw, 160px)` | Padding vertical de secciones |

### Capa decorativa global

`body::before`: retícula fija de 6×6 px en dos gradientes, `opacity: .18`,
`mix-blend-mode: soft-light`, `z-index: 10`, `pointer-events: none`.
Da la textura " blueprint/grid técnico" a todo el sitio. **No la toques sin revisar
el stacking context**: vive por encima del rail (`z-index: 30`) y del topbar (`z-index: 20`).

---

## 6. Anatomía de la página, sección por sección

Estructura del body:

```
a.skip-link
div.page-shell
├── aside.archive-rail      (fijo, 84px, desktop only)
│   ├── a.rail-mark         monograma [L/A] + punto pulsante
│   ├── span.rail-index     "INFRA / 01" (vertical)
│   ├── nav.rail-nav        6 anclas verticales
│   └── span.rail-note      "MX / 2026" (vertical)
└── div.site-content#top    (margin-left: 84px)
    ├── header.topbar       sticky
    ├── main#contenido
    │   ├── section.hero
    │   ├── section.signal-strip
    │   ├── section#whoami          (01 PROFILE)
    │   ├── section#stack           (02 STACK)
    │   ├── section#projects        (03 PROYECTOS)
    │   ├── section#philosophy      (04 LOOP)
    │   ├── section.two-up-section  (Logros + Intereses, sin número)
    │   ├── section#learning        (05 APRENDIZAJE)
    │   └── section#contact         (06 CONTACTO)
    └── footer.site-footer
```

Script inline en `<head>` (antes del CSS): `document.documentElement.classList.add("js-enabled")`.
Es la base del *progressive enhancement* para las animaciones de entrada.

Scripts al final del body, en orden, todos con `defer`:
`vendor/gsap.min.js` → `vendor/ScrollTrigger.min.js` → `app.js`.

### 6.0 Riel lateral — `.archive-rail`

Barra vertical fija a la izquierda, `width: var(--rail)`, fondo `rgba(11,13,12,.88)` con
`backdrop-filter: blur(10px)`. Todo el texto va en `writing-mode: vertical-rl` +
`transform: rotate(180deg)` (se lee de abajo hacia arriba).

- `.rail-mark` — home `#top`, muestra `[L/A]` con un `<i>` de 5px que hace de punto luminoso.
- `.rail-index` — "INFRA / 01".
- `.rail-nav` — índice con 6 entradas, cada una `<a href="#id"><span>NN</span>Texto</a>`:
  `01 Perfil · 02 Stack · 03 Obras · 04 Loop · 05 En curso · 06 Contacto`.
  El `<span>` con el número es `var(--acid)`.
- `.rail-note` — "MX / 2026".

**Invariante importante:** si agregas una sección con `id`, agrega su ancla aquí; el
`IntersectionObserver` de `app.js` deriva el estado activo de estos enlaces
(`rootMargin: "-35% 0px -55% 0px"`), así que un enlace sin sección correspondente
simplemente nunca se activará.

### 6.1 Topbar — `.topbar`

`height: 84px`, `position: sticky`, `top: 0`, `z-index: 20`, fondo translúcido con blur.

- `.wordmark` → `#top`, contiene `<img src="favicon.svg">` + "Leyver / **Aaron**".
- `.topbar-status` → punto `.pulse` animado + "Open To Work".
- `.topbar-cta` → `#contact`, botón ácido "Contacto ↗", en hover `translateY(-2px)` y
  `#dbff7d`.

### 6.2 Hero — `section.hero` (nº 00 · BOOT)

`min-height: calc(100vh - 84px)`, grid de 2 o 3 columnas (ver §11), `overflow: hidden`.

- `.hero-number` → "00 / BOOT".
- `.hero-copy`
  - `.eyebrow` con `.eyebrow-dot` (cuadrado de 8px ácido) + "Cloud Engineer / DevOps".
  - `<h1>`: "Leyver Aaron" / `<em>Jr.DevOps/Cloud</em>`.
  - `.hero-lede`: "Diseño sistemas cloud que convierten operaciones manuales en
    infraestructura **reproducible, observable y escalable.**"
  - `.hero-actions`: `.button.button-solid` → `#projects` ("Ver Proyectos ↓") y
    `.text-link` → `mailto:gonzalezleyver6@gmail.com`.
- `.terminal-wrap` (a la derecha, `width: min(100%, 610px)`, `justify-self: end`)
  - `.orbital-stamp` — aro decorativo de 96px, `animation: rotate 20s linear infinite`,
    con `box-shadow: 0 0 0 6px var(--ink)` para "taladrar" la terminal.
  - `.terminal-window` — caja `#121613`, borde `rgba(200,255,61,.45)`,
    `box-shadow: 15px 15px 0 rgba(200,255,61,.12)` (offset duro, sin blur) y un
    gradiente diagonal interno.
    - `.terminal-bar`: 3 puntos (rojo `#ff6a5d` / ámbar / ácido), `ops@leyver: ~`, `● LIVE`.
    - `.terminal-body`:
      - `.terminal-prefix`: `root@infra:~$` + `#typed-command` + `.cursor` (parpadeo `blink 1s`).
      - `#terminal-response`: línea de respuesta en `var(--muted)`, `min-height: 1.1em`
        (evita salto de layout al cambiar texto).
      - `.terminal-meter`: grid `auto 1fr auto` con barra de "UPTIME 99.9%" hecha con
        `linear-gradient(90deg, var(--acid) 99.9%, transparent 99.9%)` + `background-size: 8px 100%`
        (efecto segmentado).
  - `.terminal-caption` — "Sistema operativo / arquitectura de infraestructura".

> El bloque `.terminal-commands.visually-hidden` que duplicaba los 4 comandos **se eliminó**:
> era invisible (`visually-hidden` + `aria-hidden`) y ningún código lo leía, así que solo
> creaba una trampa de desincronización con `app.js`.
- `.hero::after` — palabra gigante "INFRASTRUCTURE" con `-webkit-text-stroke` y
  `color: transparent`, anclada abajo a la derecha, `pointer-events: none`. Es el watermark.

### 6.3 Tira de estado — `.signal-strip`

Fila de 4 datos + grupo de enlaces, con bordes hairline y `overflow: hidden`.

| Item | Etiqueta | Valor |
| --- | --- | --- |
| 1 | CLOUD | `AWS / GCP` |
| 2 | DEVOPS | AUTOMATION |
| 3 | LINUX | ADMINISTRATION |
| 4 | STATUS | ● OPEN TO WORK (con `.pulse`) |

`.signal-links`: 3 enlaces con SVG inline de 24×24 (`fill: currentColor`) →
LinkedIn ↗, GitHub ↗, Email ↗ (los externos con `target="_blank" rel="noopener noreferrer"`).
`min-width: min(22vw, 240px)` por item; `white-space: nowrap` en los enlaces.

### 6.4 Perfil — `section#whoami` (01 · PROFILE)

`.section-grid` + `.reveal`. `.command-label`: `> whoami`.

- `<h2>`: "Ingeniero TI" / `<em>Operador de sistemas</em>`.
- `.bio-layout` (2 columnas `1.1fr / .9fr`, gap `clamp(40px, 8vw, 140px)`)
  - `.bio-copy`: `.large-copy` (`clamp(19px,1.7vw,26px)`) + párrafo de apoyo.
    Los `<strong>` dentro son `var(--acid)`.
  - `ul.credentials` — 3 filas numeradas con borde superior/inferior:
    `01 Linux para servidor / Scripts bash`,
    `02 Representante nacional / Huawei Academy Cloud`,
    `03 Cloud híbrida / AWS + GCP`.

### 6.5 Stack — `section#stack` (02 · STACK) — **sección invertida**

Fondo `var(--paper)`, texto `var(--ink)`. `.command-label`: `> stack --overview`.

- `.stack-heading-row`: título + `.section-aside` ("Herramientas que convierten intención
  en operación.", alineado a la derecha).
- `.stack-lines` — 6 `.stack-line` en grid `190px 1fr 24px`, separados por bordes:

| # | ID | Tecnologías |
| --- | --- | --- |
| 01 | CLOUD & INFRA | AWS · GCP · Terraform |
| 02 | CONTAINERS | Docker · Kubernetes |
| 03 | CI/CD & GIT | GitHub Actions · GitHub |
| 04 | OBSERVABILITY | Prometheus · Grafana |
| 05 | LANGUAGES | Python · Bash · Java |
| 06 | DATA | MySQL · Firebase · Postgres |

Hover: `padding-left: 12px` + color `#5d8d00`. El separador `·` es un `<i>` en `#74846e`.

### 6.6 Proyectos — `section#projects` (03 · PROYECTOS) — la más compleja

`.command-label`: `> projects --featured`. Cabecera con `.project-count` = "03 ARCHIVOS".

`.project-card` en desktop: grid de **5 columnas**:
`70px | minmax(170px,.82fr) | minmax(190px,235px) | minmax(215px,1.05fr) | 118px`
→ número · intro · **media** · detalle · link.

Cada tarjeta contiene:

1. `.project-number` — "01"/"02"/"03" en ácido.
2. `.project-intro` — `.project-type` (categoría) + `<h3>` con `<br>` manual.
3. `figure.project-media`
   - `.media-fallback` — **placeholder CSS** con el número grande y la tecnología;
     se muestra mientras la imagen no carga (o si nunca carga).
   - `img` — `src` en **WebP** (`img/projects/*.webp`), `width/height` declarados como
     480×300 para reservar el espacio, `loading="lazy"`, `decoding="async"`,
     `position: absolute; inset: -7% 0` (sobresale a propósito para que el parallax ±4%
     de GSAP no descubra bordes), `opacity: 0` → `.is-loaded img { opacity: 1 }`.
   - `::after` — esquina técnica de 26px con `linear-gradient(225deg, ...)`.
4. `.project-detail` — descripción + `.focus` (`ENFOQUE` / `PRINCIPIO`) + `.tech-tags`.
5. `a.project-link` — "REPOSITORIO ↗" → GitHub, `aria-label` en cada uno.

**Los 3 proyectos:**

| # | Nombre | Tipo | Tech tags | Repositorio |
| --- | --- | --- | --- | --- |
| 01 | DevOps-Toolkit | OPERATIONS / LINUX | LINUX, BASH, DEVOPS | `github.com/leyverAAA/DevOps-Toolkit` |
| 02 | Monitoring & Observability | METRICS / INSIGHT | PROMETHEUS, GRAFANA | `github.com/leyverAAA/health-monitor` |
| 03 | Infrastructure Automation | CLOUD / REPEATABILITY | TERRAFORM, AWS, GCP | `github.com/leyverAAA/Infraestructura-modular` |

**Detalles de comportamiento de la tarjeta:**

- `.project-card::before` — fondo de hover `rgba(200,255,61,.04)` con `inset: 0 -20px`;
  los hijos van en `z-index: 1`.
- El hover **no** mueve el padding (habría redimensionado la imagen y saltado el layout).
- El hover de la imagen usa **`filter`**, nunca `transform`, porque GSAP escribe `transform`
  para el parallax y ambos se pisarían.

### 6.7 Filosofía — `section#philosophy` (04 · LOOP) — fondo `#111511`

`.command-label`: `> philosophy`, y `// LOOP 01` a la derecha.

- `<h2>` a una línea de frase: "La automatización no consiste únicamente en reducir
  comandos manuales." (`max-width: 850px`, `clamp(31px,4vw,64px)`).
- `.philosophy-foot` — grid `1.55fr / .85fr`:
  - `.process-flow`: `REPETIDOS → MEDIDOS → ENTENDIDOS → MEJORADOS` en mono 600.
  - `.philosophy-note`: "Se trata de construir sistemas donde los procesos puedan ser
    documentados, repetidos y operados con claridad."

### 6.8 Dos paneles — `.two-up-section` (Logros + Intereses)

Grid 2 columnas a ancho completo del contenido (dentro de `main`, sin `id`, sin número de
sección, no aparece en el rail).

- `.achievement-panel` (borde derecho hairline)
  - `> achievements` + `<h2>` "PRUEBAS / **DE RUTA**".
  - 2 filas: `01 Huawei Academy — 2.º Lugar Nacional ★` (estrella ámbar),
    `02 Huawei Academy Cloud Competition — Representante nacional ★`.
- `.interests-panel` — **fondo `var(--acid)`, texto `var(--ink)`**. Invierte el panel.
  - `> interests` + `<h2>` "RADAR DE **EXPLORACIÓN**".
  - `.interest-cloud`: chips con borde; los `li` de índice par giran `-2deg`, los múltiplos
    de 3 invierten a `background: var(--ink); color: var(--acid)`.
    Chips: Cloud Computing, DevOps, Cybersecurity, AI & ML, Game Development, Open Source.

### 6.9 Aprendizaje — `section#learning` (05 · APRENDIZAJE)

`.command-label`: `> currently_learning`. `<h2>` en mayúsculas: "LA PRÓXIMA / **ITERACIÓN**".

`.learning-inner` grid `.84fr / 1.16fr` con gap `clamp(55px, 11vw, 190px)`.

`.learning-bars` — 5 barras. El progreso se pasa por variable CSS inline
`style="--progress: X%"`; la barra se pinta con
`linear-gradient(90deg, var(--acid) var(--progress), transparent var(--progress))` y un
`::after` con `repeating-linear-gradient` que dibuja las divisiones cada 10%.

| Área | Nivel | `--progress` |
| --- | --- | --- |
| Cloud Engineering | 10 / 10 | 100% |
| DevOps | 09 / 10 | 90% |
| Linux & Automation | 09 / 10 | 90% |
| Kubernetes | 07 / 10 | 70% |
| Observability | 06 / 10 | 60% |

### 6.10 Contacto — `section#contact` (06 · CONTACTO) — **sección invertida**

Fondo `var(--paper)`, texto `var(--ink)`. `.command-label`: `> contact --open`.
A la derecha: `<i class="pulse">` (verde `#659a00`) + "DISPONIBLE PARA COLABORAR".

- `<h2>` gigante: "¿Construimos / **algo confiable?**"
- Párrafo: "Estoy abierto a oportunidades, proyectos y colaboraciones relacionadas con
  **Cloud Engineering · DevOps · Infrastructure · Automation**."
- `.contact-links` — 3 filas en grid `42px 120px minmax(0,1fr) auto`:
  EMAIL `gonzalezleyver6@gmail.com` · LINKEDIN `/in/leyver-aaron-gonzalez-mendoza` ·
  GITHUB `/leyverAAA`. Cada una con logo SVG en `.contact-logo` (42×42, borde hairline) y
  flecha `↗` que se desplaza `(2px, -2px)` en hover.

### 6.11 Footer — `.site-footer`

- `.footer-mantra`: `BUILD • AUTOMATE • OBSERVE • SCALE` en mono 600,
  `clamp(18px, 3vw, 40px)`, separadores `•` en `--muted`.
- `.footer-quote`: "La tecnología puede automatizar procesos; la curiosidad y la disciplina
  impulsan la evolución."
- Fila final: `© 2026 LEYVER AARÓN GONZÁLEZ MENDOZA` / `DESIGNED AS A SYSTEM · BUILT FOR
  PEOPLE`, con `margin-top: 76px` y borde superior.

---

## 7. Arquitectura CSS

**Archivo único: `public/styles.css`.** Orden interno de arriba hacia abajo:

1. `:root` (tokens) → 2. reset/utilidades → 3. rail + topbar → 4. hero + terminal →
5. signal strip → 6. secciones de contenido → 7. projects → 8. philosophy →
9. two-up → 10. learning → 11. contact + footer → 12. animaciones y media queries.

### Patrones recurrentes

- **`.section-grid`** — el esqueleto de casi toda sección:
  `grid-template-columns: minmax(72px, 12%) 1fr`. La 1ª columna aloja el `.section-number`
  (número + palabra, `padding-left: var(--gutter-num)`), la 2ª el contenido real.
- **Secciones invertidas** — `.stack-section` y `.contact-section`: `background: var(--paper)`,
  `color: var(--ink)`, y los acentos se redefinen localmente (`#486c00`, `#618c00`...).
- **Filas tipo "archivo"** — `.stack-line`, `.project-card`, `.achievement-list li`,
  `.credentials li`, `.contact-links a`, `.learning-bar`: lista densa con
  `border-top`/`border-bottom: 1px solid var(--line)` y padding vertical. **Este es el
  motivo visual dominante del sitio.**
- **Texto de comando** — `.command-label` (`> algo`) siempre mono 500 11px, mayúsculas,
  `letter-spacing: .06em`, en ácido (o `#486c00` / `#527900` sobre claro).
- **Botones** — sin `border-radius` en ningún sitio; el lenguaje es square + sombra offset
  dura (`.button-solid:hover` → `translate(3px,-3px)` + `box-shadow: -3px 3px 0`).
- **Transiciones** — `.2s ease` para color/borde, `.25s ease` para padding/fondos,
  `.45s–.7s` para opacity/transform. No hay una variable para esto.

### Sobre el formato del archivo

Muchas reglas comparten una sola línea (p. ej. las 6 reglas de `.learning-bar` en la línea
141). Está hacerlo **a propósito**: el archivo es una fuente de tokens compacta y legible.
Al agregar reglas, mantén el estilo local (agrupa selectores relacionados, no reformatees).

---

## 8. Comportamientos de JavaScript

Archivo único: `public/app.js` (179 líneas). Sin módulos, sin framework, ejecutado con `defer`.
**Toda la lógica arranca al cargar**; no hay `DOMContentLoaded` (no hace falta con `defer`).
No hay manejo de errores ni `try/catch`: las funciones cortan con `if (!el) return;` cuando aplica.

### 8.1 Terminal escribible — `terminalMessages` + `typeTerminal()`

Arreglo de 4 pares `{ command, response }` (§6.2). Máquina de estados con dos contadores
globales: `messageIndex` y `characterIndex`, más un flag `deleting`.

- Escritura: 40 ms por carácter; al completar, se fija `responseElement.textContent`,
  `deleting = true`, pausa 2400 ms.
- Borrado: 24 ms por carácter; en `characterIndex === 0`, avanza `messageIndex` módulo 4.
- Arranque en escritorio: vacía el comando y arranca a los 700 ms.

Detalle de layout: `#typed-command` es `display: inline` (no `block`) para que el prompt
`root@infra:~$` y el comando fluyan en la misma línea; `#terminal-response` tiene
`min-height` para que la línea no salte.

### 8.2 Terminal compacta — `rotateCompactTerminal()`

Si `matchMedia("(max-width: 740px)")`, no hay escritura carácter a carácter: cada 4200 ms
se cambia el mensaje completo con un fundido de 180 ms (clase `.is-switching` →
`opacity: 0; translateY(4px)`).

### 8.3 Reveal en scroll — `IntersectionObserver`

- Targets: `document.querySelectorAll(".reveal")`.
- Solo si hay soporte de `IntersectionObserver` **y** no hay `prefers-reduced-motion`.
- `threshold: 0.12`; al entrar: añade `.is-visible` y **`unobserve`** (una sola vez).
- Fallback (o movimiento reducido): todas las secciones reciben `.is-visible` de inmediato.

La animación en sí es CSS: `.js-enabled .reveal { opacity: 0; translateY(22px) }` →
`.is-visible { opacity: 1; translateY(0) }`, 0.7 s. **La clase `.js-enabled` en `<html>`
es lo que evita contenido invisible sin JS.**

### 8.4 Estado activo del rail — segundo `IntersectionObserver`

Deriva la lista de secciones desde los propios `href` del rail (`link.getAttribute("href")`).
Con `rootMargin: "-35% 0px -55% 0px"` y `threshold: 0`, marca activo el enlace cuyo
`#id` coincide con la sección en la franja central de la ventana, escribiendo
`link.style.color = "var(--paper)"` (o `""` para el resto). Se usa estilo inline en vez de
una clase para no tocar el CSS.

### 8.5 Placeholder de imagen — `is-loaded`

```js
document.querySelectorAll(".project-media img").forEach((image) => {
  const figure = image.closest(".project-media");
  if (image.complete && image.naturalWidth > 0) { figure.classList.add("is-loaded"); return; }
  image.addEventListener("load", () => figure.classList.add("is-loaded"), { once: true });
});
```

El `<img>` arranca en `opacity: 0`, así que mientras no haya `is-loaded` se ve
`.media-fallback`. Si el archivo no existe nunca se dispara `load` → el placeholder queda
para siempre. **Nunca veas una imagen rota.** No hay listener de `error` a propósito.

### 8.6 GSAP + ScrollTrigger — `initProjectsMotion()`

Guardas: `if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;`

1. `gsap.registerPlugin(ScrollTrigger)`.
2. **Un solo reveal** para toda la sección de proyectos: encabezado + tarjetas en un
   `gsap.from({ opacity: 0, y: 16, duration: .45, ease: "power1.out", stagger: .07 })`
   con `scrollTrigger: { trigger: header, start: "top 85%" }`.
   El comentario del código es explícito: se unificó para no animar más de 1–2 elementos
   por vista.
3. **Parallax** por imagen: `gsap.fromTo(image, { yPercent: -4 }, { yPercent: 4, ease: "none",
   scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } })`.

`app.js` termina con la llamada `initProjectsMotion();`.

---

## 9. Accesibilidad

- `a.skip-link` → `#contenido`, oculto con `left: -999px`, visible en `:focus`.
- Landmarks: `header`, `nav` (×2), `main#contenido`, `footer`, más `aside.archive-rail`.
- Jerarquía de encabezados: un solo `h1`; cada sección con `aria-labelledby` apuntando a su `h2`;
  los paneles de la two-up usan `h2` dentro de `<article>`.
- `aria-label` en navegación, secciones, terminal, listas de credenciales, barras de
  aprendizaje, flujo de proceso, lista de intereses.
- Iconos SVG: `aria-hidden="true"` + `focusable="false"`.
- `.visually-hidden` para la lista de comandos de la terminal.
- Enlaces externos con `target="_blank" rel="noopener noreferrer"`.
- `prefers-reduced-motion: reduce` respetado en **tres** capas:
  media query global que anula animaciones/transiciones, guarda en `app.js` (typing, reveal,
  GSAP) y `.reveal { opacity: 1; transform: none }`.
- `scroll-margin-top: calc(var(--topbar-h) + 20px)` en `section[id]`, `main[id]` y `#top`
  para que el topbar sticky no tape el ancla.
- `html { scroll-behavior: smooth }`, desactivado bajo movimiento reducido.
- Los `<img>` llevan `alt` descriptivo; si alguna fuera decorativa, debe llevar `alt=""`.

**Deuda conocida:** los tres `aria-label` de `a.project-link` dicen
"Abrir repositorio DevOps Toolkit" (ver §15).

---

## 10. Rendimiento

- Cero dependencias de runtime, cero build, cero bundler.
- GSAP y ScrollTrigger desde `public/vendor/` con `defer` (114 KB combined, sin bloquear).
- Fuentes con `preconnect`; no hay `font-display` control (lo resuelve Google Fonts).
- Animaciones de entrada por `IntersectionObserver` (no en `scroll`), con `unobserve` tras la
  primera aparición: el coste cae a cero al seguir bajando.
- `loading="lazy"` + `decoding="async"` + `width/height` + `aspect-ratio: 16/10` en las
  capturas: sin CLS al cargar.
- `body { overflow-x: hidden }` como red de seguridad del watermark gigante.
- `backdrop-filter` solo en el rail y el topbar (dos elementos).

---

## 11. Responsive

Cuatro breakpoints, todos declarados al final de `styles.css`:

| Media query | Qué cambia |
| --- | --- |
| `min-width: 1051px` | Hero pasa a **3 columnas**: número · copy · terminal. `h1` a `clamp(52px, 5.15vw, 88px)`, terminal estirada (`justify-self: stretch`). |
| `max-width: 1050px` | Hero a `70px 1fr` con copy y terminal apilados en la columna 2. `signal-strip` envuelve y `.signal-links` baja a fila propia. **`.project-card` a 3 columnas** (45px · 1fr · 210px) con la media en `grid-column: 3; grid-row: 1 / span 3`. `h2` de contacto gigante pasa a `clamp(43px,7vw,110px)`. |
| `max-width: 740px` | `--rail: 0px`, **el rail se oculta**, `--topbar-h: 64px`, `.topbar-status` oculto, hero en `display: block`, `signal-strip` a 2 columnas, `.project-card` a `37px 1fr` con media/detalle/link a ancho completo, `two-up-section` a 1 columna, `learning-inner` y `philosophy-foot` a 1 columna, `.reveal` forzado a visible, paddings a 20px. **Segundo bloque `@media (max-width: 740px)`** solo para refinar la terminal (cuerpo más alto, prompt en bloque, comando con `overflow-wrap: anywhere`, caption con `max-width: 260px`). |
| `max-height: 620px` | Compacta el rail (`gap: 16px`, márgenes reducidos) en pantallas bajas de escritorio. |

Además, `prefers-reduced-motion` (§9).

Todo el dimensionado de texto y espaciado es fluido con `clamp()`, así que casi todo se
adapta sin media queries.

---

## 12. Datos de contenido

Fuente única de verdad para contactos (está repetida en 3 lugares del HTML):

| Dato | Valor |
| --- | --- |
| Nombre | Leyver Aarón González Mendoza |
| Cargo | Cloud Engineer / DevOps · Ingeniero en TI |
| Email | `gonzalezleyver6@gmail.com` |
| GitHub | `https://github.com/leyverAAA` |
| LinkedIn | `https://www.linkedin.com/in/leyver-aaron-gonzalez-mendoza-7026a73a8/` |
| Ubicación | MX (rail: "MX / 2026") |
| Estado | Open To Work / Disponible para colaborar |
| Licencia | MIT © 2026 |
| Repos de proyectos | `DevOps-Toolkit`, `health-monitor`, `Infraestructura-modular` (todos bajo `leyverAAA`) |

**Ids que no debes renombrar** (están en los anchors del rail y en el CSS):
`#top`, `#contenido`, `#whoami`, `#stack`, `#projects`, `#philosophy`, `#learning`, `#contact`.

---

## 13. Convenciones y trampas conocidas

Estas reglas explican *por qué* el código está como está. Están también en los comentarios
del propio código; consérvalos al editar.

1. **Hovers que no mueven layout.** En grids de 5 columnas, cambiar `padding` en hover
   redimensiona la imagen y produce un salto. Por eso `.stack-line:hover` sí usa
   `padding-left`, pero `.project-card` **no** — usa un `::before` superpuesto.
2. **`filter` en hover de imagen, nunca `transform`.** GSAP escribe `transform` en el `<img>`
   para el parallax; un `transform: scale()` en hover se pisaría con él.
3. **`inset: -7% 0` en las imágenes** es deliberado: da recorrido al parallax de ±4% sin
   descubrir bordes superior/inferior.
4. **`.js-enabled` en `<html>`** es la red de seguridad: sin JS, `.reveal` nunca se oculta.
5. **Sin `border-radius`** en botones, tarjetas ni chips. Es el ADN del diseño.
6. **Sombras offset duras** (`15px 15px 0`, `-3px 3px 0`) en lugar de `box-shadow` difuso.
7. **Tokens centralizados**: no hardcodear espaciados cuando existe un token en `:root`.
8. **Rutas siempre relativas.** Nada de `href="/x"` ni `src="/x"`. El sitio se sirve en la
   raíz de un dominio en local, pero bajo `https://<user>.github.io/<repo>/` en producción.
   Una ruta absoluta resuelve contra la raíz del dominio y da 404. `npm test` lo falla.
9. **Trampa — CSS compactado.** `styles.css` tiene reglas largas de una sola línea. Un
   formateador automático lo destruye; no lo corras.
10. **Trampa — variables CSS inline.** El progreso de las barras de aprendizaje se pasa con
    `style="--progress:NN%"`. Un sanitizador de HTML que elimine estilos inline rompería
    las barras.
11. **`og:image` es una URL absoluta a propósito.** A diferencia del resto de rutas, las
    redes sociales exigen URL completa; por eso apunta a
    `https://leyveraaa.github.io/Leyver_Aaron_Profile-/og-image.jpg` y hay que actualizarla
    si el repo o el dominio cambian.
12. **Las capturas van en WebP.** Convertidas desde PNG (que ocupaban hasta 1.7 MB) con
    `ffmpeg`. El comando exacto está en `public/img/projects/README.md`. El `width/height`
    del `<img>` es 480×300 aunque el PNG convertido varíe de alto: el `aspect-ratio: 16/10`
    del frame manda y `object-fit: cover` recorta.

---

## 14. Recetas: cómo hacer cambios comunes

### Agregar una sección nueva al flujo

1. `index.html`: `<section class="...-section section-grid reveal" id="nuevo" aria-labelledby="nuevo-title">`
   con `.section-number` (número + palabra) y el contenido en la 2ª columna.
2. `index.html`: agrega `<a href="#nuevo"><span>NN</span>Etiqueta</a>` al `.rail-nav`.
   Renumera los anchors siguientes si es intermedio.
3. `styles.css`: declara los tokens de espaciado/color en `:root` y las reglas de la sección
   en el bloque correspondiente, reutilizando `.section-grid`, `.command-label`, `.section-heading`.
4. Si es sección invertida, replica el patrón de `.stack-section` (fondo `var(--paper)`, texto
   `var(--ink)`, acentos oscuros hardcodeados).

### Agregar un proyecto

1. `index.html`: nuevo `<article class="project-card">` manteniendo el orden interno
   (`.project-number`, `.project-intro`, `figure.project-media` con `.media-fallback`
   **+ `img`**, `.project-detail`, `a.project-link`).
2. Actualiza `.project-count` ("03 ARCHIVOS" → "04 ARCHIVOS").
3. Deja la imagen **en WebP, 480 px de ancho** en `public/img/projects/` y **agrega la fila
   al README de esa carpeta**. El comando de conversión está más abajo (§14).
4. Si no tienes imagen, no agregues el `<img>`: el `.media-fallback` ya es el diseño válido.

### Cambiar textos de la terminal

Solo `app.js` → arreglo `terminalMessages` (comando + respuesta). El HTML ya no lleva copia:
el texto inicial visible vive en `#typed-command` dentro del marcado, y JS lo reescribe.

### Convertir una captura nueva

```bash
ffmpeg -i original.png -vf "scale=480:-2:flags=lanczos" \
  -c:v libwebp -quality 74 -compression_level 6 nombre.webp
```

Luego apunta el `src` en `index.html` (ruta **relativa**) y agrega la fila al README de
`public/img/projects/`. Corre `npm test` al terminar.

### Cambiar los colores

Solo `:root` en `styles.css`. Si el cambio afecta a secciones claras, busca los hex
hardcodeados de esas mismas secciones (`#486c00`, `#5c8700`, `#527900`, `#618c00`,
`#a6aea3`, `#596058`, `#5b645b`, `#659a00`, `#4f7800`, `#4e7800`, `#74846e`, `#5d8d00`).

### Cambiar la barra de aprendizaje

`index.html` → ajusta dos cosas siempre juntas en cada `.learning-bar`:
el texto `<b>NN / 10</b>` y `style="--progress:NN%"`.

### Agregar un proyecto al stack

`index.html` → nuevo `<article class="stack-line">` con `.stack-id`, `<h3>` (separadores `·`
como `<i>`) y `.stack-arrow`. La retícula de 6 líneas es automática.

---

## 15. Estado de los riesgos

### Corregidos

1. **Rutas absolutas + GitHub Pages de proyecto — CORREGIDO; era un fallo activo.**
   Confirmado contra producción: `https://leyveraaa.github.io/styles.css` devolvía **404**
   mientras `.../Leyver_Aaron_Profile-/styles.css` devolvía 200. El sitio publicado cargaba
   **sin CSS y sin JS**: sin estilos, sin terminal escribible, sin GSAP, sin reveal.
   Todas las referencias locales son ahora relativas (`styles.css`, `app.js`, `vendor/…`,
   `img/projects/…`, `favicon.svg`), que funcionan igual en la raíz de un dominio y bajo
   subpath. `npm test` falla si vuelve a aparecer una ruta absoluta.
2. **`aria-label` repetido en los `project-link` — CORREGIDO.** Cada uno nombra ahora su
   proyecto: DevOps Toolkit, Monitoring and Observability, Infrastructure Automation.
3. **Peso de las capturas — CORREGIDO.** Los 3 PNG (700 KB–1.7 MB) se convirtieron a WebP de
   480 px con `ffmpeg`. De ~3.4 MB a **45 KB**. El peso de `public/` pasó de ~3.6 MB a
   **~265 KB**.
4. **`img/projects/README.md` desalineado — CORREGIDO.** Documenta los nombres y formatos
   reales e incluye el comando de conversión.
5. **`.terminal-commands` muerto — CORREGIDO (eliminado).** Era invisible para vista y para
   lectores de pantalla y no lo leía ningún código.
6. **Errata `Prom  etheus` — CORREGIDO** a `Prometheus`.
7. **Código muerto — CORREGIDO.** Se eliminaron la regla `.wordmark-symbol` y el token `--blue`.
8. **Sin `aria-current` en el rail — CORREGIDO.** El enlace de la sección activa lo recibe en
   `app.js`, además del color.
9. **Sin `og:image` — CORREGIDO.** Se generó `public/og-image.jpg` (1200×630, 48 KB) con la
   paleta del sitio, y se añadió `og:url`, `og:image` con dimensiones y alt, `twitter:image`;
   `twitter:card` pasó de `summary` a `summary_large_image`.

### Abiertos (decisión de contenido, no bugs)

- **Las barras de "aprendizaje" son estáticas.** El progreso se declara en el HTML con
  `--progress` y el texto con `NN / 10`: 10 valores editables a mano. Si el nivel cambia hay
  que tocar ambos, así que es una fuente de desincronización.
- **Las cifras de "niveles" (10/10, 09/10…) son autoevaluación** sin contexto ni respaldo.
  Si el objetivo es persuade a un reclutador técnico, conviene reformular o respaldarlas con
  evidencia (certificaciones, proyectos, métricas públicas).
- **Sin `sitemap.xml` ni `robots.txt`.** Relevante solo si el sitio crece; con una sola URL
  es ruido.
- **`mix-blend-mode: soft-light` en `body::before`.** Barato en escritorio, potencialmente
  costoso en móviles de gama baja. Si se reportan problemas de scroll, es el primer candidato
  a revisar.
- **`server.js` solo sirve `index.html` en `/`** y devuelve `404 Not found` en texto plano
  sin logging. Aceptable para un servidor de desarrollo.
- **`og:image` es una URL absoluta** atada al nombre del repo. Si el repo se renombra o se
  añade un dominio propio, hay que actualizar `og:image`, `twitter:image` y `og:url`.
