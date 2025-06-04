import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export function PaymentForm({ resident, onSuccess, onClose }: { resident: any, onSuccess: () => void, onClose: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/residents/${resident.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Error al registrar el pago");
      toast({ title: "Pago registrado", description: "El pago fue registrado exitosamente" });
      onSuccess();
      onClose();
    } catch (err) {
      toast({ title: "Error", description: "No se pudo registrar el pago", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div><b>Residente:</b> {resident.name} {resident.lastName}</div>
        <div><b>Cédula:</b> {resident.cedula}</div>
        <div><b>No. Registro:</b> {resident.noRegistro}</div>
      </div>
      <Input
        type="number"
        placeholder="Monto del pago"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        required
        min={1}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Registrando..." : "Registrar Pago"}</Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}