"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersTable } from "@/components/users/users-table";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Check if user has permission to manage users
  const canManageUsers = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  if (!canManageUsers) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their permissions
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Link href="/users/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users in the system with their roles and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable currentUser={currentUser} />
        </CardContent>
      </Card>
    </div>
  );
}