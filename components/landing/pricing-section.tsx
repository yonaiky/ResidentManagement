import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANDING_PLANS } from "@/lib/tenant/plans";

const ctaByPlan: Record<string, string> = {
  BASIC: "Comenzar",
  PROFESSIONAL: "Solicitar demo",
  PREMIUM: "Contactar ventas",
};

export function PricingSection() {
  return (
    <section id="planes" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Planes y precios</h2>
          <p className="mt-4 text-slate-400">
            Elige el plan que mejor se adapte al tamaño de tu comunidad.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {LANDING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                plan.popular
                  ? "landing-glass border-violet-500/50 shadow-xl shadow-violet-500/20 lg:scale-105"
                  : "landing-glass border-white/10 hover:border-violet-500/30"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                  Más popular
                </span>
              )}
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">{plan.description}</p>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-8 w-full ${
                  plan.popular
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-violet-500/25"
                    : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
                variant={plan.popular ? "default" : "outline"}
              >
                <Link href="/register">{ctaByPlan[plan.id] ?? "Comenzar"}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
