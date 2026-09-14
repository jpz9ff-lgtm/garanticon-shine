# Auditoría de seguridad Garanticon — plan de corrección

Objetivo: cerrar los puntos del informe del 14/09/2026 sin tocar pólizas, contratos, coberturas ni diseño. Trabajo por fases verificables, con pruebas sobre datos ficticios y sin acciones reales sobre clientes.

## Hallazgos ya comprobados en el código

- No existe ninguna referencia a `/~flock.js` en el proyecto: la analítica se inyecta desde el alojamiento/vista previa, no desde el código. Solo puedo controlarla vía cabeceras y política de cookies; el bloqueo total depende de configuración externa (marcado como no verificable desde aquí).
- El aviso de cookies guarda la elección pero **ninguna parte del código consulta esa elección**, y no hay forma de reabrir preferencias.
- `public/_headers` existe con CSP y frame-ancestors, pero **no está verificado que el alojamiento lo aplique**. Hay que comprobar las respuestas HTTP reales tras publicar.
- `index.html` usa `lang="en"`; no hay `sitemap.xml`.
- El botón flotante de WhatsApp abre un chat **sin destinatario** (falta el teléfono que sí usa la página de asistencia).
- Las tablas sensibles tienen RLS, pero varias políticas usan `roles:{public}` en lugar de `authenticated`, y no hay ninguna comprobación de servidor de `dealers.activo`: una sesión previa de una cuenta desactivada sigue pudiendo leer y escribir sus garantías por llamada directa.
- `resolve-username` es público y devuelve el email asociado a un usuario: confirma existencia de cuenta y expone correo antes de autenticar.
- El formulario de asistencia inserta directamente en `contacts` desde el navegador; los límites son solo temporizadores de interfaz.
- `lookup-warranty` devuelve el expediente completo (DNI, dirección, teléfono, email, precio) con solo matrícula + número de póliza.
- Las reglas del contrato (modalidad, límites, fechas, estado) se calculan en el navegador y se guardan tal cual; no hay validación de servidor.

## Fase 1 — Sin riesgo, inmediato

- `lang="es"`, `sitemap.xml` público, `robots.txt` con exclusión de rutas privadas (sin sustituir autorización), `noindex` en las páginas privadas.
- WhatsApp flotante con el teléfono correcto.
- Consentimiento real: un único módulo de consentimiento que expone el estado, bloquea medición no necesaria antes de aceptar y después de rechazar, y un enlace "Preferencias de cookies" en el pie para reabrir la elección. Inventario de cookies actualizado con `session-id` y proveedores reales.

## Fase 2 — Aislamiento y permisos (migraciones)

- Reescritura de políticas: todas a `authenticated` (salvo la inserción pública de asistencia si se conserva), `USING` y `WITH CHECK` explícitos por operación.
- Bloqueo en servidor de cuentas desactivadas: función `is_active_dealer(auth.uid())` incorporada a todas las políticas de `warranties` y `dealers`.
- Trigger que impide cambiar campos protegidos (`dealer_id`, `user_id`, `activo`, `numero_poliza`) desde el cliente.
- Revisión de `GRANT` mínimos, `SECURITY DEFINER` y `search_path` de cada función; retirada de grants innecesarios a `anon`.
- Validación de servidor de las reglas de contrato (modalidad/límite/fechas coherentes, estado) mediante trigger, y bloqueo de modificación de campos económicos tras emitir, con registro de cambios sin datos personales.

## Fase 3 — Consulta de clientes y documentos

- `lookup-warranty` pasa a devolver una respuesta mínima (modalidad, estado, vigencia) sin DNI, dirección, teléfono, email ni precio.
- Para contrato y datos completos: verificación del titular por código de un uso enviado al contacto ya registrado, con caducidad, límite de intentos y respuestas genéricas. El PDF se genera solo tras verificación, sin URL pública persistente.
- Límite de peticiones real en base de datos, no en memoria del proceso.

## Fase 4 — Autenticación y asistencia

- Política de contraseñas unificada (mínimo 15 caracteres sin MFA) en interfaz y servidor, bloqueo de contraseñas comprometidas, preparación de MFA para profesionales.
- `resolve-username` deja de devolver el email: la resolución ocurre dentro del propio inicio de sesión, con límites y errores genéricos.
- `update-dealer-credentials`: reautenticación reciente obligatoria, confirmación del nuevo correo, invalidación de sesiones.
- El formulario de asistencia pasa a una función de servidor con validación, antiautomatización, límites por origen, tamaños, escape e idempotencia; se retira la inserción anónima directa en el mismo cambio para que nada deje de funcionar.

## Fase 5 — Cabeceras y verificación

- CSP ajustada a las dependencias reales, primero en modo informe; `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Permissions-Policy`, `no-store` en respuestas privadas, conservando HSTS y `nosniff`.
- Comprobación de las cabeceras en respuestas HTTP de producción sobre acceso, recuperación, consulta y panel, con la vista previa funcionando.

## Fase 6 — Pruebas y evidencia

Entorno de prueba con dos concesionarios ficticios y pólizas ficticias. Matriz: anónimo, usuario sin concesionario, concesionario A, concesionario B, cuenta desactivada — sobre lectura, edición, descarga y atribución, tanto por la aplicación como por llamada directa. Entrego el resultado permitido/denegado de cada casilla.

## Depende de datos que no tengo

Necesito estos datos reales para cerrar la Fase 6 de privacidad; sin ellos no redacto textos legales inventados:

- Identificación del prestador: razón social, CIF, domicilio, registro mercantil y datos de contacto que deben figurar en privacidad, aviso legal y términos.
- Proveedores y transferencias reales a declarar, y plazos de conservación que aplica el negocio.
- Confirmación de que la nota interna de asesoría jurídica publicada debe retirarse.
- Teléfono correcto para el botón flotante de WhatsApp (uso el de asistencia si no se indica otro).

## No verificable desde aquí

Origen e inyección de `/~flock.js`, mecanismo de cabeceras del alojamiento y copias de seguridad/restauración: solo puedo comprobarlos contra respuestas reales de producción una vez publicado, y los marcaré como pendientes hasta entonces.
