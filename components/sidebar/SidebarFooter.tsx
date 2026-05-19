"use client";

import Link from "next/link";
import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { LogOut, User, ChevronUp, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/store/auth-user-store";

type SidebarFooterProps = {
  user: AuthUser | null;
  collapsed: boolean;
  isLoading?: boolean;
};

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function SidebarFooterComponent({
  user,
  collapsed,
  isLoading,
}: SidebarFooterProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      router.push("/login");
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  }, [router, toast]);

  if (isLoading) {
    return (
      <motion.div
        className={cn(
          "border-t border-sidebar-border p-3",
          collapsed ? "flex justify-center" : ""
        )}
        layout
      >
        <motion.div
          className={cn(
            "animate-pulse rounded-xl bg-sidebar-accent",
            collapsed ? "h-10 w-10" : "h-14 w-full"
          )}
        />
      </motion.div>
    );
  }

  if (!user) return null;

  const profileCard = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2.5 text-left outline-none transition-all",
            "hover:border-sidebar-border hover:bg-sidebar-accent hover:shadow-md",
            "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            collapsed && "justify-center p-2"
          )}
        >
          <div className="relative shrink-0">
            <Avatar className="h-9 w-9 border border-sidebar-border">
              <AvatarFallback className="bg-gradient-to-br from-primary to-violet-600 text-xs font-semibold text-primary-foreground">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-500" />
          </div>

          {!collapsed && (
            <>
              <motion.div
                className="min-w-0 flex-1"
                initial={false}
                animate={{ opacity: 1 }}
              >
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.username}
                </p>
                <p className="truncate text-[11px] capitalize text-sidebar-muted">
                  {user.role}
                </p>
              </motion.div>
              <ChevronUp className="h-4 w-4 shrink-0 text-sidebar-muted transition-transform group-data-[state=open]:rotate-180" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align={collapsed ? "center" : "start"}
        className="w-56"
      >
        <div className="px-2 py-2">
          <p className="text-sm font-medium text-popover-foreground">{user.username}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            Mi perfil
          </Link>
        </DropdownMenuItem>
        {(user.role === "admin" || user.role === "manager") && (
          <DropdownMenuItem asChild>
            <Link href="/users">
              <Settings className="mr-2 h-4 w-4" />
              Usuarios
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (collapsed) {
    return (
      <motion.div className="border-t border-sidebar-border p-3" layout>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{profileCard}</TooltipTrigger>
          <TooltipContent side="right">{user.username}</TooltipContent>
        </Tooltip>
      </motion.div>
    );
  }

  return (
    <motion.div className="border-t border-sidebar-border p-3" layout>
      {profileCard}
    </motion.div>
  );
}

export const SidebarFooter = memo(SidebarFooterComponent);
