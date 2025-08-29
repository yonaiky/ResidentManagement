"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  Heart, 
  CreditCard, 
  UserCog,
  BarChart3,
  Settings,
  MessageCircle,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: Home,
      description: "Overview & Analytics",
    },
    {
      href: "/clients",
      label: "Clientes",
      icon: Users,
      description: "Gestión de clientes",
    },
    {
      href: "/plans",
      label: "Planes",
      icon: Heart,
      description: "Planes funerarios",
    },
    {
      href: "/caskets",
      label: "Ataúdes",
      icon: Package,
      description: "Inventario de ataúdes",
    },
    {
      href: "/payments",
      label: "Pagos",
      icon: CreditCard,
      description: "Registros de pagos",
    },
    {
      href: "/whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      description: "Notificaciones",
    },
  ];

  // Add user management route for admins and managers
  if (user && (user.role === 'admin' || user.role === 'manager')) {
    routes.push({
      href: "/users",
      label: "Usuarios",
      icon: UserCog,
      description: "Gestión de usuarios",
    });
  }

  // Add settings route for admins only
  if (user && user.role === 'admin') {
    routes.push({
      href: "/settings",
      label: "Configuración",
      icon: Settings,
      description: "Configuración del sistema",
    });
  }

  return (
    <aside className="sidebar-modern hidden w-72 flex-col border-r border-gray-200 bg-white md:flex dark:border-slate-700/50 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <ScrollArea className="flex-1 pt-20">
        <div className="flex flex-col gap-2 p-6">
          <div className="mb-6">
            <h2 className="mb-2 px-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-gradient">
              Navegación
            </h2>
            <p className="px-3 text-sm text-gray-600 dark:text-slate-400">
              Gestiona tu comunidad residencial
            </p>
          </div>
          
          <div className="space-y-1">
            {routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                                 <Link
                   href={route.href}
                   key={route.href}
                   className={cn(
                     "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.02] dark:hover:bg-slate-800/50 dark:hover:text-white dark:hover:scale-105 dark:rounded-xl",
                     isActive 
                       ? "bg-blue-50 text-blue-900 border border-blue-200 shadow-sm dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-purple-600/20 dark:text-white dark:shadow-lg dark:border-blue-500/20" 
                       : "text-gray-700 dark:text-slate-300"
                   )}
                 >
                   <div className={cn(
                     "p-2 rounded-md transition-all duration-200 dark:rounded-lg",
                     isActive 
                       ? "bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-blue-500 dark:to-purple-600 dark:shadow-lg" 
                       : "bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-800 dark:bg-slate-700/50 dark:text-slate-400 dark:group-hover:bg-slate-600/50 dark:group-hover:text-white"
                   )}>
                     <route.icon className="h-5 w-5" />
                   </div>
                   <div className="flex flex-col">
                     <span className="font-medium dark:font-semibold">{route.label}</span>
                     <span className="text-xs text-gray-500 group-hover:text-gray-600 dark:text-slate-400 dark:group-hover:text-slate-300">
                       {route.description}
                     </span>
                   </div>
                   {isActive && (
                     <div className="ml-auto h-2 w-2 rounded-full bg-blue-500 shadow-sm dark:bg-gradient-to-r dark:from-blue-400 dark:to-purple-400 dark:shadow-lg"></div>
                   )}
                 </Link>
              );
            })}
          </div>

                     {user && (
             <div className="mt-8 rounded-lg bg-gray-50 p-4 border border-gray-200 dark:rounded-xl dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-700/50 dark:border-slate-600/30 dark:backdrop-blur-sm">
               <div className="flex items-center gap-3">
                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold shadow-sm dark:bg-gradient-to-br dark:from-blue-500 dark:via-purple-600 dark:to-pink-600 dark:shadow-lg">
                   {user.username.slice(0, 2).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{user.username}</p>
                   <div className="flex items-center gap-2 mt-1">
                     <Badge className="text-xs bg-green-100 text-green-800 border-0 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 dark:text-white">
                       {user.role}
                     </Badge>
                     <div className="flex items-center gap-1">
                       <div className="h-2 w-2 rounded-full bg-green-500 shadow-sm animate-pulse dark:bg-gradient-to-r dark:from-emerald-400 dark:to-emerald-500"></div>
                       <span className="text-xs text-gray-600 dark:text-slate-300">En línea</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}
        </div>
      </ScrollArea>
    </aside>
  );
}