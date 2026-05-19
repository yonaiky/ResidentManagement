import {
  Building2,
  CreditCard,
  DollarSign,
  Key,
  TrendingUp,
} from "lucide-react";

const metrics = [
  { label: "Residentes activos", value: "248", icon: Building2, color: "text-blue-400" },
  { label: "Pagos recibidos", value: "$12.4k", icon: DollarSign, color: "text-emerald-400" },
  { label: "Tokens emitidos", value: "86", icon: Key, color: "text-violet-400" },
  { label: "Ingresos del mes", value: "$48.2k", icon: CreditCard, color: "text-cyan-400" },
];

export function DashboardMockup() {
  return (
    <div className="relative">
      <div className="landing-glow absolute -inset-4 rounded-3xl opacity-60" />
      <div className="landing-glass relative overflow-hidden rounded-2xl border border-white/10 p-5 shadow-2xl shadow-violet-500/10">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs text-slate-400">Dashboard — Resident Management</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:border-violet-500/30"
            >
              <div className="mb-2 flex items-center justify-between">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-white">{m.value}</p>
              <p className="text-[10px] text-slate-400 sm:text-xs">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3">
          <p className="mb-2 text-xs font-medium text-slate-300">Ingresos mensuales</p>
          <div className="flex h-20 items-end gap-1.5">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-blue-500 opacity-80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="landing-glass absolute -left-4 top-8 hidden rounded-xl border border-violet-500/30 px-3 py-2 shadow-lg shadow-violet-500/20 sm:block">
        <p className="text-xs text-slate-400">Nuevo pago</p>
        <p className="text-sm font-semibold text-emerald-400">+$1,250</p>
      </div>

      <div className="landing-glass absolute -right-2 bottom-12 hidden rounded-xl border border-blue-500/30 px-3 py-2 shadow-lg shadow-blue-500/20 md:block">
        <p className="text-xs text-slate-400">Token activo</p>
        <p className="text-sm font-semibold text-violet-300">Visitante #42</p>
      </div>
    </div>
  );
}
