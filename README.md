# NEXO SPACE AI

Plataforma experimental de arquitectura e interiorismo de **NEXO STUDIO**, construida sobre el motor open-source [OpenPlan3D](https://github.com/laanlabs/openPlan3D).

## Visión

Convertir un plano en un flujo de trabajo completo:

**Plano 2D → modelo 3D → materiales → mobiliario → IA → cantidades → presupuesto → presentación al cliente.**

## Primera etapa

- Motor 2D/3D basado en OpenPlan3D.
- Identidad visual NEXO SPACE AI.
- Proyectos guardados localmente mientras construimos la capa cloud.
- Compatibilidad con JSON/DXF/PDF/PNG y paquetes del motor original.
- Preparado para biblioteca de materiales y mobiliario TEMPLO.
- Preparado para una capa de IA sin acoplarla al núcleo geométrico.

## Arquitectura prevista

```text
NEXO SPACE AI
├── Core planner (OpenPlan3D / SvelteKit / Three.js)
├── NEXO product layer
│   ├── Branding
│   ├── Project dashboard
│   ├── Material library
│   ├── Furniture library
│   └── Client presentation
├── AI layer
│   ├── Design copilot
│   ├── Material suggestions
│   ├── Layout variants
│   └── Render pipeline
└── Cloud layer
    ├── Auth
    ├── PostgreSQL / Neon
    ├── Object storage
    └── Collaboration
```

## Upstream

El código base proviene de `laanlabs/openPlan3D`, licenciado bajo MIT. Conservamos los identificadores de formato internos de OpenPlan3D cuando son necesarios para mantener compatibilidad con archivos y paquetes existentes.

La sincronización del motor se automatiza desde `.github/workflows/bootstrap-openplan3d.yml`. Las personalizaciones propias viven en `.nexo/` para evitar mezclar la capa de producto con el core.

## Licencia

La base OpenPlan3D conserva su licencia MIT y avisos originales. Las adiciones propias de NEXO deben revisarse antes de definir la licencia pública final del producto.
