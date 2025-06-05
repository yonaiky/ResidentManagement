"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Home,
  Users,
  CreditCard,
  FileText,
  Bell,
  Settings,
} from "lucide-react";

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <Building2 className="h-6 w-6" />
        <span className="hidden font-bold sm:inline-block">
          Resident Management
        </span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link
          href="/"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/" ? "text-foreground" : "text-foreground/60"
          )}
        >
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </div>
        </Link>
        <Link
          href="/residents"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/residents" ? "text-foreground" : "text-foreground/60"
          )}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Residentes</span>
          </div>
        </Link>
        <Link
          href="/payments"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/payments" ? "text-foreground" : "text-foreground/60"
          )}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Pagos</span>
          </div>
        </Link>
        <Link
          href="/reports"
          className={cn(
            "transition-colors hover:text-foreground/80",
            pathname === "/reports" ? "text-foreground" : "text-foreground/60"
          )}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Reportes</span>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground/50 cursor-not-allowed"
          disabled
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notificaciones</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground/50 cursor-not-allowed"
          disabled
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Configuración</span>
        </Button>
      </nav>
    </div>
  );
} 