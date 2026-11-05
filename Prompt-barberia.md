# Prompt de arranque — Barbería

Pega este texto a `@coordinator` (OpenCode) o en Claude Code con el coordinador activo, situado en una carpeta vacía donde quieras crear el proyecto.

---

`@coordinator` Quiero construir, de principio a fin con el flujo SDD, el siguiente proyecto. Nombre: **barberia** (úsalo para la carpeta y el repositorio).

**Qué es:** una aplicación web que ayuda a barberías y a sus clientes a agendar, cobrar y controlar citas mediante reservas con pago anticipado y una caja integrada. Varias barberías gestionan barberos, servicios, horarios y caja; sus clientes reservan y pagan por adelantado. Objetivo didáctico: un ciclo SDD completo por funcionalidad.

**Roles:** superadministrador, administrador de barbería, barbero, recepción/caja y cliente.

**Stack:** React + Vite + TypeScript + Tailwind + shadcn/ui (frontend); Node + Express + TypeScript + Prisma + PostgreSQL (backend); JWT + bcrypt; Stripe Checkout en modo prueba + webhooks; Nodemailer con Mailpit en desarrollo; Vitest + Supertest + Playwright. Monorepo `frontend/` + `backend/`. Despliegue en Render. Puertos locales: backend 3000, frontend 5173.

**Cómo quiero que lo lleves (flujo SDD completo, deteniéndote en cada compuerta):**
1. **Andamiaje (Fase 0):** Utiliza la carpeta actual `barberia`, `git init`, el `.gitignore`; si Stitch está conectado, crea el **proyecto de Stitch** `barberia` (es requisito para generar mockups).
2. **Constitución:** redáctala por bloques de preguntas (mission, tech-stack, principles, roadmap) y PARA hasta mi aprobación. Puedes partir la skill sdd-docs que contiene las plantillas para los artefactos a generar en `plantillas/artefactos/` como base.
3. **Repositorio (opcional):** pregúntame si lo publico en GitHub (dueño, visibilidad, nombre = `barberia`) o lo dejo local.
4. **Por cada ciclo del roadmap, en orden:** spec -> clarificación (incluye calidad visual) -> aprobación -> plan -> mockups con Stitch (con **fallback** a impeccable/HTML + captura si Stitch falla; **nunca** omitas la validación de mockups) -> aprobación -> tareas -> análisis -> implementación **una tarea por subagente nuevo** -> revisión -> validación -> **vista previa local** -> auditoría de cierre + **QA de artefactos** (reporta rutas y que no estén vacíos).
5. **Pausas y estado:** no te saltes ninguna aprobación ni pregunta mía; si cambiamos de sesión o de agente, **reconstruye el estado** desde los archivos (`roadmap.md`, `MEMORY.md` -> Estado actual, el `Estado` de la feature activa) y continúa desde la compuerta pendiente.
6. **Despliegue (ciclo correspondiente):** con el MCP de Render crea los recursos uno a uno (web service + static site + PostgreSQL) y repórtame las URLs (local y Render).
7. **Cierre:** `/sdd-docs cierre` con `3.3`, los manuales `5.1`/`5.2` + PDF y el README consolidado.

Empieza por la Fase 0 y guíame paso a paso.
