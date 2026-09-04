"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

type Announcement = {
  id: string;
  title: string;
  content: string;
  status: string;
  priority: string;
  audienceType: string;
  publishedAt: string | null;
};

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audienceType, setAudienceType] = useState("ALL");

  const load = useCallback(async () => {
    const res = await fetch("/api/announcements");
    const json = await res.json();
    setItems(json.items ?? []);
  }, []);

  useEffect(() => {
    load().catch(() =>
      toast({ title: "Error", description: "No se pudieron cargar comunicados" })
    );
  }, [load, toast]);

  async function publish() {
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        audienceType,
        status: "PUBLISHED",
        priority: "medium",
      }),
    });
    if (!res.ok) {
      const j = await res.json();
      toast({ title: "Error", description: j.error || "Falló" });
      return;
    }
    setTitle("");
    setContent("");
    await load();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Comunicados</h1>
        <p className="text-sm text-muted-foreground">
          Publicación interna (sin WhatsApp/email en esta fase)
        </p>
      </div>

      <div className="grid max-w-2xl gap-3 rounded-lg border p-4">
        <div>
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Contenido</Label>
          <textarea
            className="min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div>
          <Label>Audiencia</Label>
          <select
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value)}
          >
            <option value="ALL">Toda la organización</option>
            <option value="OWNERS">Propietarios</option>
            <option value="TENANTS">Inquilinos</option>
            <option value="RESIDENTS">Residentes</option>
            <option value="UNITS">Unidades específicas</option>
          </select>
        </div>
        <Button onClick={publish}>Publicar</Button>
      </div>

      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium">{a.title}</h2>
              <span className="text-xs text-muted-foreground">{a.status}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {a.content}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Audiencia: {a.audienceType}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
