import type { SidebarNavItem } from "@/lib/navigation/sidebar-config";

export type SidebarItemProps = {
  item: SidebarNavItem;
  collapsed: boolean;
  isActive: boolean;
  onNavigate?: () => void;
};
