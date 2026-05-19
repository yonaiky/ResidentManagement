import Link from "next/link";
import { Building2, CheckCircle2, Shield, Zap } from "lucide-react";

const highlights = [
  {
    icon: Zap,
    text: "Gestión centralizada de residentes, pagos y accesos",
  },
  {
    icon: Shield,
    text: "Seguridad empresarial con roles y auditoría",
  },
  {
    icon: CheckCircle2,
    text: "Reportes en tiempo real para tu comunidad",
  },
];

export function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a12] text-slate-100">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-600/15 blur-[100px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 lg:flex-row lg:items-center lg:gap-12 lg:px-8">
        <div className="mb-10 hidden flex-1 flex-col justify-center lg:flex">
          <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 p-2.5 shadow-lg shadow-violet-500/25">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">
              Resident <span className="text-violet-400">Management</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
            Bienvenido de vuelta a tu{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              panel de control
            </span>
          </h1>
          <p className="mt-4 max-w-md text-slate-400 leading-relaxed">
            Accede para administrar residentes, pagos, tokens de acceso y comunicaciones de tu
            residencial.
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-slate-300">
                <div className="mt-0.5 rounded-lg bg-violet-500/10 p-2 ring-1 ring-violet-500/20">
                  <item.icon className="h-4 w-4 text-violet-400" />
                </div>
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-slate-500">
            ¿Primera vez aquí?{" "}
            <Link href="/" className="text-violet-400 hover:text-violet-300">
              Conoce la plataforma
            </Link>
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center py-4 lg:py-0">{children}</div>
      </div>
    </div>
  );
}
