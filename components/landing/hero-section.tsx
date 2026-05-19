import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "./dashboard-mockup";

export function HeroSection() {
  return (
    <section id="inicio" className="relative pt-28 pb-20 sm:pt-32 sm:pb-28 lg:pt-36">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
            <Sparkles className="h-4 w-4 text-violet-400" />
            La nueva generación de gestión residencial
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Gestiona tu residencial con{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              velocidad, control y elegancia
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-slate-400">
            Administra residentes, pagos, accesos, reportes y comunicaciones desde una sola
            plataforma diseñada para comunidades modernas.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 bg-gradient-to-r from-blue-600 to-violet-600 px-8 text-base shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50"
            >
              <Link href="/register">
                Solicitar demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/15 bg-white/5 px-8 text-base text-white hover:bg-white/10"
            >
              <a href="#caracteristicas">Ver funciones</a>
            </Button>
          </div>
        </div>

        <div className="relative lg:pl-4">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
