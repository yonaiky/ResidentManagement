"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#caracteristicas", label: "Características" },
  { href: "#planes", label: "Planes" },
  { href: "#contacto", label: "Contacto" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a12]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 p-2 shadow-lg shadow-violet-500/25">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight text-white">
            Resident <span className="text-violet-400">Management</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle className="text-slate-300 hover:bg-white/10 hover:text-white" />
          <Button variant="ghost" asChild className="text-slate-200 hover:bg-white/10 hover:text-white">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40"
          >
            <Link href="/register">Solicitar demo</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle className="text-slate-300 hover:bg-white/10" />
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-white/5 bg-[#0a0a12]/95 backdrop-blur-xl transition-all duration-300 md:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
            <Button variant="outline" asChild className="border-white/10 bg-transparent text-white">
              <Link href="/login" onClick={() => setOpen(false)}>
                Iniciar sesión
              </Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-violet-600">
              <Link href="/register" onClick={() => setOpen(false)}>
                Solicitar demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
