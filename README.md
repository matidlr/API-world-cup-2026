# Trabajo Práctico Integrador — Programación III UTN
## Mundial 2026 — Full Stack Web App

---

## Contexto

En este trabajo práctico van a construir una aplicación web full stack con temática del **Mundial de Fútbol 2026**. Cada grupo de **10 integrantes** tendrá asignada una **selección de fútbol por sorteo**. El look & feel de toda la aplicación debe representar a esa selección: sus **colores oficiales** y su **escudo**.

La aplicación consume datos de la **WorldCupAPI** — una API ya desarrollada por la cátedra que **no se puede modificar**. Su backend NestJS actúa como intermediario (BFF — Backend For Frontend): recibe los pedidos del frontend Angular, llama a la WorldCupAPI, transforma los datos si es necesario, y responde al frontend.

---

## Stack técnico

| Capa | Tecnología | Puerto | URL base |
|------|-----------|--------|----------|
| Frontend | Angular (WorldCupApp) | `:3101` | `http://localhost:3101` |
| Backend BFF | NestJS (WorldCupCore) | `:4101` | `http://localhost:4101/worldCupCore` |
| API de datos | WorldCupAPI (solo lectura, cátedra) | `:5101` | `http://localhost:5101/worldCup` |

**Swagger:**
- WorldCupAPI: `http://localhost:5101/worldCup/api`
- WorldCupCore: `http://localhost:4101/worldCupCore/api`

---

## Integrantes del grupo

> Completar con los nombres reales y la funcionalidad asignada por sorteo interno.

| # | Integrante | Funcionalidad | Sección |
|---|-----------|---------------|---------|
| 1 | | Cuerpo Técnico y Estrategia | Mi Equipo |
| 2 | | Rivales Históricos | Mi Equipo |
| 3 | | Fase de Grupos | El Mundial |
| 4 | | Camino del Equipo | El Mundial |
| 5 | | Detalles de Partidos | El Mundial |
| 6 | | Estadísticas y Premios | El Mundial |
| 7 | | Historial de Mundiales | El Mundial |
| 8 | | Eventos en Vivo | La Final |
| 9 | | Estado del Equipo en la Final | La Final |
| 10 | | **Jugar la Final** *(Responsabilidad Grupal)* | La Final |

> **Jugar la Final** es obligatoria para la aprobación del TP y responsabilidad de todo el grupo. Debe poder jugarse de principio a fin sin errores. De ella dependen: Eventos en Vivo, Estado del Equipo, Estadísticas y Premios e Historial de Mundiales.

---

## Índice

