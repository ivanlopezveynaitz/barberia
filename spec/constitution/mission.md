# Misión — Barbería multi-sucursal

## Qué es
Una aplicación web que ayuda a barberías y a sus clientes a agendar, cobrar y controlar citas mediante reservas con pago anticipado y una caja integrada.

## Alcance
- Varias barberías gestionan barberos, servicios, horarios y caja.
- Los clientes reservan y pagan por adelantado.
- Cada cita se confirma solo cuando Stripe notifica el pago mediante webhook.

## Roles
- **Superadministrador**: gestiona todas las barberías del sistema.
- **Administrador de barbería**: configura su barbería, servicios, barberos y horarios.
- **Barbero**: gestiona sus citas y disponibilidad.
- **Recepción / Caja**: gestiona citas, pagos y corte de caja.
- **Cliente**: reserva citas y paga por adelantado.

## Objetivo didáctico
Un ciclo SDD (Spec-Driven Development) completo por funcionalidad, desde la misión hasta el despliegue en Render.
