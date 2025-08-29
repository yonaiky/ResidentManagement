"use client";

import { Bell, Menu, Moon, Search, Sun, User, LogOut, Settings, Building2, CheckCircle, AlertCircle, Clock, Key } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { MobileNav } from "./mobile-nav";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type Activity = {
  id: number;
  type: 'payment' | 'resident' | 'token' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'info';
};

export default function Header() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUser();
    fetchActivities();
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

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities');
      if (!response.ok) {
        throw new Error('Error al obtener las actividades');
      }
      const data = await response.json();
      setActivities(data);
      setUnreadCount(data.length);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades recientes",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
        });
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getActivityIcon = (type: Activity['type'], status?: Activity['status']) => {
    switch (type) {
      case 'payment':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'resident':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'token':
        return <Key className="h-4 w-4 text-purple-500" />;
      case 'notification':
        return <Bell className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
         <header className="nav-modern fixed top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/80 dark:backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
       <div className="container flex h-16 items-center justify-between px-4 md:px-8">
         <div className="flex items-center gap-2 md:gap-4">
           <Sheet>
             <SheetTrigger asChild>
               <Button variant="ghost" size="icon" className="md:hidden hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                 <Menu className="h-5 w-5" />
                 <span className="sr-only">Toggle menu</span>
               </Button>
             </SheetTrigger>
             <SheetContent side="left" className="pr-0 bg-white border-r border-gray-200 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/50">
               <MobileNav />
             </SheetContent>
           </Sheet>
           <Link href="/" className="flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] group">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm group-hover:shadow-md transition-all duration-200 dark:rounded-xl dark:bg-gradient-to-br dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 dark:shadow-lg dark:group-hover:shadow-xl">
               <Building2 className="h-6 w-6" />
             </div>
             <div className="hidden flex-col md:flex">
               <span className="text-lg font-semibold leading-tight text-gray-900 dark:text-gradient">Funeraria San Jose</span>
               <span className="text-xs text-gray-600 dark:text-muted-foreground leading-tight">Management System</span>
             </div>
           </Link>
         </div>
        
                 <div className="flex-1 px-2 md:px-12">
           <form className="hidden md:block">
             <div className="relative max-w-md">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-muted-foreground" />
               <Input
                 type="search"
                 placeholder="Buscar residentes, tokens, pagos..."
                 className="input-modern w-full bg-gray-50 pl-10 focus:bg-white dark:bg-slate-800 dark:focus:bg-slate-900"
               />
             </div>
           </form>
         </div>
        
                 <div className="flex items-center gap-2">
           <Button
             variant="ghost"
             size="icon"
             className="btn-modern text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-slate-800"
             onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
           >
             <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
             <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
             <span className="sr-only">Toggle theme</span>
           </Button>
          
                     <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="icon" className="btn-modern text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-slate-800 relative">
                 <Bell className="h-5 w-5" />
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm animate-pulse dark:bg-gradient-to-r dark:from-red-400 dark:to-red-500 dark:shadow-lg">
                     {unreadCount}
                   </span>
                 )}
                 <span className="sr-only">Notifications</span>
               </Button>
             </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-80 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg dark:bg-slate-900/95 dark:backdrop-blur-md dark:border-slate-700/50 dark:shadow-xl">
               <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-700">
                 <h4 className="font-semibold text-gray-900 dark:text-gradient">Actividades Recientes</h4>
                 <Button
                   variant="ghost"
                   size="sm"
                   className="h-8 text-xs hover:bg-gray-100 dark:hover:bg-slate-800"
                   onClick={() => setUnreadCount(0)}
                 >
                   Marcar todo como leído
                 </Button>
               </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <DropdownMenuItem key={activity.id} className="p-3 cursor-default">
                      <div className="flex gap-3">
                        <div className="mt-1">
                          {getActivityIcon(activity.type, activity.status)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No hay actividades recientes
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                      {getUserInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
                             <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg dark:bg-slate-900/95 dark:backdrop-blur-md dark:border-slate-700/50 dark:shadow-xl" align="end" forceMount>
                 <div className="flex items-center justify-start gap-3 p-4 border-b border-gray-200 dark:border-slate-700">
                   <Avatar className="h-12 w-12 ring-2 ring-blue-500/20">
                     <AvatarFallback className="bg-blue-600 text-white font-semibold dark:bg-gradient-to-br dark:from-blue-500 dark:via-purple-600 dark:to-pink-600">
                       {getUserInitials(user.username)}
                     </AvatarFallback>
                   </Avatar>
                   <div className="flex flex-col space-y-1 leading-none">
                     <p className="font-semibold text-gray-900 dark:text-gradient">{user.username}</p>
                     <p className="text-sm text-gray-600 dark:text-muted-foreground truncate">
                       {user.email}
                     </p>
                     <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-green-500 shadow-sm dark:bg-gradient-to-r dark:from-emerald-400 dark:to-emerald-500"></div>
                       <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground capitalize">{user.role}</span>
                     </div>
                   </div>
                 </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {(user.role === 'admin' || user.role === 'manager') && (
                  <DropdownMenuItem asChild>
                    <Link href="/users" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      User Management
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}