# Principios innegociables

1. **Horas en UTC**: se guardan en UTC y se muestran en la zona horaria de la barbería.
2. **Dinero en centavos**: siempre enteros en centavos, nunca decimales.
3. **Sin doble reserva**: se evita con una restricción en la base de datos, no solo con validación en pantalla.
4. **Confirmación solo por webhook de Stripe**: una cita se confirma solo cuando Stripe notifica el pago, nunca al regresar el cliente a la página.
5. **Aislamiento por barbería**: toda consulta filtra por la barbería del usuario autenticado.
6. **Interfaz en español**: todos los textos de la interfaz están en español.
7. **Solo llaves de prueba de Stripe**: nunca usar claves de producción en desarrollo.
8. **Sin secretos en el repositorio**: nunca guardar claves, tokens ni datos personales.
9. **Sin correos reales en desarrollo**: el correo se envía a Mailpit, nunca a direcciones reales.
10. **No borrar migraciones aplicadas**: las migraciones de base de datos ya aplicadas no se eliminan.
