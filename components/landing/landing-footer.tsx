import Link from "next/link";
import { Building2 } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-slate-400 transition-colors hover:text-white">
          <Building2 className="h-5 w-5 text-violet-400" />
          <span className="text-sm font-medium">Resident Management</span>
        </Link>
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
          <a href="#inicio" className="hover:text-slate-300">
            Inicio
          </a>
          <a href="#caracteristicas" className="hover:text-slate-300">
            Características
          </a>
          <a href="#planes" className="hover:text-slate-300">
            Planes
          </a>
          <a href="#contacto" className="hover:text-slate-300">
            Contacto
          </a>
          <Link href="/login" className="hover:text-slate-300">
            Iniciar sesión
          </Link>
        </nav>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Resident Management. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
