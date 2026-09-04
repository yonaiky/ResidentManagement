# Fase 1 — Auditoría y Estabilización del Núcleo

> Documento completado al cierre de Fase 1 (2026-03-02).

## Mapa del sistema

| Capa | Tecnología | Ubicación |
|------|-----------|-----------|
| Frontend + API | Next.js 13 App Router | `app/`, `components/` |
| ORM | Prisma 6.9 | `prisma/schema.prisma` |
| Base de datos | PostgreSQL (Supabase) | `DATABASE_URL` |
| Autenticación | Supabase Auth SSR | `lib/supabase/` |
| Multi-tenant | Cookies + TenantMembership | `lib/tenant/` |
| Organizaciones | Organization + OrganizationMembership | `prisma/schema.prisma` |
| Auditoría | AuditLog centralizado | `lib/audit/log.ts` |
| Tests | Vitest | `tests/` |

### Modelo de datos (post Fase 1)

```
Tenant (cuenta SaaS)
  ├── Organization (unidad operativa)
  │     └── Property (residencial)
  │           └── Structure → Unit
  ├── TenantMembership (rol SaaS)
  ├── OrganizationMembership (rol por org)
  ├── Resident → UnitOccupancy → Unit
  └── Payment, Token, AuditLog, ...
```

---

## Inventario de funcionalidades

| Área | Estado | Implementación | Problemas | Acción |
|------|--------|----------------|-----------|--------|
| Multi-tenant | ✅ Corregido | `Tenant`, cookies, `requireTenantAuth` | Rutas legacy sin filtro | **Corregido P0** |
| Organizaciones | ✅ Corregido | `Organization` + migración 1:1 | Antes `Tenant`=org en UI | **Implementado** |
| Selector de organización | ✅ Corregido | `tenant-switcher.tsx` | Ignoraba cookie activa | **Corregido P1** |
| Unidades | ✅ Implementado | `Unit`, CRUD scoped | — | Documentado |
| Estructuras | ✅ Implementado | `Structure` árbol | — | Documentado |
| Residentes | ✅ Corregido | `Resident` completo | `residents/[id]` sin auth | **Corregido P0** |
| Relación residente-unidad | ✅ Implementado | `UnitOccupancy` + `OccupancyHistory` | DELETE cascade pagos | **Bloqueado P1** |
| Usuarios | ✅ Implementado | Supabase + Profile + memberships | Doble sistema roles legacy | Parcial P2 |
| Roles/Permisos | ✅ Corregido | Tenant + Organization membership | Sin rol por org antes | **OrganizationMembership** |
| Pagos | ✅ Corregido | `Payment` + `createdById` | PUT/DELETE sin auth | **Corregido P0/P1** |
| Cuotas | 🔴 No implementado | — | Sin entidad Fee | P4 |
| Recibos | 🟡 Parcial | PDF client-side | Sin persistencia | P4 |
| Mora | 🟡 Parcial | Config only | No calculada | P4 |
| Gastos | 🔴 No implementado | — | Sin entidad Expense | P4 |
| Reportes | ✅ Corregido | UI + API scoped | API sin auth | **Corregido P0** |
| Dashboard | 🟡 Parcial | Tenant-scoped | Mezcla tenant/property | P2 |
| Auditoría | ✅ Corregido | `AuditLog` + helper | Sin log central | **Implementado P1** |

---

## Tests anti-fuga

**Framework:** Vitest 2.x  
**Suite:** `tests/integration/tenant-isolation/cross-tenant.test.ts`

| Prueba | Resultado |
|--------|-----------|
| TenantA GET ResidentB | 404 ✅ |
| TenantA DELETE ResidentB | 404 ✅ |
| TenantA GET ResidentA | 200 ✅ |
| TenantA GET TokenB | 404 ✅ |
| Pending payments solo TenantA | ✅ |
| Reports sin auth | 401 ✅ |

**Unit tests:** `tests/unit/tenant-scope.test.ts` — 5 passed

---

## Problemas corregidos (P0/P1)

### P0 — Seguridad
- `GET/DELETE /api/residents/[id]` — auth + tenant scope
- `GET/PUT/DELETE /api/tokens/[id]` y `tokens/route` PUT/DELETE
- `PUT/DELETE /api/payments` — requireTenantManager + scope
- `GET /api/payments/pending`, `/recent` — tenant scope
- `POST /api/payments/check-overdue`, `/send-reminders` — tenant scope
- `GET /api/reports` — requireTenantAuth + tenantId en queries
- `GET /api/activities` — tenant scope
- `GET /api/residents/[id]/payments`, `/tokens`, `/send-alert`
- `POST /api/fiscal-config/upload-logo` — requireTenantManager
- `PATCH /api/parking/*/[id]` — IDOR corregido (fines, vehicles, assignments, visits, spots)
- `POST /api/whatsapp/send`, `/bulk-send` — tenant scope

### P1 — Núcleo
- Entidad `Organization` + `OrganizationMembership` + cookie `rm-organization-id`
- Migración backfill 1:1 (`scripts/sql/fase1-organization-backfill.sql`)
- `TenantSwitcher` lee `currentTenantId` de cookies
- `GET /api/tenant/context` devuelve contexto activo
- DELETE residente bloqueado si tiene pagos
- `Payment.createdById` en creaciones
- `AuditLog` + `lib/audit/log.ts`

---

## Flujo financiero actual

```
Resident.paymentStatus (manual)
    ↓
Payment (registro manual + createdById)
    ↓
invoice-generator.ts (PDF efímero)
```

**Objetivo futuro:** CUOTA → CARGO → PAGO → RECIBO → SALDO → MORA (P4)

---

## Pendientes clasificados

### P2
- Dashboard mezcla scopes tenant/property
- Monto 700 hardcodeado en dashboard/WhatsApp
- `mergePropertyWhere` subutilizado
- Unificar roles legacy (`Profile.role` vs membership)

### P3/P4
- Módulos secundarios (Hikvision, WhatsApp avanzado, pagos online, portal residente, reservas, facturación electrónica)
- Fee/Charge/Receipt/Expense/Mora automática
- RLS en PostgreSQL

---

## Siguiente fase recomendada (Fase 2)

1. Adoptar `organizationId` progresivamente en queries de residentes, pagos y reportes
2. Separar dashboard global (tenant) vs organización vs property
3. Implementar cuotas recurrentes (Fee) sobre el flujo Payment existente
4. Portal del residente (lectura de saldo y pagos propios)
5. CI con tests anti-fuga en pipeline

---

## Comandos de validación

```bash
npx prisma db push
npx prisma db execute --schema prisma/schema.prisma --file scripts/sql/fase1-organization-backfill.sql
npm run build
npm run test
npm run test:tenant
```
