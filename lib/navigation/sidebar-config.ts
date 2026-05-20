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

  const isAdmin = role === "admin";
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
