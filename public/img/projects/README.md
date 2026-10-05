# Capturas de proyectos

Imágenes que referencian las tarjetas de `public/index.html`. Los `src` del HTML usan rutas
**relativas** (`img/projects/...`) porque el sitio se sirve tanto en la raíz de un dominio
como bajo un subpath de GitHub Pages.

| Archivo | Proyecto | Origen |
| --- | --- | --- |
| `DevOps-toolkit.webp` | 01 — DevOps Toolkit | 480 × 328 |
| `health-monitor.webp` | 02 — Monitoring & Observability | 480 × 334 |
| `Infraestructura-modular.webp` | 03 — Infrastructure Automation | 480 × 380 |

## Reglas

- **Formato:** WebP. Las capturas originales eran PNG de hasta 1.7 MB; convertidas a WebP
  el conjunto pasó de ~3.4 MB a ~45 KB.
- **Ancho:** 480 px. Es el doble del ancho real de visualización en desktop (~235 px), así que
  se ve nítido en pantallas HiDPI sin penalizar peso.
- **Peso:** objetivo por debajo de 60 KB por imagen. Se sirven con `loading="lazy"`.
- **Proporción:** el marco reserva `aspect-ratio: 16 / 10` y la imagen usa `object-fit: cover`,
  así que cualquier proporción funciona; el encuadre se recorta. El `inset: -7% 0` del CSS
  sobresale la imagen a propósito para que el parallax de ±4% no descubra bordes.
- **Si un archivo falta**, la tarjeta muestra el placeholder `.media-fallback` generado en CSS
  con el número y la tecnología del proyecto. No se rompe nada y nunca se ve una imagen rota.

## Convertir una captura nueva

```bash
ffmpeg -i original.png -vf "scale=480:-2:flags=lanczos" -c:v libwebp -quality 74 -compression_level 6 nombre.webp
```

Luego actualiza el `src` en `public/index.html` y esta tabla.

## Consideraciones de accesibilidad

El texto `alt` de cada `<img>` describe lo que muestra la captura. Si una imagen es
puramente decorativa, deja `alt=""` para que los lectores de pantalla la omitan.
El `<span class="media-fallback">` es `aria-hidden="true"`: es decoración de relleno y debe
seguir siéndolo aunque cambie el texto.