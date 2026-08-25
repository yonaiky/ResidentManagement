"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Building2,
  Loader2,
  Plus,
  ArrowRight,
  Home,
  Users,
} from "lucide-react";
import { useAuthUserStore } from "@/store/auth-user-store";

type OwnerTenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  propertyCount: number;
  memberCount: number;
  membershipRole: string;
};

type PropertyItem = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  propertyType: string;
  unitCount: number;
};

export default function OwnerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const resetAuthUser = useAuthUserStore((s) => s.reset);
  const fetchUser = useAuthUserStore((s) => s.fetchUser);

  const [tenants, setTenants] = useState<OwnerTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [propertiesByTenant, setPropertiesByTenant] = useState<
    Record<string, PropertyItem[]>
  >({});
  const [loadingProps, setLoadingProps] = useState<string | null>(null);

  const [organizationName, setOrganizationName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [propertyCode, setPropertyCode] = useState("");

  const loadTenants = useCallback(async () => {
    try {
      const res = await fetch("/api/owner/tenants");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setTenants(data.items ?? []);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudieron cargar las organizaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  async function loadProperties(tenantId: string) {
    if (propertiesByTenant[tenantId]) {
      setExpandedId((id) => (id === tenantId ? null : tenantId));
      return;
    }
    setLoadingProps(tenantId);
    setExpandedId(tenantId);
    try {
      const res = await fetch(`/api/owner/tenants/${tenantId}/properties`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setPropertiesByTenant((prev) => ({
        ...prev,
        [tenantId]: data.items ?? [],
      }));
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "No se pudieron cargar residenciales",
        variant: "destructive",
      });
    } finally {
      setLoadingProps(null);
    }
  }

  async function switchToTenant(tenantId: string, propertyId: string | null) {
    const res = await fetch("/api/tenant/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, propertyId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "No se pudo cambiar de contexto");
    }
    resetAuthUser();
    await fetchUser({ force: true });
    router.push("/dashboard");
    router.refresh();
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/owner/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName,
          propertyName: propertyName || undefined,
          propertyCode: propertyCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      toast({ title: "Organización creada" });
      setOrganizationName("");
      setPropertyName("");
      setPropertyCode("");
      setShowForm(false);
      resetAuthUser();
      await fetchUser({ force: true });
      await loadTenants();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo crear",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando organizaciones...
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Mis organizaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus organizaciones y residenciales. Puedes tener varias con el
            mismo email.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva organización
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear organización</CardTitle>
            <CardDescription>
              Plan Básico en prueba 14 días. Opcionalmente agrega el primer residencial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createOrg} className="space-y-4">
              <div>
                <Label>Nombre de la organización</Label>
                <Input
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Ej. Administradora XYZ"
                  required
                />
              </div>
              <div>
                <Label>Nombre del residencial (opcional)</Label>
                <Input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Torre Azul"
                />
              </div>
              <div>
                <Label>Código del residencial (opcional)</Label>
                <Input
                  value={propertyCode}
                  onChange={(e) => setPropertyCode(e.target.value.toUpperCase())}
                  placeholder="TA-01"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Aún no administras ninguna organización.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear la primera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tenants.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                    {t.name}
                    <Badge variant="outline">{t.plan}</Badge>
                    <Badge
                      variant={t.status === "ACTIVE" || t.status === "TRIAL" ? "secondary" : "destructive"}
                    >
                      {t.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex flex-wrap gap-4">
                    <span className="inline-flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                      {t.propertyCount} residencial(es)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {t.memberCount} miembro(s)
                    </span>
                  </CardDescription>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadProperties(t.id)}
                  >
                    Residenciales
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      void switchToTenant(t.id, null).catch((err) =>
                        toast({
                          title: "Error",
                          description:
                            err instanceof Error ? err.message : "Error",
                          variant: "destructive",
                        })
                      )
                    }
                  >
                    Entrar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {expandedId === t.id && (
                <CardContent className="border-t pt-4">
                  {loadingProps === t.id ? (
                    <p className="text-sm text-muted-foreground">Cargando...</p>
                  ) : (propertiesByTenant[t.id] ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sin residenciales. Entra a la org y crea uno en Propiedades.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {(propertiesByTenant[t.id] ?? []).map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">
                              {p.name}{" "}
                              <span className="text-muted-foreground">({p.code})</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.unitCount} unidad(es)
                              {p.address ? ` · ${p.address}` : ""}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              void switchToTenant(t.id, p.id).catch((err) =>
                                toast({
                                  title: "Error",
                                  description:
                                    err instanceof Error ? err.message : "Error",
                                  variant: "destructive",
                                })
                              )
                            }
                          >
                            Abrir
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
