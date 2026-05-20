"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type UserOption = {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
};

type Props = {
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
};

export function AssignTechnicianSelect({ value, onChange, disabled }: Props) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => {
        if (!r.ok) return [];
        return r.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setUsers(list.filter((u: UserOption) => u.isActive !== false));
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      <Label>Técnico asignado</Label>
      <Select
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" ? "" : v)}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Cargando..." : "Sin asignar"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin asignar</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.username} ({u.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
