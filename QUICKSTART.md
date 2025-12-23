# 🚀 Quickstart - Maintenance Badge Local Testing

Guía completa para ejecutar el proyecto localmente en Windows.

## Requisitos Previos

- ✅ Node.js 22+ (ya lo tienes instalado)
- ⏳ Docker Desktop (necesitas instalarlo)
- ⏳ GitHub Personal Access Token (debes generarlo)

---

## Paso 1: Instalar Docker Desktop

### Opción A: Instalar Docker (Recomendado)

1. **Descargar Docker Desktop:**
   - Ve a: https://www.docker.com/products/docker-desktop/
   - Descarga la versión para Windows
   - Ejecuta el instalador `Docker Desktop Installer.exe`

2. **Instalar:**
   - Acepta los términos
   - Asegúrate de seleccionar "Use WSL 2 instead of Hyper-V" (recomendado)
   - Click en "Ok" e "Install"

3. **Reiniciar:**
   - Reinicia tu computadora cuando te lo pida

4. **Verificar instalación:**
   ```bash
   docker --version
   # Debería mostrar: Docker version 24.x.x, build...
   ```

5. **Iniciar Docker Desktop:**
   - Abre Docker Desktop desde el menú de inicio
   - Espera a que el ícono en la bandeja del sistema deje de parpadear

### Opción B: Usar Upstash (Sin Docker)

Si prefieres no instalar Docker, puedes usar Redis en la nube gratis:

1. Ve a https://console.upstash.com/
2. Crea una cuenta gratuita
3. Click en "Create Database"
4. Selecciona región más cercana (ej: `us-east-1`)
5. Copia el **REST URL** que aparece
6. Guarda también el **password** si lo pide

**Salta al Paso 3** si eliges esta opción.

---

## Paso 2: Iniciar Redis con Docker

Una vez que tengas Docker instalado:

```bash
# 1. Crear y ejecutar contenedor Redis
docker run -d --name maintenance-badge-redis -p 6379:6379 redis:7-alpine

# 2. Verificar que está corriendo
docker ps | grep redis

# Deberías ver algo como:
# CONTAINER ID   IMAGE           STATUS         PORTS
# abc123def456   redis:7-alpine  Up 10 seconds  0.0.0.0:6379->6379/tcp
```

**Comandos útiles para Redis:**
```bash
# Ver logs de Redis
docker logs maintenance-badge-redis

# Detener Redis
docker stop maintenance-badge-redis

# Iniciar Redis (si ya existe)
docker start maintenance-badge-redis

# Eliminar contenedor
docker rm -f maintenance-badge-redis
```

---

## Paso 3: Crear GitHub Personal Access Token

1. **Ir a GitHub Settings:**
   - Ve a https://github.com/settings/tokens/new
   - O navega: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

2. **Configurar el token:**
   - **Note:** `Maintenance Badge Local Dev`
   - **Expiration:** 90 days (o sin expiración para dev)
   - **Scopes:** Selecciona:
     - ✅ `read:org` - Read org and team membership, read org projects
     - ✅ `read:user` - Read ALL user profile data

3. **Generar:**
   - Click en "Generate token" (botón verde al final)
   - **¡COPIA EL TOKEN AHORA!** Se ve como: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - No podrás verlo de nuevo

---

## Paso 4: Crear Archivo .env

