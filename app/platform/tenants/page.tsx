"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { invalidateCache } from "@/lib/client-fetch-cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LANDING_PLANS } from "@/lib/tenant/plans";
import { Plus } from "lucide-react";

type TenantItem = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  planLabel: string;
  status: string;
  counts: { memberships: number; properties: number; residents: number };
};

export default function PlatformTenantsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("BASIC");
  const [adminEmail, setAdminEmail] = useState("");

  const { data, isLoading, refresh } = useApiQuery<{ items: TenantItem[] }>(
    "platform-tenants",
    "/api/platform/tenants"
  );

  async function createTenant() {
    const res = await fetch("/api/platform/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, plan, adminEmail: adminEmail || undefined }),
    });
    if (!res.ok) return;
    setOpen(false);
    setName("");
    invalidateCache("platform-tenants");
    void refresh();
  }

  async function patchTenant(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/platform/tenants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    invalidateCache("platform-tenants");
    void refresh();
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo tenant
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Usuarios</TableHead>
              <TableHead>Propiedades</TableHead>
              <TableHead>Residentes</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.planLabel}</TableCell>
                <TableCell>
                  <Badge variant={t.status === "ACTIVE" ? "default" : "secondary"}>
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell>{t.counts.memberships}</TableCell>
                <TableCell>{t.counts.properties}</TableCell>
                <TableCell>{t.counts.residents}</TableCell>
                <TableCell className="flex gap-2">
                  {t.status !== "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => patchTenant(t.id, { status: "ACTIVE" })}
                    >
                      Activar
                    </Button>
                  )}
                  {t.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => patchTenant(t.id, { status: "SUSPENDED" })}
                    >
                      Suspender
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear tenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre organización</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANDING_PLANS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.price}
                      {p.period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email admin (opcional)</Label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => void createTenant()}>
              Crear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
