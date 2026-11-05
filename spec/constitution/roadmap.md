# Roadmap — Orden de las features

El proyecto se construye ciclo a ciclo, siguiendo el flujo SDD:
**spec → clarificación → aprobación → plan → mockups con Stitch → aprobación → tareas → análisis → implementación (una tarea por subagente) → revisión → validación → vista previa local → auditoría de cierre → QA de artefactos**.

## Ciclos propuestos

| Ciclo | Feature | Estado |
|-------|---------|--------|
| 000 | Andamiaje (estructura repo, ramas, render.yaml, constitución) | ✅ Hecho |
| 001 | Autenticación y roles (usuarios, JWT, bcrypt) | ✅ Hecho (backend + mockups + tests TDD) |
| 002 | Catálogo de barberías, servicios y barberos | Pendiente |
| 003 | Horarios y disponibilidad por barbero | Pendiente |
| 004 | Reservas de citas (crear, ver, cancelar) | Pendiente |
| 005 | Pagos con Stripe Checkout + webhooks | Pendiente |
| 006 | Caja integrada y corte de caja | Pendiente |
| 007 | Notificaciones por correo (Mailpit en dev) | Pendiente |
| 008 | QA de artefactos, auditoría de cierre y despliegue final | Pendiente |

> Este roadmap es una propuesta inicial. Cada ciclo se detalla en su propia spec antes de implementarse.
