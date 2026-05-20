"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { TicketCommentItem } from "@/lib/tickets/types";
import { Loader2, MessageSquare } from "lucide-react";

type Props = {
  ticketId: number;
  comments: TicketCommentItem[];
  onCommentAdded: () => void;
};

export function TicketComments({ ticketId, comments, onCommentAdded }: Props) {
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Error al publicar comentario");
      setBody("");
      onCommentAdded();
      toast({ title: "Comentario agregado" });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-medium">
        <MessageSquare className="h-4 w-4" />
        Comentarios ({comments.length})
      </div>
      <ul className="space-y-3">
        {comments.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border bg-muted/30 p-3 text-sm"
          >
            <div className="mb-1 flex justify-between gap-2">
              <span className="font-medium">{c.author.username}</span>
              <time className="text-xs text-muted-foreground">
                {format(new Date(c.createdAt), "PPp", { locale: es })}
              </time>
            </div>
            <p className="whitespace-pre-wrap text-muted-foreground">{c.body}</p>
          </li>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no hay comentarios.</p>
        )}
      </ul>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Escribe un comentario o nota interna..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <Button type="submit" size="sm" disabled={loading || !body.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publicar
        </Button>
      </form>
    </div>
  );
}
