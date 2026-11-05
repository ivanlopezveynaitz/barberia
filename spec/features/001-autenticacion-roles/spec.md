# Feature 001 — Autenticación y roles

## Descripción
Sistema de autenticación de usuarios con roles para la aplicación Barbería. Permite registrarse, iniciar sesión, cerrar sesión y autenticar peticiones mediante JWT. Cada usuario tiene un rol y está asociado a una barbería existente.

## Roles
- superadministrador
- administrador de barbería
- barbero
- recepción/caja
- cliente

## Requisitos funcionales

**RF-001: Registro de usuario asociado a barbería**  
Un usuario nuevo se registra proporcionando nombre, correo electrónico, contraseña, rol y barbería. El sistema valida que el correo no exista ya, que la barbería exista, y guarda la contraseña hasheada con bcrypt. No se puede registrar un usuario si no existe al menos una barbería previa.

**RF-002: Inicio de sesión**  
Un usuario verificado puede iniciar sesión con correo y contraseña. Si las credenciales son correctas, el sistema devuelve un JWT de acceso (expiración 24 horas) y un refresh token, almacenados de forma segura (cookie httpOnly).

**RF-003: Cierre de sesión**  
El cliente puede cerrar sesión eliminando los tokens de su lado y el backend invalida el refresh token.

**RF-004: Autenticación de peticiones**  
Endpoints protegidos requieren un JWT válido en el header `Authorization: Bearer <token>`. El backend verifica el token y extrae el usuario autenticado.

**RF-005: Autorización por rol**  
Cada endpoint protegido declara los roles permitidos. Solo los roles `superadministrador` y `administrador de barbería` pueden crear/asignar roles a otros usuarios. Si el usuario no tiene el rol requerido, el backend responde con 403 Forbidden.

**RF-006: Perfil del usuario autenticado**  
El usuario autenticado puede consultar su propio perfil (nombre, correo, rol, barbería asociada).

**RF-007: Verificación de correo electrónico**  
Tras el registro, el sistema envía un token de verificación por correo (vía Mailpit en desarrollo). El usuario debe verificar su correo antes de poder iniciar sesión.

**RF-008: Rate limiting**  
Los endpoints de login y registro tienen límite de intentos para evitar fuerza bruta.

**RF-009: Reset de contraseña**  
Flujo de "olvidé mi contraseña": el usuario solicita un reset, recibe un token por correo (Mailpit), y puede establecer una nueva contraseña.

**RF-010: Listar usuarios**  
Endpoint para listar todos los usuarios. Solo accesible por `superadministrador`.

**RF-011: Cambiar rol de usuario**  
Endpoint para cambiar el rol de un usuario. Accesible por `superadministrador` y `administrador de barbería`.

## Criterios de aceptación

1. El registro rechaza contraseñas menores a 8 caracteres.
2. El registro rechaza correos duplicados (409 Conflict).
3. El registro rechaza barberías inexistentes (404 Not Found).
4. El login con credenciales incorrectas devuelve 401 Unauthorized.
5. El login sin correo verificado devuelve 403 Forbidden (pendiente de verificación).
6. El login exitoso devuelve JWT de acceso (24h) y refresh token en cookie httpOnly.
7. Acceder a un endpoint protegido sin token devuelve 401 Unauthorized.
8. Acceder a un endpoint con rol insuficiente devuelve 403 Forbidden.
9. La contraseña nunca se almacena en texto plano (bcrypt).
10. Solo `superadministrador` y `administrador de barbería` pueden crear/asignar roles.
11. Rate limiting aplicado en login y registro.
12. Los tiempos se guardan en UTC (principio de horas en UTC).
13. El dinero no aplica en este ciclo.

## Calidad visual

- Pantalla de registro: formulario con campos de nombre, correo, contraseña, confirmación de contraseña, selector de rol y selector de barbería. Mensajes de error inline.
- Pantalla de inicio de sesión: formulario con correo y contraseña, mensaje si el correo no está verificado, enlace a registro y a "olvidé mi contraseña".
- Pantalla de verificación de correo: ingreso del token recibido por correo.
- Pantalla de reset de contraseña: ingreso de correo para solicitar reset, y formulario con token para nueva contraseña.
- Pantalla de perfil: lectura de nombre, correo, rol y barbería asociada.
- Pantalla de listado de usuarios (solo superadministrador): tabla con usuarios y sus roles.
- Pantalla de cambio de rol (solo admin/superadmin): selector de usuario y nuevo rol.
- Diseño responsive (móvil 375 px y escritorio).
- Textos en español.
- Paleta y componentes de shadcn/ui + Tailwind CSS.

## Datos de prueba (seed)

- Barbería de prueba: "Barbería Central" (debe existir antes de registrar usuarios).
- Usuario superadministrador: `admin@barberia.com` / contraseña segura de prueba.
- Usuario cliente de ejemplo: `cliente@barberia.com` / contraseña de prueba.

> Estos datos se usan solo en modo desarrollo/pruebas. El correo se envía a Mailpit, nunca a direcciones reales.
