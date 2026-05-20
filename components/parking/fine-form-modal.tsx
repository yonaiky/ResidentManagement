"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function FineFormModal({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plate, setPlate] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/parking/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate,
          amount: parseFloat(amount),
          reason,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al registrar");
      }
      toast({ title: "Multa registrada" });
      setPlate("");
      setAmount("");
      setReason("");
      setDueDate("");
      setNotes("");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo registrar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar multa</DialogTitle>
          <DialogDescription>
            Multa de parqueo independiente del módulo de pagos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Placa</Label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Monto (RD$)</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha límite (opcional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar multa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
