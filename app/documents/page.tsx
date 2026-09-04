"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type Doc = {
  id: string;
  name: string;
  category: string;
  visibility: string;
  version: number;
  createdAt: string;
};

export default function DocumentsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Doc[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("reglamento");
  const [visibility, setVisibility] = useState("ADMINS");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/documents");
    const json = await res.json();
    setItems(json.items ?? []);
  }, []);

  useEffect(() => {
    load().catch(() =>
      toast({ title: "Error", description: "No se pudieron cargar documentos" })
    );
  }, [load, toast]);

  async function upload() {
    if (!file || !name.trim()) {
      toast({ title: "Completa nombre y archivo" });
      return;
    }
    const form = new FormData();
    form.set("name", name);
    form.set("category", category);
    form.set("visibility", visibility);
    form.set("file", file);
    const res = await fetch("/api/documents", { method: "POST", body: form });
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "Error", description: j.error || "Falló" });
      return;
    }
    setName("");
    setFile(null);
    await load();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Repositorio con control de visibilidad en backend
        </p>
      </div>

      <div className="grid max-w-xl gap-3 rounded-lg border p-4">
        <div>
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Categoría</Label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="reglamento">Reglamentos</option>
            <option value="acta">Actas</option>
            <option value="contrato">Contratos</option>
            <option value="factura">Facturas</option>
            <option value="presupuesto">Presupuestos</option>
            <option value="formulario">Formularios</option>
            <option value="circular">Circulares</option>
            <option value="internal">Internos</option>
          </select>
        </div>
        <div>
          <Label>Visibilidad</Label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="ADMINS">Solo administradores</option>
            <option value="RESIDENTS">Residentes</option>
            <option value="OWNERS">Propietarios</option>
            <option value="ALL">Todos</option>
          </select>
        </div>
        <div>
          <Label>Archivo</Label>
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button onClick={upload}>Subir</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Visibilidad</th>
              <th className="p-3">Versión</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.category}</td>
                <td className="p-3">{d.visibility}</td>
                <td className="p-3">v{d.version}</td>
                <td className="p-3">
                  <a
                    className="underline"
                    href={`/api/documents/${d.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Descargar
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
