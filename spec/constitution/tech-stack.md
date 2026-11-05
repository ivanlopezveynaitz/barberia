# Stack y decisiones técnicas

## Frontend (`frontend/`)
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Pruebas: Vitest + Supertest + Playwright

## Backend (`backend/`)
- Node + Express + TypeScript
- Prisma + PostgreSQL
- Autenticación: JWT + bcrypt
- Pagos: Stripe Checkout en modo prueba + webhooks
- Correo en desarrollo: Nodemailer con Mailpit (`http://localhost:8025`)

## Puertos locales
- Backend: 3000
- Frontend: 5173

## Despliegue
- Render (web service + static site + PostgreSQL)
- Blueprint: `render.yaml` en la raíz del repositorio

## Repositorio
- Monorepo: `frontend/` + `backend/`
- Repositorio GitHub: `ivanlopezveynaitz/barberia`
- Ramas: `main`, `backend`, `frontend`
