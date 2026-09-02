# Fase 3 — Operación del Residencial

> Documento vivo. Auditoría inicial y resultados al cierre.

## Auditoría inicial

| Módulo | Estado | Implementación actual | Problemas | Acción |
|--------|--------|----------------------|-----------|--------|
| Tickets / Mantenimiento | 🟡 Parcial | `MaintenanceTicket`, comentarios, historial estados, Kanban, SLA | Sin `organizationId`, sin adjuntos, sin proveedor, SLA UI read-only | Extender |
| Proveedores | 🔴 No implementado | — | — | Crear |
| Vehículos | ✅ Implementado | `Vehicle` + APIs + UI parking | Sin `organizationId` | Añadir org scope gradual |
| Parqueos | ✅ Implementado | `ParkingSpot` + `ParkingAssignment` (start/end) | GET visits/assignments sin filtro tenant | Corregir P0 |
| Visitantes | 🟡 Parcial | `ParkingVisit` (ventana temporal) | Sin check-in/out, sin PIN/QR | Extender |
| Comunicados | 🔴 No implementado | Solo WhatsApp | — | Crear |
| Documentos | 🔴 No implementado | Solo logos fiscales | — | Crear |
| Áreas comunes / Reservas | 🔴 No implementado | — | — | Crear |
| Dashboard operativo | 🟡 Parcial | tickets + parking widgets | Sin visitantes/reservas/comunicados | Ampliar |

## Regla de reutilización

- Tickets: **reutilizar** estados/transiciones/SLA existentes (`open`, `urgent`, etc.)
- Visitantes: **extender** `ParkingVisit` (no crear Visitor duplicado)
- Parqueos: **reutilizar** `ParkingAssignment` con historial `endDate`
- Finanzas: reservas con costo → `Charge` ad-hoc de Fase 2

---

## Funcionalidades encontradas inicialmente

- Tickets de mantenimiento con Kanban, comentarios, historial de estados, SLA configurable por regla
- Parqueos: spots, vehículos, asignaciones con `startDate`/`endDate`, multas, visitas temporales
- Finanzas F2: Fee/Charge/Payment/Expense/AuditLog/Organization

## Funcionalidades reutilizadas

- `MaintenanceTicket` + `TicketStatusHistory` + `TicketComment` + transiciones en `lib/tickets/status.ts`
- `ParkingVisit` / `ParkingAssignment` / `Vehicle` / `ParkingSpot`
- `Expense` + `Charge` + `resolveOrganizationId` + `writeAuditLog` / `emitOpsEvent`
- Roles existentes (`requireTenantAuth`, `requireTenantManager`, parking/ticket auth)

## Funcionalidades modificadas

- Tickets: `organizationId`, `providerId`, adjuntos, eventos, SLA defaults por prioridad, reapertura desde `closed`
- Visitas: `tenantId`/`organizationId`, PIN (`accessCode`), check-in/out, filtro tenant en listados
- Asignaciones de parqueo: GET filtrado por `spot.tenantId`
- Gastos: `providerId` opcional
- Sidebar: enlaces a Operación, Proveedores, Áreas, Comunicados, Documentos

## Funcionalidades creadas

- `Provider`, historial vía relaciones (tickets + expenses)
- `Announcement` (DRAFT/PUBLISHED/ARCHIVED + audiencia)
- `DocumentAsset` (visibilidad + versión/`replacesId` + soft delete)
- `CommonArea` + `Reservation` (solape, horarios, reglas, cargo ad-hoc)
- Dashboard `/operations` + API `/api/operations/dashboard`
- Eventos internos `lib/operations/events.ts`

## Modelo de datos resultante (operativo)

```
Tenant → Organization
  ├─ MaintenanceTicket (+ TicketAttachment, Comment, StatusHistory, Provider?)
  ├─ Provider ← Expense, Tickets
  ├─ ParkingVisit (accessCode, checkedIn/Out)
  ├─ Announcement
  ├─ DocumentAsset (version chain)
  ├─ CommonArea → Reservation → Charge?
  └─ AuditLog (actividad reciente)
```

