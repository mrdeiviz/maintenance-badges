  📋 Próximos Pasos para Poner en Marcha:

  1. Configurar PostgreSQL:
  # Opción 1: Docker
  docker run -d \
    --name maintenance-postgres \
    -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=maintenance_badges \
    -p 5432:5432 \
    postgres:16-alpine

  # Opción 2: Local
  createdb maintenance_badges

  2. Crear GitHub OAuth App:
    - Ve a: https://github.com/settings/developers
    - Click "New OAuth App"
    - Homepage URL: http://localhost:3000
    - Callback URL: http://localhost:3000/auth/github/callback
    - Guarda Client ID y Client Secret
  3. Crear archivo .env:
  cp .env.example .env

  Luego edita .env con tus valores:
  GITHUB_OAUTH_CLIENT_ID=Iv1.tu_client_id
  GITHUB_OAUTH_CLIENT_SECRET=tu_client_secret
  DATABASE_URL=postgresql://postgres:password@localhost:5432/maintenance_badges
  ENCRYPTION_SECRET=$(openssl rand -base64 32)
  SESSION_SECRET=$(openssl rand -base64 32)

  4. Ejecutar migraciones:
  npx prisma migrate dev --name init

  5. Iniciar servicios:
  # Redis
  docker run -d -p 6379:6379 redis:7-alpine

  # App
  npm run dev

  6. Probar el flujo:
    - Visita http://localhost:3000
    - Click "Connect with GitHub"
    - Autoriza la app
    - ¡Obtén tu badge URL!

  🎯 Cómo Funciona Ahora:

  Usuario → Landing Page → "Connect GitHub"
     ↓
  GitHub OAuth → Usuario autoriza
     ↓
  Callback → Guardar token encriptado en PostgreSQL
     ↓
  Badge URL generada → /badge/github/{username}/5000
     ↓
  Cuando se carga el badge:
    1. Buscar token del usuario en BD
    2. Usar ESE token para consultar sponsors
    3. Generar SVG con progreso
    4. Cache por 5 minutos

  🔒 Seguridad Implementada:

  - ✅ Tokens encriptados con AES-256
  - ✅ Protección CSRF con state tokens
  - ✅ Validación de state en callback
  - ✅ Tokens en BD, nunca en URLs
  - ✅ Rate limiting configurado
  - ✅ Helmet para headers de seguridad
