# Mi Salud — App móvil (paciente)

App nativa (Android/iOS) del portal del paciente, hecha con **Expo + expo-router**.
Reutiliza la misma API del backend.

## Cómo correrla (desarrollo)

### 1. Encuentra la IP de tu computadora (LAN)
El teléfono NO puede usar `localhost`: necesita la IP de tu máquina en tu red.
En Windows (PowerShell):

```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' }).IPAddress
```

### 2. Configura la URL de la API
Edita `app.json` → `expo.extra.apiUrl` y pon tu IP, por ejemplo:

```json
"apiUrl": "http://192.168.1.50:4000/api"
```

### 3. Arranca el backend (en la carpeta raíz del proyecto)
```bash
npm run api:dev
```
El backend ya escucha en todas las interfaces, así que el teléfono lo alcanzará
por la IP de tu computadora (misma red Wi-Fi).

### 4. Arranca la app móvil
```bash
cd apps/mobile
npm start
```
Escanea el código QR con la app **Expo Go** (App Store / Google Play) en tu
teléfono. La app abrirá en tu celular.

### Usuarios de prueba (paciente)
- Teléfono: `+17875551234` · Contraseña: `Paciente123!`

## Estado
Pantallas incluidas: **login, inicio, citas, recetas, diario**. Reutilizan la
API existente. Faltan (para siguientes iteraciones): mensajes, agendar cita,
consentimientos y notificaciones push.

> Esta app comparte la MISMA base de datos y API que la versión web.
