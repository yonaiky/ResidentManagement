"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, Key, Plus, Users, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/residents",
    label: "Nuevo residente",
    icon: Plus,
    color: "from-blue-500/20 to-blue-600/5 text-blue-600 dark:text-blue-400",
  },
  {
    href: "/payments",
    label: "Registrar pago",
    icon: CreditCard,
    color: "from-emerald-500/20 to-emerald-600/5 text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/tokens",
    label: "Gestionar tokens",
    icon: Key,
    color: "from-violet-500/20 to-violet-600/5 text-violet-600 dark:text-violet-400",
  },
  {
    href: "/whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    color: "from-cyan-500/20 to-cyan-600/5 text-cyan-600 dark:text-cyan-400",
  },
  {
    href: "/residents",
    label: "Ver residentes",
    icon: Users,
    color: "from-amber-500/20 to-amber-600/5 text-amber-600 dark:text-amber-400",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
      {actions.map((action, i) => (
        <motion.div
          key={action.href + action.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            href={action.href}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border/40 bg-gradient-to-br p-3",
              "transition-all hover:border-border/80 hover:shadow-md hover:-translate-y-0.5",
              action.color
            )}
          >
            <action.icon className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
