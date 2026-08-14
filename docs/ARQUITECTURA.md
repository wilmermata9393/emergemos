# Arquitectura técnica

## Objetivo
Un solo producto que funcione en **web, Android e iOS**, reutilizando el máximo
de código para no construir la misma app tres veces.

## Decisiones y por qué

| Capa | Tecnología | Razón |
|---|---|---|
| Lenguaje | **TypeScript** en todo | Un solo lenguaje para backend, web y móvil. |
| Base de datos | **PostgreSQL** | Robusta, estándar en salud, soporta cifrado y auditoría. |
| ORM | **Prisma** | Modelo de datos claro y con tipos; migraciones seguras. |
| Backend | **NestJS** | Estructura ordenada, ideal para roles/permisos y crecer sin caos. |
| Web | **Next.js (React)** | Corre en cualquier navegador (compu y celular). *(Fase 1)* |
| Móvil | **Expo (React Native)** | Un código para Android e iOS; comparte lógica con la web. *(Fase 2+)* |
| Monorepo | **npm workspaces** | Reutilizar tipos, validaciones y reglas en todas las apps. |

## Estructura del monorepo

```
apps/
  api/         # Backend NestJS
  web/         # Next.js         (se agrega en Fase 1)
  mobile/      # Expo            (se agrega en Fase 2+)
packages/
  database/    # Esquema Prisma + cliente (compartido)
  (futuro) shared/  # Tipos y validaciones compartidos entre web y móvil
```

## Flujo de una petición segura

```
Cliente (web/móvil)
      │  token de sesión (JWT)
      ▼
[ JwtAuthGuard ]   ¿sesión válida?  ──no──► 401
      │ sí
      ▼
[ RolesGuard ]     ¿el rol puede?   ──no──► 403
      │ sí
      ▼
  Controlador  →  Servicio  →  Base de datos
      │
      ▼
[ AuditInterceptor ]  registra el acceso en AuditLog
```

## Sobre el hosting (producción)
Para pacientes reales, el backend y la base de datos deben vivir en un proveedor
que firme un **BAA** (AWS / Google Cloud / Azure). Los archivos (imágenes,
documentos, firmas) van en almacenamiento cifrado de objetos (ej. S3), y en la
base de datos solo se guarda una referencia. Ver [`HIPAA.md`](HIPAA.md).
