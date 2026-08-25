"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAuthUserStore } from "@/store/auth-user-store";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const resetAuthUser = useAuthUserStore((s) => s.reset);
  const [loading, setLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [propertyCode, setPropertyCode] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
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
      resetAuthUser();
      await useAuthUserStore.getState().fetchUser({ force: true });
      router.push("/dashboard");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo completar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Configura tu organización</CardTitle>
          <CardDescription>
            Plan Básico en prueba 14 días. Puedes agregar tu primer residencial ahora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
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
                placeholder="TORRE-AZUL"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Comenzar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


