"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

type Provider = {
  id: string;
  name: string;
  serviceType: string;
  phone: string | null;
  email: string | null;
  status: string;
};

const SERVICE_TYPES = [
  "Plomería",
  "Electricidad",
  "Jardinería",
  "Seguridad",
  "Ascensores",
  "Limpieza",
  "Pintura",
  "Otro",
];

export default function ProvidersPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Provider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("Plomería");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/providers");
    const json = await res.json();
    setItems(json.items ?? []);
  }, []);

  useEffect(() => {
    load().catch(() =>
      toast({ title: "Error", description: "No se pudieron cargar proveedores" })
    );
  }, [load, toast]);

  async function create() {
    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, serviceType, phone, email }),
    });
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "Error", description: j.error || "Falló" });
      return;
    }
    setShowForm(false);
    setName("");
    await load();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Servicios externos del residencial
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo
        </Button>
      </div>

      {showForm && (
        <div className="grid max-w-xl gap-3 rounded-lg border p-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Tipo de servicio</Label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              {SERVICE_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={create}>Guardar</Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Servicio</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3">Email</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  Sin proveedores registrados
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.serviceType}</td>
                <td className="p-3">{p.phone || "—"}</td>
                <td className="p-3">{p.email || "—"}</td>
                <td className="p-3">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
