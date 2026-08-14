# Roadmap por fases

Cada fase deja algo funcional que puedes probar. Las funciones vienen de tu
especificación original y están agrupadas para construirse en orden lógico.

---

## ✅ Fase 0 — Cimientos (COMPLETADA)
- [x] Monorepo TypeScript (base para web + móvil)
- [x] Modelo de datos: usuarios, roles, profesionales con/sin NPI, pacientes
- [x] Login por teléfono + contraseña con bloqueo por intentos fallidos
- [x] Control de acceso por roles (RBAC)
- [x] Registro de auditoría automático (HIPAA)

## ✅ Fase 1 — Núcleo clínico (COMPLETADA)
- [x] Vitales: 3 tomas de presión (mano izq./der.) y pulso con **promedio**
- [x] Peso (lb/kg) y estatura (m / pies-pulgadas) intercambiables
- [x] Saturación de oxígeno, temperatura (°F/°C), Fit profile
- [x] **BMI automático** + clasificación adulto + datos de curvas del CDC
- [x] Percentiles **pediátricos** BMI/peso/estatura según edad (LMS del CDC)
- [x] **Alertas de valores pánico** (presión, temperatura, SpO2, BMI)
- [x] Endpoint de curvas de crecimiento para graficar
- [x] **App web** (Next.js): login, lista/registro de pacientes, formulario de vitales, historial con alertas en rojo y gráfica de crecimiento del CDC
- [x] **Notas / Chart con firma del creador** y bloqueo al cerrar + enmiendas con historial de versiones. Plantillas por disciplina: medicina interna, nutrición (prescripción de alimentos), quiropráctica (diagrama del cuerpo), psicología. Plan de seguimiento con fecha automática.
- [x] **Registro demográfico ampliado** (dirección, contacto de emergencia) + **subida del plan médico** (frente/reverso) y **documentos** (laboratorios, resultados), con archivos **cifrados en disco (AES-256-GCM)** y descarga auditada
- [x] Próxima cita con **fecha y hora exactas** (calendario) en el plan de seguimiento
- [x] **App móvil (Expo)** — portal del paciente nativo Android/iOS (login, inicio, citas, recetas, diario); reutiliza la API. Ver `apps/mobile/README.md`. (Pantallas de mensajes/booking/consentimientos y push: pendientes)

## 🟢 Fase 2 — Portal del paciente (núcleo COMPLETADO)
- [x] Acceso súper simple (teléfono + contraseña), portal accesible para 45+ y padres/madres
- [x] Diario: fecha, hora, síntomas, medicamentos/suplementos, estado de ánimo (con emojis)
- [x] Envío seguro de documentos (laboratorios, imágenes, PDF) — cifrados
- [x] Mensajería con doctores y staff, con **selección de asunto**, ida y vuelta
- [x] Sección educativa (enlaces confiables)
- [x] Vista organizada de recetas/laboratorios ordenados (portal, Fase 4)
- [ ] Recordatorios de cita + confirmar / reagendar (se conecta con la Agenda, Fase 3)
- [ ] App descargable (Expo) — versión web ya lista

## 🟢 Fase 3 — Agenda y Online Booking (núcleo COMPLETADO)
- [x] Disponibilidad semanal por profesional → refleja automático en los horarios de booking
- [x] Online Booking: servicios (nombre, duración, precio), profesionales (bio/disciplina), horarios libres calculados
- [x] Paciente agenda cita + confirmar / solicitar reagenda / cancelar
- [x] Agenda del profesional (ver citas del día, confirmar/realizar/cancelar)
- [x] Bloqueos: vacaciones, enfermedad, días de fiesta, breaks (lactancia, café, salud)
- [x] Validación anti-solapamiento de citas
- [x] **Recordatorios de cita automáticos** + **avisos de cumpleaños** (paciente y staff) vía scheduler + bandeja in-app. Email/SMS quedan como adaptadores listos para un proveedor con BAA.

## 🟢 Fase 4 — Órdenes y plantillas (núcleo COMPLETADO)
- [x] Órdenes de laboratorio tipo **checklist** (catálogo de 15 pruebas, autogeneradas)
- [x] Órdenes de medicamentos con **firma protegida por credencial** (re-verifica contraseña; solo PROVIDER con NPI)
- [x] Recetas y labs visibles y organizados en el portal del paciente
- [x] Plantillas por disciplina (hechas en Fase 1): nutrición (alimentos), medicina interna, quiropráctica (diagrama), psicología
- [x] Infraestructura de notificaciones automáticas (recordatorios/cumpleaños in-app; seguimiento por el mismo sistema). Envío por SMS/correo requiere proveedor con BAA.

## 🟢 Fase 5 — Telemedicina (núcleo COMPLETADO)
- [x] Videollamada individual (WebRTC, video cifrado DTLS-SRTP, cámara/micrófono/colgar)
- [x] Servidor de señalización propio (socket.io) autenticado con JWT + salas por cita
- [x] Soporte técnico grupal (mesh de varios participantes) y agendado por modalidad (presencial/telemedicina)
- [x] Botón "Unirse a videollamada" en citas de telemedicina (paciente y equipo)
- [ ] Producción: servidores TURN o proveedor de video con BAA; clases con lista de inscritos (enrollment)

## 🟢 Fase 6 — Consentimientos (núcleo COMPLETADO)
- [x] Consentimientos remotos con **firma manuscrita (canvas), fecha, hora e IP** (récord electrónico, HIPAA, derechos, ciberseguridad)
- [x] **Envío automático** de los consentimientos estándar al crear el paciente
- [x] Evaluación inicial que **dispara consentimientos adicionales** según respuestas
- [x] Firma guardada como imagen **cifrada**; el equipo ve el estado en la ficha
- [ ] Endurecimiento final + revisión HIPAA legal + texto legal definitivo (con abogado)

---

### Referencias de inspiración
- Jane App (Telehealth)
- NeoMed
