# Resident Management System

Sistema de gestión de residentes para condominios.

## Requisitos

- Node.js 18 o superior
- Cuenta en [Supabase](https://supabase.com) (PostgreSQL + Auth)
- npm

## Configuración de Supabase

1. Crea un proyecto en Supabase.
2. **Authentication → Providers → Email**: activa **Confirm email**.
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (desarrollo) o tu dominio en producción
   - Redirect URLs: `http://localhost:3000/auth/callback` (y el equivalente en producción)
4. **Project Settings → Database**: copia las cadenas de conexión:
   - `DATABASE_URL` — Transaction pooler (puerto 6543, `?pgbouncer=true`)
   - `DIRECT_URL` — Conexión directa (puerto 5432) para migraciones
5. **Project Settings → API**: copia `URL`, `anon key` y `service_role key`.
6. Copia `.env.example` a `.env` y completa las variables.
7. En el **SQL Editor** de Supabase, ejecuta el contenido de [`prisma/supabase-auth-trigger.sql`](prisma/supabase-auth-trigger.sql).

## Configuración local

```bash
npm install
npx prisma generate
npx prisma migrate deploy   # o: npx prisma migrate dev
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Primer administrador

No existe admin por defecto. Crea uno con:

```bash
ADMIN_EMAIL=admin@tudominio.com ADMIN_PASSWORD=tu-password-seguro ADMIN_USERNAME=admin npx tsx scripts/seed-admin.ts
```

O regístrate en `/register` (rol `user`) y promueve el usuario en la tabla `Profile` desde Supabase SQL:

```sql
UPDATE "Profile" SET role = 'admin' WHERE email = 'tu@email.com';
```

## Autenticación

- **Registro público** (`/register`): solo crea usuarios con rol `user`. Requiere confirmar el email.
- **Login** (`/login`): email o nombre de usuario + contraseña.
- **Recuperar contraseña**: `/forgot-password` y `/reset-password`.
- **Gestión de usuarios** (`/users`): solo `admin` y `manager`; crear roles elevados solo `admin`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npx prisma studio` | Explorar base de datos |
| `npx prisma migrate deploy` | Aplicar migraciones (producción) |

## Despliegue en Coolify (VPS ~512 MB RAM)

La app no lleva Postgres ni Auth en el VPS: **Supabase** hace esa parte. El `Dockerfile` usa build **multi-stage** + salida **standalone** de Next.js para usar poca RAM en runtime.

### Variables en Coolify (Runtime)

| Variable | Notas |
|----------|--------|
| `DATABASE_URL` | Pooler Supabase (puerto **6543**, `?pgbouncer=true`) |
| `DIRECT_URL` | Conexión directa (puerto **5432**) — migraciones |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / JWT legacy |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.com` |
| `NODE_OPTIONS` | `--max-old-space-size=384` (recomendado) |

### Build args en Coolify (necesarios en el build)

| Build arg | Mismo valor que en runtime |
|-----------|---------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí |
| `NEXT_PUBLIC_APP_URL` | Sí |

### Checklist Supabase

1. **Authentication → URL Configuration**: Site URL y redirect `https://tu-dominio.com/auth/callback`
2. SQL de [`prisma/supabase-auth-trigger.sql`](prisma/supabase-auth-trigger.sql) ya ejecutado en el proyecto
3. Primer admin: `npm run seed:admin` en local o usuario creado en dashboard

### Recursos sugeridos en Coolify

- **Build**: si falla por RAM, activa build remoto o añade **1 GB swap** en el VPS
- **Runtime**: límite de memoria del contenedor ~**448–512 MB**

### Docker local (opcional)

```bash
docker compose up -d --build
```

Al arrancar: `prisma migrate deploy` y luego `node server.js` (standalone).

## Tecnologías

- Next.js 13 (App Router)
- Supabase Auth + PostgreSQL
- Prisma ORM
- Tailwind CSS + shadcn/ui