Estados ticket (sin renombrar): `open|assigned|in_progress|waiting|resolved|closed|cancelled`  
Prioridades: `low|medium|high|urgent`  
SLA default: urgent 4h / high 8h / medium 24h / low 72h  

Estados reserva: `PENDING|APPROVED|REJECTED|CANCELLED|COMPLETED`

## Endpoints

| Área | Rutas |
|------|--------|
| Tickets | existentes + `POST/GET /api/tickets/[id]/attachments`, download attachment |
| Proveedores | `/api/providers`, `/api/providers/[id]` |
| Visitas | `/api/parking/visits` (scoped), `.../check-in`, `.../check-out` |
| Comunicados | `/api/announcements`, `/api/announcements/[id]` |
| Documentos | `/api/documents`, `/api/documents/[id]` (download/soft-delete) |
| Áreas | `/api/common-areas` |
| Reservas | `/api/reservations` (GET/POST/PATCH approve\|reject\|cancel) |
| Dashboard | `/api/operations/dashboard` |
| Gastos | `providerId` en `POST /api/finance/expenses` |

## Permisos

- Backend: `requireTenantAuth` / `requireTenantManager` / parking & ticket auth
- Técnicos: solo tickets asignados (existente)
- Documentos ADMINS: roles admin/manager/tenant_admin
- Descarga valida tenant + org + visibilidad (no URL pública directa)

## Eventos

`TicketCreated`, `TicketAssigned`, `TicketResolved`, `TicketClosed`,  
`VisitorPreauthorized`, `VisitorCheckedIn`, `VisitorCheckedOut`,  
`ReservationCreated|Approved|Rejected|Cancelled`,  
`AnnouncementPublished`, `DocumentUploaded|Replaced`, `ProviderCreated`  

Persistidos en `AuditLog` (sin WhatsApp/email).

## Auditoría

Acciones sensibles de tickets, visitas, reservas, documentos y proveedores escriben `AuditLog`.  
La actividad reciente del dashboard lee esos eventos.

## Tests

- Unit: access code, horarios reserva, transiciones ticket (`tests/unit/operations-core.test.ts`)
- Integration F3: ticket org/historial, visitante PIN, solape+cargo, documento cross-tenant  
  (`tests/integration/operations/fase3.test.ts`)
- Suite total: **35 passed**

## Pendientes / deuda técnica

- `organizationId` aún opcional en tickets/visitas legacy (migración gradual)
- Vehículos/spots sin `organizationId` estricto (siguen por `tenantId`)
- UI de adjuntos en detalle de ticket aún básica (API lista)
- Segmentación de comunicados registrada pero sin portal residente
- Versionado de documentos solo vía `replacesId` (no UI de historial rica)
- Almacenamiento local `uploads/` (no object storage)
- Tests HTTP E2E de permisos API (hoy lógica de dominio + aislamiento Prisma)

## Criterios de aceptación (Fase 3)

| Criterio | Estado |
|----------|--------|
| TenantId / OrganizationId en módulos nuevos | ✅ |
| Permisos críticos en backend | ✅ |
| Sin fuga listados visits/assignments | ✅ |
| Historial tickets | ✅ |
| Entrada/salida visitantes | ✅ |
| Historial asignaciones parqueo (`endDate`) | ✅ (ya existía) |
| Reservas sin solape | ✅ |
| Documentos protegidos | ✅ |
| Cargos reserva → Charge F2 | ✅ |
| Auditoría acciones sensibles | ✅ |
| Build + tests | ✅ |

## Recomendación para Fase 4

No iniciar automáticamente. Prioridades sugeridas:

1. Portal residente (tickets propios, preautorizar visitas, reservas, ver comunicados/docs)
2. Notificaciones reales (WhatsApp/email) consumiendo eventos F3
3. Object storage + firmas URL temporales
4. Endurecer `organizationId` obligatorio en parking/vehículos
5. Contabilidad / e-CF / pasarela (fuera de operación diaria)

---

*Fase 3 cerrada: operación integrada con Tenant · Organization · Unit · Resident · Financial Core · AuditLog.*
