import { BarChart3, CreditCard, Key, Users } from "lucide-react";

const modules = [
  {
    icon: Users,
    title: "Gestión de Residentes",
    description:
      "Registra y administra información completa de cada residente, vivienda y contacto.",
    mockTitle: "Lista de residentes",
    mockItems: ["Torre A — Apt. 402", "Torre B — Apt. 118", "Casa 24 — Familia López"],
  },
  {
    icon: CreditCard,
    title: "Facturación y Pagos",
    description:
      "Controla cuotas, pagos pendientes, historial financiero y recordatorios automáticos.",
    mockTitle: "Estado de pagos",
    mockItems: ["Cuota marzo — Pagado", "Mantenimiento — Pendiente", "Extraordinario — Vencido"],
    reverse: true,
  },
  {
    icon: Key,
    title: "Control de Acceso",
    description:
      "Genera tokens o códigos temporales para visitas, proveedores y residentes.",
    mockTitle: "Tokens activos",
    mockItems: ["Visitante — 2h restantes", "Proveedor — Entrada autorizada", "Residente — Permanente"],
  },
  {
    icon: BarChart3,
    title: "Reportes y Auditoría",
    description:
      "Consulta movimientos, pagos, accesos y actividad administrativa en tiempo real.",
    mockTitle: "Actividad reciente",
    mockItems: ["Pago registrado — $850", "Token emitido — Visitante", "Usuario admin — Login"],
    reverse: true,
  },
];

function ModuleMock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="landing-glass w-full max-w-md rounded-2xl border border-white/10 p-5 shadow-xl shadow-violet-500/5">
      <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
        <span className="text-sm font-medium text-slate-300">{title}</span>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-slate-300"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ModulesSection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Una plataforma. Todas las funciones.
          </h2>
          <p className="mt-4 text-slate-400">
            Herramientas integradas para operar tu comunidad sin fricción.
          </p>
        </div>

        <div className="space-y-20 lg:space-y-28">
          {modules.map((mod) => (
            <div
              key={mod.title}
              className={`flex flex-col items-center gap-10 lg:gap-16 ${
                mod.reverse ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex-1 space-y-4">
                <div className="inline-flex rounded-xl bg-violet-500/10 p-3 ring-1 ring-violet-500/20">
                  <mod.icon className="h-7 w-7 text-violet-400" />
                </div>
                <h3 className="text-2xl font-bold text-white sm:text-3xl">{mod.title}</h3>
                <p className="max-w-lg text-slate-400 leading-relaxed">{mod.description}</p>
              </div>
              <div className="flex flex-1 justify-center">
                <ModuleMock title={mod.mockTitle} items={mod.mockItems} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
