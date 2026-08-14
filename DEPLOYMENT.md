# Guía de despliegue (demo en Render)

Esta guía sube la plataforma a **Render.com** (plan gratis): base de datos +
API + web. Sirve para **mostrarla y recibir feedback** con **datos de prueba**.

> ⚠️ **Solo datos ficticios.** No uses pacientes reales hasta tener hosting con
> BAA (requisito legal de HIPAA). Ver `docs/HIPAA.md`.
> El plan gratis "duerme" los servicios tras inactividad (la 1ª carga tarda
> ~30–60s) y **los archivos subidos se borran** al redeployar.

---

## Paso 1 — Subir el código a GitHub

Necesitas una cuenta gratis en https://github.com

En PowerShell, dentro de la carpeta del proyecto:

```powershell
git add .
git commit -m "Plataforma emergemos - versión demo"
```

Crea un repositorio **privado** en GitHub (botón "New repository"), NO lo
inicialices con README. Luego copia los comandos que te da GitHub, del estilo:

```powershell
git remote add origin https://github.com/TU-USUARIO/emergemos.git
git branch -M main
git push -u origin main
```

## Paso 2 — Generar el secreto de cifrado

Corre esto y **guarda el resultado** (lo necesitarás en el Paso 4):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Paso 3 — Crear los servicios en Render

1. Crea cuenta gratis en https://render.com (puedes entrar con GitHub).
2. **New → Blueprint**.
3. Conecta tu repositorio. Render detectará el archivo `render.yaml` y mostrará
   3 recursos: **rme-db**, **rme-api**, **rme-web**.
4. Pulsa **Apply**. Render empezará a crearlos (tarda unos minutos).

## Paso 4 — Rellenar las variables que faltan

Cuando terminen de crearse, tendrás dos URLs, por ejemplo:
- API: `https://rme-api.onrender.com`
- Web: `https://rme-web.onrender.com`

Ahora completa las variables (Render → cada servicio → **Environment**):

**En rme-api:**
- `FIELD_ENCRYPTION_KEY` = el valor de 64 caracteres del Paso 2
- `CORS_ORIGINS` = la URL de la web (ej. `https://rme-web.onrender.com`)

**En rme-web:**
- `NEXT_PUBLIC_API_URL` = la URL de la API **+ `/api`** (ej. `https://rme-api.onrender.com/api`)

Guarda y pulsa **Manual Deploy → Deploy latest commit** en **rme-web** (para que
tome la URL de la API).

## Paso 5 — Cargar los datos de prueba (una vez)

En Render → **rme-api → Shell**, corre:

```bash
npm run db:seed
```

Esto crea los usuarios de prueba.

## Paso 6 — ¡Listo! Entra y comparte

Abre la URL de la web y entra con:
- **Admin:** `+17870000001` / `Cambiar123!`
- **Doctora:** `+17870000002` / `Cambiar123!`
- **Paciente:** `+17875551234` / `Paciente123!`

Comparte la URL de la web con tu colega para que la revise.

---

## Notas importantes
- 🎥 **Telemedicina:** ahora funciona porque el sitio tiene **HTTPS**. Para
  llamadas entre redes muy restringidas se necesita un servidor **TURN** (o un
  proveedor de video con BAA).
- 📁 **Archivos:** en el plan gratis se borran al redeployar. Para conservarlos
  se usa almacenamiento de objetos (S3) — se configura cuando pases a producción.
- 💤 **Arranque lento:** la primera visita tras inactividad tarda; es normal en
  el plan gratis.
- 🔁 **Actualizar:** cada `git push` a `main` vuelve a desplegar automáticamente.
