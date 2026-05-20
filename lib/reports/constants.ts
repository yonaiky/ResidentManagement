export const REPORT_TYPES = [
  { value: "payments", label: "Pagos" },
  { value: "residents", label: "Residentes" },
  { value: "tokens", label: "Tokens / Accesos" },
  { value: "arrears", label: "Morosidad" },
] as const;

export const DATE_PRESETS = [
  { value: "all", label: "Todo el historial" },
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "last_month", label: "Mes anterior" },
  { value: "quarter", label: "Trimestre actual" },
  { value: "year", label: "Año actual" },
  { value: "custom", label: "Rango personalizado" },
] as const;

export const DATE_FIELDS = [
  { value: "paymentDate", label: "Fecha de pago" },
  { value: "dueDate", label: "Fecha de vencimiento" },
  { value: "createdAt", label: "Fecha de registro" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "all", label: "Todos los estados" },
  { value: "completed", label: "Completados" },
  { value: "pending", label: "Pendientes" },
  { value: "overdue", label: "Vencidos" },
] as const;

export const RESIDENT_STATUSES = [
  { value: "all", label: "Todos" },
  { value: "paid", label: "Al día" },
  { value: "completed", label: "Completado" },
  { value: "pending", label: "Pendiente" },
  { value: "overdue", label: "Moroso" },
] as const;

export const TOKEN_STATUSES = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
] as const;

export const SORT_OPTIONS = [
  { value: "date", label: "Fecha" },
  { value: "amount", label: "Monto" },
  { value: "name", label: "Nombre" },
] as const;

export const MONTH_OPTIONS = [
  { value: "all", label: "Todos los meses" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
] as const;

export const DEFAULT_PAGE_SIZE = 25;
