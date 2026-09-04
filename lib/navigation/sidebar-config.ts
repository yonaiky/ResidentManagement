import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  CreditCard,
  MessageCircle,
  UserCog,
  Settings,
  Plus,
  BarChart3,
  Wrench,
  Car,
  Building2,
  Briefcase,
  Megaphone,
  FileText,
  CalendarDays,
  Truck,
  Activity,
} from "lucide-react";

export type UserRole = "admin" | "manager" | "user" | string;

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  badge?: string | number;
  roles?: UserRole[];
  adminOnly?: boolean;
  managerOrAdmin?: boolean;
};

export type SidebarNavGroup = {
  id: string;
  label: string;
  items: SidebarNavItem[];
};

export const SIDEBAR_WIDTH_EXPANDED = 280;
export const SIDEBAR_WIDTH_COLLAPSED = 76;

export const QUICK_ACTIONS: SidebarNavItem[] = [
  {
    href: "/residents/new",
    label: "Nuevo residente",
    icon: Plus,
    description: "Alta rápida",
  },
];

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  {
    id: "main",
    label: "Principal",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Resumen y métricas",
      },
      {
        href: "/operations",
        label: "Operación",
        icon: Activity,
        description: "Resumen operativo",
        managerOrAdmin: true,
      },
      {
        href: "/properties",
        label: "Propiedades",
        icon: Building2,
        description: "Residenciales y unidades",
      },
      {
        href: "/residents",
        label: "Residentes",
        icon: Users,
        description: "Gestión de residentes",
      },
      {
        href: "/tokens",
        label: "Tokens",
        icon: KeyRound,
        description: "Accesos y llaves",
      },
      {
        href: "/payments",
        label: "Pagos",
        icon: CreditCard,
        description: "Transacciones",
      },
      {
        href: "/finance",
        label: "Finanzas",
        icon: BarChart3,
        description: "Cuotas, cargos y cartera",
        managerOrAdmin: true,
      },
      {
        href: "/reports",
        label: "Reportes",
        icon: BarChart3,
        description: "Análisis y exportación",
      },
      {
        href: "/tickets",
        label: "Mantenimiento",
        icon: Wrench,
        description: "Tickets e incidencias",
      },
      {
        href: "/providers",
        label: "Proveedores",
        icon: Truck,
        description: "Servicios externos",
        managerOrAdmin: true,
      },
      {
        href: "/parking",
        label: "Parqueos",
        icon: Car,
        description: "Vehículos y espacios",
      },
      {
        href: "/amenities",
        label: "Áreas comunes",
        icon: CalendarDays,
        description: "Reservas",
        managerOrAdmin: true,
      },
      {
        href: "/announcements",
        label: "Comunicados",
        icon: Megaphone,
        description: "Avisos internos",
        managerOrAdmin: true,
      },
      {
        href: "/documents",
        label: "Documentos",
        icon: FileText,
        description: "Repositorio",
        managerOrAdmin: true,
      },
      {
        href: "/whatsapp",
        label: "WhatsApp",
        icon: MessageCircle,
        description: "Notificaciones",
        badge: "Live",
      },
    ],
  },
  {
    id: "admin",
    label: "Administración",
    items: [
      {
        href: "/owner",
        label: "Mis organizaciones",
        icon: Briefcase,
        description: "Orgs y residenciales",
        adminOnly: true,
      },
      {
        href: "/users",
        label: "Usuarios",
        icon: UserCog,
        description: "Equipo y permisos",
        managerOrAdmin: true,
      },
      {
        href: "/settings",
        label: "Configuración",
        icon: Settings,
        description: "Sistema",
        adminOnly: true,
      },
    ],
  },
];

export function filterNavGroupsForRole(
  groups: SidebarNavGroup[],
  role: UserRole | undefined
): SidebarNavGroup[] {
  if (role === "technician") {
    return [
      {
        id: "technician",
        label: "Mi trabajo",
        items: [
          {
            href: "/tickets",
            label: "Mis asignaciones",
            icon: Wrench,
            description: "Tickets asignados a ti",
          },
        ],
      },
    ];
  }

  const isAdmin =
    role === "admin" ||
    role === "platform_admin" ||
    role === "tenant_admin";
  const isManagerOrAdmin = isAdmin || role === "manager";

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.adminOnly) return isAdmin;
        if (item.managerOrAdmin) return isManagerOrAdmin;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
