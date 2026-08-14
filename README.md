# Récord Médico Electrónico (RME)

Plataforma clínica (EMR/EHR) para telemedicina, documentación clínica, agenda y
portal de pacientes — construida con controles técnicos alineados a **HIPAA**.

> ⚠️ **Importante:** el software implementa los *controles técnicos* de HIPAA
> (cifrado, control de acceso por roles, auditoría, cierre de sesión, etc.),
> pero el **cumplimiento legal** requiere además hosting bajo un BAA, políticas
> administrativas y asesoría legal antes de manejar pacientes reales.
> Ver [`docs/HIPAA.md`](docs/HIPAA.md).

---

## Estado actual: Fase 0 — Cimientos ✅

Ya construido y funcionando:

- **Monorepo** con TypeScript (base para web y móvil compartiendo código).
- **Modelo de datos** (PostgreSQL + Prisma): usuarios con roles, profesionales
  con/sin NPI, pacientes, consentimientos, y registro de auditoría.
- **API (NestJS)** con:
  - Inicio de sesión (teléfono + contraseña) con bloqueo por intentos fallidos.
  - Control de acceso por roles (RBAC).
  - **Auditoría automática**: cada acceso a datos de pacientes queda registrado.

Ver el plan completo en [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Cómo correr el proyecto (desarrollo)

### 1. Requisitos
- Node.js 20+ · PostgreSQL 14+ (ya tienes 17.4) · npm

### 2. Configurar variables de entorno
Copia el archivo de ejemplo y rellena los valores.

**En Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**En Mac/Linux:**
```bash
cp .env.example .env
```

Genera los secretos (funciona igual en ambos):

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Pega el primero en `JWT_SECRET` y el segundo en `FIELD_ENCRYPTION_KEY` dentro de
`.env`. Y ajusta `DATABASE_URL` con tu usuario/contraseña de PostgreSQL.

> ℹ️ **Windows/PowerShell:** encadena comandos con `;` (no con `&&`). Ejemplo:
> `npm run db:migrate ; npm run db:seed`

### 3. Instalar dependencias

```bash
npm install
```

### 4. Crear la base de datos y las tablas

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

El *seed* crea dos usuarios de prueba (ver la consola al terminar).

### 5. Arrancar la API

```bash
npm run api:dev
```

La API queda en `http://localhost:4000/api`.

### 5b. Arrancar la app web (en otra terminal)

```
npm run web:dev
```

La web queda en `http://localhost:3000`. Inicia sesión con los usuarios de
prueba del *seed* (ej. teléfono `+17870000001`, clave `Cambiar123!`).
Necesitas la API corriendo al mismo tiempo.

### 6. Probar el inicio de sesión

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"+17870000002\",\"password\":\"Cambiar123!\"}"
```

---

## Estructura del proyecto

```
.
├── apps/
│   └── api/            # Backend NestJS (la API)
├── packages/
│   └── database/       # Modelo de datos Prisma (compartido)
├── docs/               # Documentación (HIPAA, arquitectura, roadmap)
├── .env.example        # Plantilla de configuración
└── package.json        # Monorepo (npm workspaces)
```

Las apps `web/` (Next.js) y `mobile/` (Expo) se agregan en las siguientes fases.

---

## Documentación

- [`docs/ROADMAP.md`](docs/ROADMAP.md) — plan por fases y funciones.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) — decisiones técnicas.
- [`docs/HIPAA.md`](docs/HIPAA.md) — controles de seguridad y qué falta para cumplir.