En la carpeta raíz del proyecto (`C:\Users\david\Desktop\Dev\sponsor-bagde\`):

```bash
# 1. Copiar el template
cp .env.example .env

# 2. Abrir .env con tu editor favorito
code .env
# o
notepad .env
```

**Edita el archivo .env:**

### Si usas Docker (Paso 2):

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=debug

# PEGA TU TOKEN AQUÍ (reemplaza ghp_xxx...)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Redis local con Docker
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

CACHE_DEFAULT_TTL=300
CACHE_MAX_TTL=3600

RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

ALLOWED_ORIGINS=*
```

### Si usas Upstash (Opción B del Paso 1):

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=debug

# PEGA TU TOKEN AQUÍ
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Redis en Upstash (usa tu URL de Upstash)
REDIS_URL=rediss://your-database-name.upstash.io:6379
REDIS_PASSWORD=tu_password_de_upstash

CACHE_DEFAULT_TTL=300
CACHE_MAX_TTL=3600

RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

ALLOWED_ORIGINS=*
```

**Guarda el archivo.**

---

## Paso 5: Iniciar el Servidor

```bash
# Asegúrate de estar en la carpeta del proyecto
cd C:\Users\david\Desktop\Dev\sponsor-bagde

# Iniciar servidor en modo desarrollo
npm run dev
```

**Deberías ver:**

```
[12:34:56] INFO: Redis connected
[12:34:56] INFO: Server started successfully
    port: 3000
    host: "0.0.0.0"
    nodeEnv: "development"
```

**✅ El servidor está corriendo en:** `http://localhost:3000`

---

## Paso 6: Probar el Servidor

### 6.1 Test: Health Check

**En otra terminal (deja el servidor corriendo):**

```bash
curl http://localhost:3000/health
```

**Deberías ver algo como:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-21T...",
  "uptime": 12.345,
  "services": {
    "redis": {
      "connected": true
    },
    "github": {
      "accessible": true,
      "rateLimit": {
        "remaining": 4999,
        "limit": 5000,
        "reset": "2025-12-21T..."
      }
    }
  },
  "cache": {
    "hits": 0,
    "misses": 0,
    "total": 0,
    "hitRate": "0.00%"
  },
  "platforms": ["github"]
}
```

**Si ves `"status": "ok"` → ✅ Todo funciona correctamente!**

### 6.2 Test: Generar Badge

Vamos a generar un badge de ejemplo con un usuario de GitHub que tiene sponsors:

```bash
# Generar badge para sindresorhus (creador de muchos paquetes npm)
curl http://localhost:3000/badge/github/sindresorhus/5000 -o test-badge.svg
```

**Abrir el badge:**

```bash
# Abrir con navegador por defecto
start test-badge.svg
```

**Deberías ver:**
- Un badge SVG con el formato: `Sponsors | $X / $5,000`
- Una barra de progreso en la parte inferior
- Color basado en el progreso (rojo/amarillo/verde)

### 6.3 Test: Badge en el Navegador

También puedes abrir directamente en el navegador:

```
http://localhost:3000/badge/github/sindresorhus/5000
```

**Prueba con diferentes parámetros:**

```
# Estilo "for the badge" (más grande)
http://localhost:3000/badge/github/sindresorhus/5000?style=for-the-badge

# Label personalizado
http://localhost:3000/badge/github/sindresorhus/5000?label=Support

# Combinando parámetros
http://localhost:3000/badge/github/sindresorhus/5000?style=for-the-badge&label=Monthly%20Goal

# Diferentes objetivos
http://localhost:3000/badge/github/sindresorhus/1000
http://localhost:3000/badge/github/sindresorhus/10000
```

### 6.4 Test: Con Tu Propio Usuario

Si tienes GitHub Sponsors activado:

```bash
# Reemplaza TU_USERNAME con tu usuario de GitHub
curl http://localhost:3000/badge/github/TU_USERNAME/1000 -o my-badge.svg
start my-badge.svg
```

### 6.5 Test: Caché

Prueba el sistema de caché:

```bash
# Primera vez (cache MISS - más lento)
curl http://localhost:3000/badge/github/sindresorhus/5000 -o badge1.svg -w "\nTime: %{time_total}s\n"

# Segunda vez (cache HIT - súper rápido)
curl http://localhost:3000/badge/github/sindresorhus/5000 -o badge2.svg -w "\nTime: %{time_total}s\n"
```

Deberías notar que la segunda llamada es **mucho más rápida**.

**Ver estadísticas de caché:**

```bash
curl http://localhost:3000/health | grep -A 5 "cache"
```

---

## Paso 7: Probar en un README

Crea un archivo `test-readme.md` en el proyecto:

```markdown
# Test Badge

## Funding Progress

