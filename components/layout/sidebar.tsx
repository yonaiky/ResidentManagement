"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  Key, 
  CreditCard, 
  UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";

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
    },
    {
      href: "/residents",
      label: "Residents",
      icon: Users,
    },
    {
      href: "/tokens",
      label: "Tokens",
      icon: Key,
    },
    {
      href: "/payments",
      label: "Payments",
      icon: CreditCard,
    },
  ];

  // Add user management route for admins and managers
  if (user && (user.role === 'admin' || user.role === 'manager')) {
    routes.push({
      href: "/users",
      label: "Users",
      icon: UserCog,
    });
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      <ScrollArea className="flex-1 pt-16">
        <div className="flex flex-col gap-2 p-6">
          {routes.map((route) => (
            <Link
              href={route.href}
              key={route.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === route.href ? "bg-accent text-accent-foreground" : "transparent"
              )}
            >
              <route.icon className="h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}