- [Contexto](#contexto)
- [Stack técnico](#stack-técnico)
- [Integrantes del grupo](#integrantes-del-grupo)
- [Requerimientos generales](#requerimientos-generales-de-la-aplicación)
- [Configuración del .env](#configuración-del-env-del-worldcupcore)
- [Cómo levantar el proyecto](#cómo-levantar-el-proyecto)
- [Estructura de proyecto](#estructura-de-proyecto)
- [Documentación](#documentación)
- [Entregables](#entregables)

---

## Requerimientos generales de la aplicación

- **Sin login.** La app arranca directo en la pantalla principal.
- **Menú lateral (sidebar)** con navegación entre todas las funcionalidades.
- El **encabezado del sidebar** debe mostrar el escudo y los colores de la selección asignada.
- Cada funcionalidad es una **vista independiente** que se carga en el área de contenido principal.
- El frontend Angular **nunca llama directamente** a la WorldCupAPI — siempre pasa por el WorldCupCore.
- Toda la lógica de negocio debe resolverse en el WorldCupCore; el frontend solo adapta la respuesta al modelo de vista.
- Se debe respetar la arquitectura de los proyectos provista por la cátedra.
- Se deben respetar el stack técnico y las tecnologías vistas en clase.
- **Idioma:** el WorldCupCore lee la variable de entorno `APP_LANG=es` y pasa `?lang=es` a cada endpoint de la WorldCupAPI que lo soporte.

---

## Configuración del .env del WorldCupCore

```env
APP_PORT=4101
APP_BASE_PATH=worldCupCore

WORLD_CUP_API_URL=http://localhost:5101
WORLD_CUP_API_BASE_PATH=/worldCup

CORS_ALLOWED_ORIGIN=http://localhost:3101

TEAM_ID=arg          # ID del equipo asignado a este grupo
APP_LANG=es          # Idioma de las respuestas de la WorldCupAPI
```

Todas las funcionalidades de "Mi Equipo" leen el `TEAM_ID` directamente del `.env` — **no** lo reciben como parámetro del frontend.

---

## Cómo levantar el proyecto

Levantar los tres servicios en orden: primero la API de datos, luego el BFF, finalmente el frontend.

### 1. WorldCupAPI (puerto 5101)

```bash
cd world-cup-api
npm install
npm start
```

Verificar en: `http://localhost:5101/worldCup/api`

### 2. WorldCupCore — BFF NestJS (puerto 4101)

```bash
cd backend/world-cup-core
npm install
# Editar el .env: reemplazar TEAM_ID con el ID del equipo asignado al grupo
npm run start:dev
```

Verificar en: `http://localhost:4101/worldCupCore/api`

### 3. WorldCupApp — Frontend Angular (puerto 3101)

```bash
cd frontend/world-cup-app
npm install
npm start
```

Verificar en: `http://localhost:3101`

---

## Estructura de proyecto

```
world-cup-app/               ← App Angular (puerto 3101)
└── src/app/
    ├── core/
    │   ├── constants/
    │   ├── models/
    │   └── services/        ← api.service, app-context.service, base-api.service
    ├── shared/
    │   ├── admin/
    │   ├── layout/
    │   └── sidebar/
    └── features/
        ├── my-team/
        │   ├── squad/               ← Plantel (ejemplo provisto)
        │   ├── team-history/        ← Historia del Equipo (ejemplo provisto)
        │   ├── coaching/            ← Cuerpo Técnico y Estrategia
        │   └── rivals/              ← Rivales Históricos
        ├── world-cup/
        │   ├── simulate/            ← Simular el Mundial (ejemplo provisto)
        │   ├── groups/              ← Fase de Grupos
        │   ├── journey/             ← Camino del Equipo
        │   ├── matches/             ← Detalles de Partidos
        │   ├── stats/               ← Estadísticas y Premios
        │   └── history/             ← Historial de Mundiales
        └── play-final/
            ├── final-chat/          ← Jugar la Final (Responsabilidad Grupal)
            ├── live-events/         ← Eventos en Vivo
            └── team-state/         ← Estado del Equipo en la Final
```

```
world-cup-core/              ← BFF NestJS (puerto 4101, base /worldCupCore)
└── src/
    ├── admin/
    ├── basic/               ← abstract-base.service, world-cup-api.service, world-cup-feature-api.service
    ├── teams/               ← controllers y services: squad, team-history, coaching, rivals
    ├── world-cup/           ← controllers y services: simulate, groups, journey, matches, stats, history
    └── match/               ← controllers y services: play-final, live-events, team-state
```

> Cada feature sigue el mismo patrón que los ejemplos provistos: `model/` → `service/` → `component` en el frontend; `controller` → `service` en el backend. Estudiar los ejemplos antes de arrancar.

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [Enunciado v5](./docs/TP_Mundial2026_Enunciado_v5_Simplificado.pdf) | Descripción completa del TP: funcionalidades a desarrollar, requerimientos de pantalla por feature, endpoints de WorldCupAPI a consumir y criterios de evaluación. |
| [Guía Técnica v5](./docs/TP_Mundial2026_Guía_Técnica_v5.pdf) | Arquitectura del proyecto, listado completo de endpoints disponibles de la WorldCupAPI, notas de implementación y diagramas de flujo de la feature Plantel como referencia. |

---

## Entregables

1. **Repositorio público en GitHub** con el código de WorldCupCore y WorldCupApp (fork del repo de la cátedra).
2. **El proyecto debe compilar y correr sin errores** con `npm install` + `npm start` en cada servicio.
3. **No modificar las funcionalidades de ejemplo** (Plantel, Historia del Equipo, Simular Final) — son la referencia de arquitectura.
4. **La WorldCupAPI no debe modificarse.** El proyecto será evaluado usando la WorldCupAPI provista por la cátedra; si no funciona con ella es motivo de desaprobación.
5. **Jugar la Final debe poder jugarse de principio a fin sin errores.** Es de carácter obligatorio para la aprobación del TP y responsabilidad de todo el equipo.
6. **Este README** actualizado con los nombres de los integrantes y la funcionalidad asignada a cada uno.

---

*Programación III — UTN — 2026*
