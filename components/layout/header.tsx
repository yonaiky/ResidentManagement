"use client";

import {
  Bell,
  Menu,
  Search,
  User,
  LogOut,
  Settings,
  Building2,
  CheckCircle,
  Clock,
  Key,
  PanelLeft,
  Plus,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { TenantSwitcher } from "@/components/layout/tenant-switcher";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect, memo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuthUserStore } from "@/store/auth-user-store";
import { fetchWithCache } from "@/lib/client-fetch-cache";

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type Activity = {
  id: number;
  type: 'payment' | 'resident' | 'token' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'info';
};

type HeaderProps = {
  premium?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

function Header({ premium = true, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthUserStore((s) => s.user);
  const fetchUser = useAuthUserStore((s) => s.fetchUser);
  const resetAuthUser = useAuthUserStore((s) => s.reset);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { openMobile, toggleCollapsed } = useSidebar();
  const handleToggleSidebar = onToggleSidebar ?? toggleCollapsed;

  useEffect(() => {
    void fetchUser();
    void fetchActivities();
  }, [fetchUser]);

  const fetchActivities = async () => {
    try {
      const data = await fetchWithCache<Activity[]>(
        "header-activities",
        "/api/activities",
        { ttlMs: 30_000 }
      );
      setActivities(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      resetAuthUser();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getActivityIcon = (type: Activity['type'], status?: Activity['status']) => {
    switch (type) {
      case 'payment':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'resident':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'token':
        return <Key className="h-4 w-4 text-purple-500" />;
      case 'notification':
        return <Bell className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full shrink-0 border-b backdrop-blur-xl supports-[backdrop-filter]:bg-background/80",
        premium
          ? "border-border/30 bg-background/80 dark:bg-background/60"
          : "border-border/40 bg-background/95"
      )}
    >
      <div
        className={cn(
          "flex w-full items-center justify-between px-4 md:px-6",
          premium ? "h-[4.5rem]" : "h-16"
        )}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={openMobile}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link
            href="/dashboard"
            prefetch
            className="flex items-center gap-3 transition-opacity hover:opacity-80 md:hidden"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">Resident</span>
              <span className="text-xs text-muted-foreground leading-tight">Management</span>
            </div>
          </Link>
        </div>
        
        <div className="flex-1 px-2 md:max-w-xl md:px-6">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className={cn(
              "hidden w-full items-center gap-2 rounded-xl border px-4 py-2 text-sm text-muted-foreground transition-colors md:flex",
              premium
                ? "border-border/50 bg-muted/30 hover:bg-muted/50"
                : "border-transparent bg-muted/50 hover:bg-muted"
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Buscar residentes, pagos, tokens...</span>
            {premium && (
              <kbd className="hidden items-center gap-0.5 rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] font-medium lg:inline-flex">
                <Command className="h-3 w-3" />K
              </kbd>
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-1.5">
          <TenantSwitcher />
          {premium && (
            <Button size="sm" className="hidden gap-1.5 shadow-lg shadow-primary/20 sm:flex" asChild>
              <Link href="/residents">
                <Plus className="h-4 w-4" />
                Nuevo
              </Link>
            </Button>
          )}
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-2">
                <h4 className="font-medium">Actividades Recientes</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setUnreadCount(0)}
                >
                  Marcar todo como leído
                </Button>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <DropdownMenuItem key={activity.id} className="p-3 cursor-default">
                      <div className="flex gap-3">
                        <div className="mt-1">
                          {getActivityIcon(activity.type, activity.status)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No hay actividades recientes
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                      {getUserInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <div className="flex items-center justify-start gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getUserInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <DropdownMenuItem asChild>
                    <Link href="/users" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      User Management
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

export default memo(Header);