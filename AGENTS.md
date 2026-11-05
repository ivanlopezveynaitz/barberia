# AGENTS.md — Barbería multi-sucursal
Aplicación web de citas, pagos anticipados y caja para varias barberías. El detalle está en spec/constitution/mission.md.

## Constitución (léela antes de trabajar)
- Principios innegociables: `spec/constitution/principles.md`
- Misión, usuarios y alcance: `spec/constitution/mission.md`
- Stack y decisiones técnicas: `spec/constitution/tech-stack.md`
- Orden de las features: `spec/constitution/roadmap.md`

## Comandos
- Instalar: `npm install` dentro de `frontend/` y de `backend/`
- Ejecutar: `npm run dev` dentro de `frontend/` y de `backend/`
- Base de datos: `npx prisma migrate dev` dentro de `backend/`
- Tests unitarios: `npm test` dentro de `frontend/` y de `backend/`
- Tests de API: `npm run test:api` dentro de `backend/`
- Tests e2e: `npx playwright test` dentro de `frontend/`. Instala el navegador **una vez**: `npx playwright install chromium` (o `channel: 'chrome'` en `playwright.config` para reutilizar tu Chrome y evitar la descarga). El **MCP de Playwright** es solo para diagnosticar, no corre el suite.
- Correo en desarrollo: Mailpit en `http://localhost:8025`
- Webhooks de Stripe en local: `stripe listen --forward-to localhost:[puerto]/webhooks/stripe` (para los pagos)
- Lint: `npm run lint` dentro de `frontend/` y de `backend/`
- Seguridad: `npm audit --audit-level=high` · `gitleaks detect --source .` · `semgrep --config auto backend/ frontend/`
(Estos comandos se confirman al terminar el ciclo 000.)

## Reglas de dominio / trampas conocidas
- Horas: se guardan en UTC y se muestran en la zona de la barbería. Usa la skill `zonas-horarias` (se crea en el ciclo 004).
- Dinero: siempre enteros en centavos. Usa la skill `dinero` (se crea en el ciclo 009).
- Doble reserva: se evita con una restricción en la base de datos, no solo con una validación en la pantalla.
- Pagos: una cita se confirma solo con el webhook de Stripe, nunca al regresar el cliente a la página.
- Aislamiento: toda consulta filtra por la barbería del usuario autenticado.

## SDD
- Sigue la skill `sdd` y los comandos `/sdd-*`. Lee la feature activa (`spec/features/NNN-*/`) antes de tocar código.
- Crear o editar archivos en `spec/` y los tests de la tarea activa no requiere preguntar.
- `README.md` y `docs/artefactos/` los genera solo el subagente `sdd-documentador`; no los edites a mano dentro de los marcadores `sdd`.

## Clarificación
- Usa brainstorming solo para explorar alternativas; no planees ni escribas código en esta etapa.
- Toda decisión de brainstorming se registra en spec.md mediante `/sdd-clarify`. spec.md es la única fuente de verdad.

## Memoria
- Al empezar, lee `MEMORY.md`. Al cerrar una fase o tomar una decisión fuera del plan, actualízalo.
- Máximo ~50 líneas. Lo que se vuelva regla permanente se propone para principles.md o tech-stack.md.
- Nunca guardes claves, tokens ni datos personales.

## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué cambiaste y qué decisiones debo revisar.

## Límites
- ✅ Siempre: respetar la constitución y las reglas de dominio; textos de la interfaz en español; solo llaves de prueba de Stripe.
- ⚠️ Pregunta antes: dependencias fuera de tech-stack.md, archivos fuera de `spec/` y de la tarea activa, cambios en el esquema de la base de datos.
- 🚫 Nunca: guardar secretos en el repositorio, enviar correos a direcciones reales desde desarrollo, borrar migraciones ya aplicadas.

## Tests
- TDD: el test se escribe primero y se ve en rojo. Cada test empieza con su RF (`RF-x: ...`).
- Pirámide: reglas de negocio con tests unitarios; endpoints y permisos con tests de API; un test e2e por flujo crítico.
- Un test en rojo NO se modifica para que pase sin aprobación: lo que cambia es el código.
- Hora fija: la lógica recibe "ahora"; en e2e se fija el reloj del navegador.
- Sin servicios reales: Stripe en modo de prueba, correo a Mailpit (se lee con su API en los tests), base de pruebas con datos semilla que se reinicia.

## Verificación
- Antes de dar algo por terminado: los comandos de tests que apliquen en verde y, si es de interfaz, comprobación con Chrome DevTools (incluida la vista móvil de 375 px).
