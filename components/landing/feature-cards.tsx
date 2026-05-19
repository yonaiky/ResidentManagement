import {
  BarChart3,
  Bell,
  CreditCard,
  Key,
  Shield,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestión de Residentes",
    description:
      "Centraliza datos de residentes, viviendas y contactos en un solo lugar.",
  },
  {
    icon: CreditCard,
    title: "Control de Pagos",
    description:
      "Gestiona cuotas, pagos pendientes y recordatorios automáticos.",
  },
  {
    icon: Key,
    title: "Tokens de Acceso",
    description:
      "Emite códigos temporales para visitas, proveedores y personal autorizado.",
  },
  {
    icon: Shield,
    title: "Seguridad Avanzada",
    description:
      "Roles, permisos y autenticación segura para tu equipo administrativo.",
  },
  {
    icon: BarChart3,
    title: "Reportes y Auditoría",
    description:
      "Historial completo de movimientos, pagos y accesos en tiempo real.",
  },
  {
    icon: Bell,
    title: "Comunicaciones y Avisos",
    description:
      "Notifica a residentes por WhatsApp y mantén informada a la comunidad.",
  },
];

export function FeatureCards() {
  return (
    <section id="caracteristicas" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Todo lo que tu residencial necesita
          </h2>
          <p className="mt-4 text-slate-400">
            Módulos diseñados para administradores de condominios y comunidades residenciales.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group landing-glass rounded-2xl border border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10"
            >
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 p-3 ring-1 ring-violet-500/20 transition-all group-hover:shadow-md group-hover:shadow-violet-500/20">
                <f.icon className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
