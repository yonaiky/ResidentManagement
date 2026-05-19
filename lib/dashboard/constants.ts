export const DASHBOARD_COLORS = {
  primary: "hsl(var(--chart-1))",
  secondary: "hsl(var(--chart-2))",
  accent: "hsl(var(--chart-3))",
  success: "hsl(142 71% 45%)",
  warning: "hsl(var(--chart-4))",
  danger: "hsl(var(--chart-5))",
} as const;

export const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

export const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  completed: DASHBOARD_COLORS.success,
  paid: DASHBOARD_COLORS.success,
  pending: DASHBOARD_COLORS.warning,
  overdue: DASHBOARD_COLORS.danger,
};
