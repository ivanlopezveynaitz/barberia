# Plan — Ciclo 001: Autenticación y roles

## Objetivo
Implementar el sistema de autenticación y autorización por roles del backend y frontend, listo para ser consumido por los siguientes ciclos.

## Estructura de archivos esperada

```
backend/
  prisma/schema.prisma          # Modelo Usuario, Barberia, VerificationToken, PasswordResetToken
  src/
    controllers/
      auth.controller.ts        # register, login, logout, verify, reset-password
      user.controller.ts        # listUsers, changeRole
    middleware/
      auth.middleware.ts        # verificación JWT
      role.middleware.ts        # autorización por rol
      rate-limit.middleware.ts  # límite de intentos
    routes/
      auth.routes.ts
      user.routes.ts
    services/
      token.service.ts          # JWT access + refresh token
      email.service.ts          # envío vía Mailpit
      password.service.ts       # bcrypt hash/compare
    app.ts
    server.ts
frontend/
  src/
    pages/
      RegisterPage.tsx
      LoginPage.tsx
      VerifyEmailPage.tsx
      ResetPasswordPage.tsx
      ProfilePage.tsx
      UsersListPage.tsx         # solo superadministrador
      ChangeRolePage.tsx        # solo admin/superadmin
    components/
      AuthForm.tsx
      RoleSelector.tsx
      BarberiaSelector.tsx
    services/
      api.ts                    # axios/fetch con interceptors de token
    hooks/
      useAuth.tsx               # estado de sesión (tokens en cookie httpOnly)
```

## Tareas (una por subagente en la implementación)

| Tarea | Descripción | RF | Criterio de aceptación |
|-------|-------------|----|------------------------|
| T001 | Modelos de base de datos (Prisma): Usuario, Barbería, VerificationToken, PasswordResetToken | RF-001, RF-007, RF-009 | Migración `npx prisma migrate dev` ejecuta sin errores; modelos con restricciones de unicidad en correo |
| T002 | Endpoint POST /auth/register (registro asociado a barbería, bcrypt, verificación pendiente) | RF-001 | Rechaza correo duplicado (409), barbería inexistente (404), contraseña < 8 caracteres; crea usuario sin verificar |
| T003 | Endpoint POST /auth/login (JWT acceso 24h + refresh token en cookie httpOnly) | RF-002 | Credenciales incorrectas → 401; correo no verificado → 403; exitoso devuelve tokens |
| T004 | Endpoint POST /auth/logout (invalidar refresh token) | RF-003 | Sesión cerrada; refresh token ya no válido |
| T005 | Middleware auth (verificación JWT en header Authorization) | RF-004 | Sin token → 401; token válido → usuario autenticado en req |
| T006 | Middleware role (autorización por rol: superadmin, admin, barbero, recepción, cliente) | RF-005 | Rol insuficiente → 403; solo superadmin/admin crean roles |
| T007 | Endpoint GET /auth/verify?token= (verificación de correo) | RF-007 | Token válido marca usuario como verificado; token inválido → error |
| T008 | Rate limiting en /auth/register y /auth/login | RF-008 | Límite de intentos aplicado; respuesta 429 al exceder |
| T009 | Flujo reset de contraseña: solicitar token por correo + establecer nueva contraseña | RF-009 | Correo enviado a Mailpit; token permite cambiar contraseña; token expirado rechazado |
| T010 | Endpoint GET /users (listar usuarios, solo superadministrador) | RF-010 | Solo superadministrador puede listar; otros roles → 403 |
| T011 | Endpoint PATCH /users/:id/role (cambiar rol, solo superadministrador y administrador de barbería) | RF-011 | Cambia rol de usuario; solo roles autorizados pueden hacerlo |
| T012 | Pantallas frontend: Registro, Login, Verificación, Reset, Perfil | RF-001, RF-002, RF-003, RF-007, RF-009 | Formularios con validación, mensajes de error inline, responsive 375 px |
| T013 | Pantallas frontend: Listado de usuarios, Cambio de rol | RF-010, RF-011 | Acceso restringido por rol; tabla de usuarios y selector de rol |
| T014 | Conexión frontend ↔ backend (api.ts con interceptores de token, useAuth) | RF-002, RF-004 | Peticiones autenticadas incluyen token; manejo de 401/403 |
| T015 | Tests unitarios de reglas de negocio (backend) | Todos | Tests en verde con Vitest |
| T016 | Tests de API de autenticación (backend) | Todos | `npm run test:api` en verde |
| T017 | Test e2e de flujo de autenticación (frontend) | Todos | `npx playwright test` en verde (flujo crítico: registro → verificación → login → perfil) |

## Criterios de salida del ciclo

- `npm install` en `frontend/` y `backend/` sin errores.
- `npx prisma migrate dev` en `backend/` ejecuta sin errores.
- `npm test` en `frontend/` y `backend/` en verde.
- `npm run test:api` en `backend/` en verde.
- `npx playwright test` en `frontend/` en verde.
- `npm run lint` en `frontend/` y `backend/` sin errores de alto nivel.
- `npm audit --audit-level=high` sin vulnerabilidades críticas.
- Vista previa local verificada con Chrome DevTools (incluida móvil 375 px).
- Auditoría de cierre aprobada.

## Mockups (Stitch)

Antes de la implementación, se generan mockups con Stitch (proyecto `16176347900582099273`, pantalla existente "Sedes y Catálogo de Servicios" como referencia) para las pantallas de autenticación. Si Stitch falla, fallback a HTML/CSS inecpeccable.

## Orden de ejecución

1. T001 (base de datos)
2. T002-T004 (endpoints auth)
3. T005-T006 (middlewares)
4. T007-T009 (verificación, rate limit, reset)
5. T010-T011 (usuarios y roles)
6. T012-T014 (frontend)
7. T015-T017 (tests)

Cada tarea se implementa con TDD: test primero en rojo, luego código para ponerlo en verde.
