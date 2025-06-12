"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  Key, 
  CreditCard, 
  UserCog,
  BarChart3,
  Settings,
  MessageCircle
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
      href: "/residents",
      label: "Residents",
      icon: Users,
      description: "Manage residents",
    },
    {
      href: "/tokens",
      label: "Tokens",
      icon: Key,
      description: "Access tokens",
    },
    {
      href: "/payments",
      label: "Payments",
      icon: CreditCard,
      description: "Payment records",
    },
    {
      href: "/whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      description: "Notifications",
    },
  ];

  // Add user management route for admins and managers
  if (user && (user.role === 'admin' || user.role === 'manager')) {
    routes.push({
      href: "/users",
      label: "Users",
      icon: UserCog,
      description: "User management",
    });
  }

  // Add settings route for admins only
  if (user && user.role === 'admin') {
    routes.push({
      href: "/settings",
      label: "Settings",
      icon: Settings,
      description: "System configuration",
    });
  }

  return (
    <aside className="hidden w-72 flex-col border-r border-border/40 bg-muted/30 md:flex">
      <ScrollArea className="flex-1 pt-20">
        <div className="flex flex-col gap-2 p-6">
          <div className="mb-4">
            <h2 className="mb-2 px-3 text-lg font-semibold tracking-tight">
              Navigation
            </h2>
            <p className="px-3 text-sm text-muted-foreground">
              Manage your residential community
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
                    "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                    isActive 
                      ? "bg-accent text-accent-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <route.icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <div className="flex flex-col">
                    <span className="font-medium">{route.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {route.description}
                    </span>
                  </div>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {user && (
            <div className="mt-8 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-4 dark:from-blue-950/50 dark:to-purple-950/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.username}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {user.role}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-muted-foreground">Online</span>
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