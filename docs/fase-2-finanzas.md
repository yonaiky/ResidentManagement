# Fase 2 — Núcleo Financiero

> Completado. Backend es fuente de verdad para balances, mora y aplicaciones.

## Modelo anterior (pre Fase 2)

```
Resident.paymentStatus (pending/paid/overdue)
    ↓
Payment (amount Float, month, year, status completed)
    ↓
invoice-generator.ts (PDF efímero, NCF aleatorio)
```

**Ausente:** Fee, Charge, PaymentApplication, Receipt persistente, Expense, Balance ledger, mora calculada, créditos, anulación (solo hard DELETE).

### Equivalencias encontradas

| Concepto plan | Existía? | Equivalente |
|---------------|----------|-------------|
| Fee (cuota) | No | — |
| Charge (cargo) | No | Payment.month/year implícito |
| Payment | Sí | `Payment` |
| Receipt | Parcial | PDF client-side |
| Balance | No | Cálculo ad-hoc frontend |
| Mora | Parcial | `Resident.paymentStatus` + config |
| Expense | No | — |
| Responsible payer | Parcial | `UnitOccupancy.role` |

---

## Modelo final

```
Fee (definición de cuota)
  → Charge (deuda por unidad) [unique feeId+unitId = idempotente]
    → Payment (CONFIRMED | VOID)
      → PaymentApplication (monto aplicado a cada cargo)
      → Receipt (ISSUED | VOID, número REC-YYYY-###### por Organization)
    → UnitCredit (excedente / anticipo)
Expense (salida, entidad separada)
```

**Balance (backend):**
`sum(charges.outstandingAmount) - unitCredit.amount` (nunca negativo en UI de deuda)

**Jerarquía:** Tenant → Organization → Property → Unit → Charge/Payment

---

## Entidades y responsabilidades

| Entidad | Responsabilidad |
|---------|-----------------|
| `Fee` | Definición del cobro (ordinaria/extraordinaria, once/monthly) |
| `Charge` | Deuda individual por unidad; estados PENDING/PARTIAL/PAID/OVERDUE/CANCELLED |
| `Payment` | Dinero recibido; Decimal(18,2); VOID en lugar de DELETE |
| `PaymentApplication` | Cuánto de un pago se aplicó a cada cargo |
| `Receipt` | Comprobante inmutable ISSUED; anulación → VOID |
| `ReceiptSequence` | Numeración concurrente por organization+year |
| `UnitCredit` | Anticipo / crédito a favor |
| `Expense` | Gasto (salida de caja, no es Payment) |
| `UnitOccupancy.isResponsibleForPayment` | Responsable financiero |

---

## Flujo

```
Cuota (Fee)
  → generar cargos (idempotente)
  → Estado de cuenta / Balance
  → Pago (Payment)
  → Aplicación automática (vencidos más antiguos → pendientes más antiguos)
  → Recibo (Receipt)
  → Crédito si sobra
  → Mora derivada (dueDate < hoy && outstanding > 0)
  → Anulación (VOID) revierte aplicaciones y recibo
```

---

## Reglas

1. **Pagos parciales:** cargo → PARTIAL; outstanding = amount - aplicado.
2. **Créditos:** exceso de pago → `UnitCredit`; no se pierde.
3. **Aplicación automática:** vencidos ASC, luego pendientes ASC; o `chargeIds` explícitos.
4. **Anulaciones:** nunca DELETE físico; VOID + reverse applications + VOID receipt.
5. **Recibos:** no se editan; solo VOID.
6. **Idempotencia cargos:** `@@unique([feeId, unitId])`.
7. **Recurrencia:** `POST /api/finance/jobs/monthly-fees` crea Fee+charges si no existe el período.
8. **Montos:** `Decimal(18,2)` en Fee/Charge/Payment/Receipt/Expense/Credit.
9. **Permisos:** reutiliza `requireTenantAuth` / `requireTenantManager` (manager+ crea/anula).
10. **Numeración recibos:** por **Organization** → `REC-2026-000001`.

---

## APIs nuevas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/finance/fees` | Listar / crear cuota (+ generar cargos) |
| POST | `/api/finance/fees/[id]/generate` | Regenerar cargos (skip duplicados) |
| GET | `/api/finance/charges` | Listar cargos |
| GET/POST | `/api/finance/payments` | Listar / registrar pago + recibo |
| POST | `/api/finance/payments/[id]/void` | Anular pago |
| GET | `/api/finance/units/[unitId]/statement` | Estado de cuenta |
| GET | `/api/finance/receivables` | Cartera por cobrar |
| GET | `/api/finance/dashboard` | Métricas agregadas backend |
| GET/POST | `/api/finance/expenses` | Gastos |
| POST | `/api/finance/jobs/monthly-fees` | Job mensual idempotente |

Legacy `DELETE /api/payments` → VOID (no borra fila).

---

## UI

- `/finance` — dashboard financiero, crear cuota, cartera
- `/finance/units/[unitId]` — estado de cuenta + registro de pago
- Sidebar: enlace **Finanzas** (manager/admin)

---

## Auditoría

`writeAuditLog` en: create Fee, generate charges, create Payment, void Payment, create Expense.

---

## Tests

| Suite | Resultado |
|-------|-----------|
| `tests/unit/finance-money.test.ts` | 8 passed |
| `tests/integration/finance/flow.test.ts` | 6 passed (full, partial, multi-charge, void, credit, idempotency) |
| Tenant isolation + scope | 11 passed |
| **Total** | **25 passed** |

---

## Pendientes (Fase 3 sugerida)

- Contabilidad formal / plan de cuentas
- e-CF / DGII / NCF real desde FiscalConfig
- Pasarelas de pago
- Export Excel/PDF de cartera
- Portal del residente (ver saldo propio)
- Aplicar crédito automáticamente a nuevos cargos
- RLS PostgreSQL
- Adoptar `organizationId` en todos los reportes legacy

## Criterios de aceptación — estado

| Criterio | Estado |
|----------|--------|
| Balance correcto (backend) | ✅ |
| Pagos parciales | ✅ |
| Anticipos/créditos | ✅ |
| Sin DELETE físico de pagos | ✅ |
| Anulaciones con auditoría | ✅ |
| Recibos inmutables | ✅ |
| Cargos no duplicados | ✅ |
| Job recurrente idempotente | ✅ |
| Aislamiento tenant | ✅ (APIs scoped + tests Fase 1) |
| Build + tests | ✅ |
