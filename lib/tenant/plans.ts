export type SubscriptionPlan = "BASIC" | "PROFESSIONAL" | "PREMIUM";

export type PlanLimits = {
  maxProperties: number | null;
  maxUsers: number | null;
  maxResidents: number | null;
  maxTokensPerMonth: number | null;
  auditDays: number | null;
  advancedReports: boolean;
  apiAccess: boolean;
};

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  BASIC: {
    maxProperties: 1,
    maxUsers: 5,
    maxResidents: 100,
    maxTokensPerMonth: 20,
    auditDays: null,
    advancedReports: false,
    apiAccess: false,
  },
  PROFESSIONAL: {
    maxProperties: 3,
    maxUsers: 15,
    maxResidents: 500,
    maxTokensPerMonth: 200,
    auditDays: 90,
    advancedReports: true,
    apiAccess: false,
  },
  PREMIUM: {
    maxProperties: null,
    maxUsers: null,
    maxResidents: null,
    maxTokensPerMonth: null,
    auditDays: null,
    advancedReports: true,
    apiAccess: true,
  },
};

export const LANDING_PLANS = [
  {
    id: "BASIC" as const,
    name: "Básico",
    price: "$20",
    period: "/mes",
    description: "Ideal para residenciales pequeños que inician su digitalización.",
    features: [
      "1 residencial",
      "5 usuarios",
      "100 residentes",
      "20 tokens/mes",
      "Reportes básicos",
    ],
    popular: false,
  },
  {
    id: "PROFESSIONAL" as const,
    name: "Profesional",
    price: "$50",
    period: "/mes",
    description: "La opción preferida para comunidades en crecimiento.",
    features: [
      "3 residenciales",
      "15 usuarios",
      "500 residentes",
      "200 tokens/mes",
      "Reportes avanzados",
      "Auditoría 90 días",
    ],
    popular: true,
  },
  {
    id: "PREMIUM" as const,
    name: "Premium",
    price: "$100",
    period: "/mes",
    description: "Control total para operadores con múltiples propiedades.",
    features: [
      "Residenciales ilimitados",
      "Usuarios ilimitados",
      "Residentes ilimitados",
      "Tokens ilimitados",
      "Reportes avanzados",
      "Auditoría completa",
      "API e integraciones",
    ],
    popular: false,
  },
];

export function getPlanLabel(plan: string): string {
  return LANDING_PLANS.find((p) => p.id === plan)?.name ?? plan;
}

export function applyPlanLimitsToTenant(plan: SubscriptionPlan) {
  const limits = PLAN_LIMITS[plan];
  return {
    plan,
    maxProperties: limits.maxProperties,
    maxUsers: limits.maxUsers,
    maxResidents: limits.maxResidents,
    maxTokensPerMonth: limits.maxTokensPerMonth,
  };
}

export function slugifyTenantName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "tenant";
}
