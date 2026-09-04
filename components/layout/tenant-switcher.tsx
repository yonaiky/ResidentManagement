"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { invalidateCache } from "@/lib/client-fetch-cache";

type TenantOption = { id: string; name: string; slug: string };
type PropertyOption = { id: string; name: string; code: string };

export function TenantSwitcher() {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tenantId, setTenantId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await fetch("/api/tenant/context/ensure", { method: "POST" }).catch(
        () => null
      );
      if (cancelled) return;

      const r = await fetch("/api/tenant/context");
      const data = await r.json().catch(() => ({}));
      if (cancelled) return;

      const list = data.tenants ?? [];
      setTenants(list);
      setTenantId(data.currentTenantId ?? list[0]?.id ?? "");
      setPropertyId(data.currentPropertyId ?? "");
      setReady(true);
    })().catch(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const activeTenant = tenantId || tenants[0]?.id;
    if (!activeTenant) {
      setProperties([]);
      return;
    }
    fetch("/api/properties")
      .then((r) => r.json())
      .then((data) => {
        setProperties(
          (data.items ?? []).map((p: PropertyOption) => ({
            id: p.id,
            name: p.name,
            code: p.code,
          }))
        );
      })
      .catch(() => setProperties([]));
  }, [tenantId, tenants, ready]);

  async function saveContext(tId: string, pId: string | null) {
    await fetch("/api/tenant/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: tId, propertyId: pId }),
    });
    invalidateCache();
    window.location.reload();
  }

  if (tenants.length === 0) return null;

  const activeTenant = tenantId || tenants[0]?.id;
  const activeTenantName =
    tenants.find((t) => t.id === activeTenant)?.name ?? "Organización";

  return (
    <div className="hidden items-center gap-2 md:flex">
      {tenants.length >= 1 && (
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="max-w-[140px] truncate font-medium">
            {activeTenantName}
          </span>
        </div>
      )}
      {tenants.length > 1 && (
        <Select
          value={activeTenant}
          onValueChange={(v) => {
            setTenantId(v);
            setPropertyId("");
            void saveContext(v, null);
          }}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Cambiar org." />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {properties.length > 0 && activeTenant && (
        <Select
          value={propertyId || "__all__"}
          onValueChange={(v) => {
            const pid = v === "__all__" ? null : v;
            setPropertyId(v === "__all__" ? "" : v);
            void saveContext(activeTenant, pid);
          }}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Residencial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