![Maintenance](http://localhost:3000/badge/github/sindresorhus/5000)

## Multiple Goals

| Goal | Badge |
|------|-------|
| $1K  | ![](http://localhost:3000/badge/github/sindresorhus/1000) |
| $5K  | ![](http://localhost:3000/badge/github/sindresorhus/5000) |
| $10K | ![](http://localhost:3000/badge/github/sindresorhus/10000) |

## Different Styles

**Flat:**
![](http://localhost:3000/badge/github/sindresorhus/5000?style=flat)

**Flat Square:**
![](http://localhost:3000/badge/github/sindresorhus/5000?style=flat-square)

**For The Badge:**
![](http://localhost:3000/badge/github/sindresorhus/5000?style=for-the-badge)
```

Abre `test-readme.md` con tu editor o en GitHub para ver cómo se ven los badges.

---

## Troubleshooting

### ❌ Error: Redis connection error

**Problema:** El servidor no puede conectarse a Redis

**Solución:**

```bash
# Verificar que Redis está corriendo
docker ps | grep redis

# Si no está corriendo, iniciarlo
docker start maintenance-badge-redis

# O crear nuevo contenedor
docker run -d --name maintenance-badge-redis -p 6379:6379 redis:7-alpine
```

### ❌ Error: Invalid configuration

**Problema:** Variables de entorno incorrectas

**Solución:**
1. Verificar que `.env` existe
2. Verificar que `GITHUB_TOKEN` está configurado
3. Verificar que `REDIS_URL` es correcto

```bash
# Ver variables cargadas (sin mostrar valores sensibles)
cat .env | grep -v "TOKEN\|PASSWORD"
```

### ❌ Error: GitHub user not found

**Problema:** Usuario de GitHub no existe o no tiene sponsors

**Solución:**
- Usa un usuario que sabemos tiene sponsors: `sindresorhus`, `tj`, `kentcdodds`
- Verifica que el usuario existe en `https://github.com/USERNAME`

### ❌ Error: Port 3000 already in use

**Problema:** Otro proceso está usando el puerto 3000

**Solución:**

```bash
# Opción 1: Cambiar puerto en .env
PORT=3001

# Opción 2: Matar el proceso que usa el puerto (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID_AQUI> /F
```

### ❌ Badge muestra "Rate Limited"

**Problema:** Se alcanzó el límite de la API de GitHub

**Solución:**
- Espera 1 hora para que se resetee el límite
- Verifica que el `GITHUB_TOKEN` esté configurado correctamente
- El badge se recuperará automáticamente

---

## Comandos Útiles

### Servidor

```bash
# Iniciar en modo desarrollo (con hot reload)
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar versión compilada
npm start

# Detener servidor
Ctrl + C
```

### Docker Redis

```bash
# Iniciar Redis
docker start maintenance-badge-redis

# Detener Redis
docker stop maintenance-badge-redis

# Ver logs de Redis
docker logs maintenance-badge-redis

# Reiniciar Redis
docker restart maintenance-badge-redis

# Eliminar contenedor
docker rm -f maintenance-badge-redis
```

### Testing

```bash
# Health check
curl http://localhost:3000/health

# Ping
curl http://localhost:3000/ping

# Root info
curl http://localhost:3000/

# Badge básico
curl http://localhost:3000/badge/github/USERNAME/1000 -o badge.svg

# Badge con parámetros
curl "http://localhost:3000/badge/github/USERNAME/1000?style=for-the-badge" -o badge.svg
```

---

## ✅ Checklist de Verificación

Antes de continuar, verifica que:

- [ ] Docker Desktop está instalado y corriendo (o Upstash configurado)
- [ ] Redis contenedor está corriendo (`docker ps | grep redis`)
- [ ] Archivo `.env` existe con `GITHUB_TOKEN` válido
- [ ] Servidor inicia sin errores (`npm run dev`)
- [ ] `/health` endpoint retorna `"status": "ok"`
- [ ] Puedes generar un badge para `sindresorhus`
- [ ] El badge se visualiza correctamente en el navegador

---

## Próximos Pasos

Una vez que todo funcione localmente:

1. **Experimenta con diferentes usuarios y objetivos**
2. **Prueba los diferentes estilos de badges**
3. **Revisa los logs para entender el flujo**
4. **Lee la documentación completa:** `docs/USAGE.md`
5. **Considera deployment:** Railway o Fly.io (ver `README.md`)

---

## Recursos

- **Documentación completa:** `README.md`
- **Guía de uso:** `docs/USAGE.md`
- **Setup detallado:** `docs/LOCAL_SETUP.md`
- **Docker Desktop:** https://www.docker.com/products/docker-desktop/
- **Upstash (alternativa):** https://console.upstash.com/
- **GitHub Tokens:** https://github.com/settings/tokens

---

**¿Necesitas ayuda?** Abre un issue o consulta la documentación en `docs/`.

**¡Listo para probar! 🚀**
