# Usuario técnico de demostración

## Credenciales

| Campo | Valor |
|-------|--------|
| **Email** | `tecnico.demo@residencial.test` |
| **Contraseña** | `DemoTecnico2026!` |
| **Usuario** | `tecnico_demo` |
| **Rol** | `technician` |

## Qué incluye

- Acceso solo a **Mis asignaciones** (`/tickets`)
- Un ticket de ejemplo asignado: **TKT-2026-DEMO1** — *Fuga de agua en apto 3B (demo)*

## Iniciar sesión

1. Abre http://localhost:3000/login
2. Usa el email y contraseña de arriba (o el usuario `tecnico_demo` si el login acepta identificador)
3. Deberías entrar directo a Mantenimiento con un ticket en estado **Asignado**

## Recrear el demo

**Opción A — Script (requiere `SUPABASE_SERVICE_ROLE_KEY` en `.env`):**

```bash
npm run seed:demo-technician
```

**Opción B — SQL en Supabase:**

Ejecuta el archivo [`prisma/seed-demo-technician.sql`](../prisma/seed-demo-technician.sql) en el SQL Editor.
