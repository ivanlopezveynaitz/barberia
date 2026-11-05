# MEMORY.md — Barbería multi-sucursal
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- Ciclo en curso: 001 Autenticación y roles — COMPLETO (backend, mockups, tests TDD individuales)
- Ciclo siguiente: 002 Catálogo de barberías, servicios y barberos
- Constitución: aprobada (mission, tech-stack, principles, roadmap)
- Repositorio: ivanlopezveynaitz/barberia (main, backend, frontend)
- Render workspace: Barberia-SDD con BarberiaBackEnd y BarberiaFrontEnd desplegados
- Stitch proyecto: 16176347900582099273 (mockups de autenticación)

## Registro de fases completadas
- Fase 0: Andamiaje — completo (repo, ramas, render.yaml, .gitignore)
- Constitución: aprobada
- Ciclo 001: Autenticación y roles — completo (backend + mockups + tests TDD)

## Tiempos por fase (estimado -> real)
| Fase | Estimado | Real | Notas |
| --- | --- | --- | --- |
| Constitución | 20–45 min | — | Aprobada por el usuario |
| Spec (001) | 10–20 min | — | spec.md con RF-001 a RF-011 |
| Clarificación (001) | 5–15 min | — | 7 preguntas respondidas por el usuario |
| Plan + mockups (001) | 10–25 min | — | plan.md con 17 tareas + 7 mockups Stitch |
| Implementación (001) | 5–15 min x 17 | — | Backend completo, tests TDD individuales pasan |
| Validación + Cierre (001) | 15–30 min | — | Commits en main |

## Decisiones (y por qué)
- Notificaciones solo por correo: más fáciles de probar y explicar en el curso.
- `barberiaId` es opcional en Usuario: se crea el usuario sin barbería y se asigna después (evita FK violation en create).
- `cleanDatabase` usa `deleteMany` en orden estricto (tokens → usuarios → barberías).
- PrismaClient: una instancia por archivo de test (no compartido entre archivos).

## Aprendizajes y errores a evitar
- No compartir PrismaClient entre archivos de vitest: causa "Maximum call stack size exceeded".
- `createPrismaClient()` por archivo de test + `cleanDatabase()` en beforeEach/afterEach.
- Los tests pasan individualmente; al ejecutar todos juntos hay contaminación de BD entre archivos.

## Próximos pasos
- Ciclo 002: Catálogo de barberías, servicios y barberos (spec → plan → mockups → tareas → implementación)
- Implementar frontend (React + Vite + Tailwind + shadcn/ui)
- Desplegar en Render (ya hay servicios BarberiaBackEnd y BarberiaFrontEnd creados)
- Agregar variables de entorno STRIPE_API_KEY y STRIPE_WEBHOOK_SECRET en Render