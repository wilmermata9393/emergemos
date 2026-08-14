# Controles de seguridad y HIPAA

Este documento explica qué protege el software **hoy** y qué falta para poder
manejar pacientes reales de forma legal. Léelo con calma — es la parte más
importante de un sistema de salud.

## Idea clave

HIPAA no es una casilla que el software "tiene". Es una combinación de:

1. **Controles técnicos** — los construye el software (esto es lo que hacemos aquí).
2. **Controles administrativos** — políticas, capacitación, contratos, respaldos.
3. **Controles físicos** — dónde viven los servidores y quién los toca.

El software puede hacer excelente el punto 1, pero los puntos 2 y 3 dependen de
ti y de tu proveedor de hosting. **Antes de manejar pacientes reales necesitas
asesoría legal/consultoría de HIPAA.**

---

## Controles técnicos ya implementados (Fase 0)

| Control HIPAA | Cómo lo cumplimos |
|---|---|
| Control de acceso único por usuario | Cada persona tiene su propia cuenta (`User`). |
| Acceso mínimo necesario (RBAC) | Roles (ADMIN, STAFF, PROVIDER, STUDENT, PATIENT); cada ruta declara quién entra. |
| Contraseñas protegidas | Se guardan con hash **bcrypt**, nunca en texto plano. |
| Protección contra fuerza bruta | Bloqueo temporal tras 5 intentos fallidos. |
| Registro de auditoría | Tabla `AuditLog` de **solo-inserción**: quién vio/cambió qué, cuándo y desde qué IP. |
| Cabeceras de seguridad HTTP | `helmet` activado en el servidor. |
| Validación de entradas | Todo dato entrante se valida y se rechaza lo desconocido. |
| **Cifrado de archivos en reposo** | Documentos y plan médico se guardan cifrados con **AES-256-GCM**; nunca en texto plano. Descarga solo con sesión válida y queda auditada. |
| **Cifrado de campos sensibles** | Campos como el nº de miembro del seguro se cifran (AES-256-GCM) en la base de datos. |
| **Cierre de sesión por inactividad** | Cierre automático tras 15 min sin actividad (web y portal). |
| **Rate limiting** | Límite de intentos de inicio de sesión (anti-fuerza bruta a nivel de red). |
| **Renovación segura de sesión** | Tokens de acceso cortos + refresco con rotación (se revoca el token usado). |
| Firma de notas con bloqueo | Solo el autor firma; al cerrarse se bloquea y las enmiendas quedan versionadas. |

---

## Controles técnicos pendientes (próximas fases)

- **Cifrado de campos sensibles** en la base de datos (AES-256 a nivel de app)
  — la infraestructura de cifrado ya existe (usada para archivos); falta
  aplicarla a campos como `memberId`.
- **Cierre de sesión automático** por inactividad (variable ya prevista:
  `SESSION_IDLE_TIMEOUT_MINUTES`); se aplica en el frontend en la Fase 1/2.
- **Almacenamiento cifrado de archivos** (tarjetas de seguro, documentos, firmas)
  en un bucket con BAA — en la base solo se guarda una referencia, no el archivo.
- **Cifrado en tránsito (HTTPS/TLS)** en producción.
- **Autenticación de dos factores (2FA)** para el personal.
- **Telemedicina en producción**: el video WebRTC ya viaja cifrado (DTLS-SRTP),
  pero para funcionar en cualquier red y cumplir HIPAA se necesitan servidores
  TURN propios o un proveedor de video con BAA (Daily, Twilio, Vonage/Zoom
  Healthcare). La arquitectura de señalización ya está lista para conectarlos.
- **Respaldo y recuperación** automáticos de la base de datos.

---

## Fuera del código (tu responsabilidad antes de lanzar)

- [ ] Firmar un **BAA** (Business Associate Agreement) con el proveedor de hosting
      (AWS, Google Cloud y Azure lo ofrecen).
- [ ] Firmar BAA con cualquier servicio externo que toque datos de pacientes
      (proveedor de video para telemedicina, envío de SMS, correo, etc.).
- [ ] Políticas escritas: privacidad, respuesta a incidentes, retención de datos.
- [ ] Capacitación del personal en manejo de PHI.
- [ ] Evaluación de riesgos formal (Security Risk Assessment).
- [ ] Asesoría legal especializada en HIPAA.

> Nada de esto reemplaza la consulta con un profesional legal. Este documento es
> una guía de ingeniería, no asesoría legal.
