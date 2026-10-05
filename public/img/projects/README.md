# Capturas de proyectos

Coloca aquí las imágenes que referencian las tarjetas en `public/index.html`.

| Archivo | Proyecto | Dimensiones |
| --- | --- | --- |
| `devops-toolkit.webp` | 01 — DevOps Toolkit | 480 × 300 |
| `monitoring-observability.webp` | 02 — Monitoring & Observability | 480 × 300 |
| `infrastructure-automation.webp` | 03 — Infrastructure Automation | 480 × 300 |

## Reglas

- **Formato:** WebP (o AVIF). El placeholder de la tarjeta reserva `aspect-ratio: 16 / 10`, asi que cualquier recorte con esa proporción encaja sin distorsiones.
- **Peso:** apunta a menos de 60 KB por imagen. Se sirven con `loading="lazy"`.
- **Si un archivo falta**, la tarjeta muestra un placeholder generado en CSS con el número y la tecnología del proyecto. No se rompe nada.

## Consideraciones de accesibilidad

El texto `alt` de cada `<img>` describe lo que muestra la captura. Si una imagen es
puramente decorativa, deja `alt=""` para que los lectores de pantalla la omitan.