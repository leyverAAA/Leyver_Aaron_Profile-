# Infrafolio

Portafolio personal de **Leyver Aarón González Mendoza** — infraestructura cloud, DevOps, automatización y operación de Linux.

Sitio estático de una sola página. **Sin framework y sin paso de build**: HTML, CSS y JavaScript nativo servidos por un servidor estático mínimo escrito con el módulo `node:http`.

La única librería es **GSAP 3.13 + ScrollTrigger**, vendorizada en `public/vendor/` (gratuita, incluso para uso comercial). No se instala con npm: los archivos se sirven tal cual, igual que el resto del sitio.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Marcado | HTML5 semántico |
| Estilos | CSS3 (custom properties, grid, `clamp()`) |
| Interactividad | JavaScript nativo + GSAP 3.13 / ScrollTrigger |
| Servidor | Node.js `node:http` + `node:fs` |
| Dependencias npm | Ninguna |
| Deploy | GitHub Actions → GitHub Pages |

---

## Estructura

```
infrafolio/
├── .github/
│   └── workflows/
│       └── deploy.yml     # Verifica y publica en GitHub Pages
├── public/                # Raíz servida (site root)
│   ├── index.html         # Documento único, todas las secciones
│   ├── styles.css         # Sistema visual completo
│   ├── app.js             # Terminal, reveal, rail nav, motion
│   ├── favicon.svg        # Ícono [L/A]
│   ├── og-image.jpg       # Preview 1200×630 para redes sociales
│   ├── img/projects/      # Capturas WebP (ver README dentro)
│   └── vendor/            # GSAP + ScrollTrigger minificados
├── scripts/
│   └── check.mjs          # Verificación del sitio (sin dependencias)
├── server.js              # Servidor estático de desarrollo
├── package.json
├── LICENSE                # MIT
└── README.md
```

> Las rutas del sitio son **relativas** a propósito. En GitHub Pages un proyecto se sirve
> bajo `https://<usuario>.github.io/<repo>/`, y una ruta como `/styles.css` apuntaría a la
> raíz del dominio y devolvería 404. `npm test` lo verifica.

---

## Uso local

Requiere **Node.js 20 o superior**. No hay nada que instalar.

```bash
# Clonar
git clone https://github.com/leyverAAA/Leyver_Aaron_Profile-.git
cd Leyver_Aaron_Profile-

# Arrancar en http://localhost:3000
npm start
```

Puerto configurable por variable de entorno:

```bash
PORT=8080 npm start        # macOS / Linux
$env:PORT=8080; npm start  # Windows PowerShell
```

> No existe un paso de build: `public/` ya es el producto final. El script `build` existe únicamente para confirmar el estado del sitio.

### Verificar antes de publicar

```bash
npm test
```

Sin dependencias. Comprueba que cada referencia local exista, que **ninguna ruta sea
absoluta** (el fallo que dejó producción sin CSS ni JS), que las anchas y referencias
`aria-*` apunten a ids reales, que no haya ids duplicados y que toda custom property usada
esté declarada. El mismo script corre como paso previo en el workflow de deploy.

---

## Secciones del sitio

- **Hero** — efecto de máquina de escribir con rotación de comandos en una terminal simulada.
- **Perfil** — quién soy y qué hago.
- **Stack** — tecnologías agrupadas por área.
- **Proyectos** — trabajos destacados con enlace a repositorio.
- **Filosofía** — la automatización como arquitectura.
- **Logros e intereses** — pruebas de ruta y radar de exploración.
- **En curso** — objetivos de aprendizaje actuales.
- **Contacto** — enlaces directos.

---

## Detalles de implementación

**Accesibilidad**

- Enlace de salto al contenido (`skip-link`).
- HTML semántico con jerarquía de encabezados correcta y landmarks (`header`, `nav`, `main`, `footer`).
- Etiquetas `aria-label` en navegación, secciones y enlaces con icono.
- Respeto por `prefers-reduced-motion`: las animaciones se desactivan y el contenido se muestra estático.

**Rendimiento**

- Sin dependencias que instalar ni cadena de build. GSAP se carga con `defer` y solo se inicializa si el usuario no prefiere movimiento reducido.
- Tipografías desde Google Fonts con `preconnect` para anticipar la conexión.
- Animaciones de entrada mediante `IntersectionObserver` (no en scroll), con desconexión tras la primera aparición.
- Las capturas de proyecto usan `loading="lazy"` y `aspect-ratio` para evitar desplazamiento de layout al cargar.

**Diseño responsive**

- Mobile-first con tipografía fluida vía `clamp()`.
- Navegación lateral colapsada a ≤ 740 px, donde la terminal rota sin efecto de escritura carácter por carácter.
- La tarjeta de proyecto pasa de 5 columnas a 3 (≤ 1050 px) y luego a 2 con la imagen a ancho completo (≤ 740 px).

**Tarjetas de proyecto**

Cada tarjeta admite una captura en `.project-media`. Si el archivo no existe, un placeholder generado en CSS con el número y la tecnología del proyecto ocupa su lugar, así que nunca se ve una imagen rota. Las rutas y las reglas de formato están en `public/img/projects/README.md`.

**Seguridad del servidor**

`server.js` normaliza la ruta solicitada y valida que el resultado permanezca dentro de `public/`, bloqueando el path traversal antes de abrir cualquier archivo.

---

## Deploy

Cada `push` a `main` dispara `.github/workflows/deploy.yml`, que primero corre la
verificación (`npm test`) y después publica `public/` en GitHub Pages. Si la verificación
falla, no se publica.

Para activarlo en el repositorio: **Settings → Pages → Build and deployment → Source → GitHub Actions**.

URL resultante: `https://leyveraaa.github.io/Leyver_Aaron_Profile-/`

---

## Contacto

- **LinkedIn** — [leyver-aaron-gonzalez-mendoza](https://www.linkedin.com/in/leyver-aaron-gonzalez-mendoza-7026a73a8/)
- **GitHub** — [@leyverAAA](https://github.com/leyverAAA)

---

## Licencia

MIT © 2026 Leyver Aarón González Mendoza. Consulta [LICENSE](LICENSE).