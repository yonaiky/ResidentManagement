"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  BarChart3,
  CreditCard,
  Home,
  Key,
  MessageCircle,
  Moon,
  Settings,
  Sun,
  Users,
  Wrench,
  Car,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthUserStore } from "@/store/auth-user-store";
import { isTechnician } from "@/lib/roles";

const allPages = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/residents", label: "Residentes", icon: Users },
  { href: "/tokens", label: "Tokens", icon: Key },
  { href: "/payments", label: "Pagos", icon: CreditCard },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/tickets", label: "Mantenimiento", icon: Wrench },
  { href: "/parking", label: "Parqueos", icon: Car },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const user = useAuthUserStore((s) => s.user);

  const pages = isTechnician(user?.role)
    ? allPages.filter((p) => p.href === "/tickets")
    : allPages;

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, [toggle]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, acciones..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        <CommandGroup heading="Navegación">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => run(() => router.push(page.href))}
            >
              <page.icon className="mr-2 h-4 w-4" />
              {page.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Acciones">
          <CommandItem onSelect={() => run(() => setTheme(theme === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Cambiar tema
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
