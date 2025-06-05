import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Resident = {
  id: number;
  name: string;
  lastName: string;
  cedula: string;
  noRegistro: string;
};

export function PaymentForm({ resident, onSuccess, onClose }: { resident: Resident, onSuccess: () => void, onClose: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Por favor ingrese un monto válido mayor que 0");
      setLoading(false);
      return;
    }

    try {
      console.log('Enviando pago...', {
        residentId: resident.id,
        amount: parseFloat(amount)
      });

      const response = await fetch(`/api/residents/${resident.id}/payments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount)
        })
      });

      console.log('Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      let data;
      try {
        data = await response.json();
        console.log('Datos de respuesta:', data);
      } catch (e) {
        console.error('Error al parsear respuesta:', e);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || "Error al registrar el pago");
      }

      toast({ 
        title: "Pago registrado", 
        description: `El pago de $${parseFloat(amount).toFixed(2)} fue registrado exitosamente` 
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error completo:', err);
      setError(err instanceof Error ? err.message : "No se pudo registrar el pago");
      toast({ 
        title: "Error", 
        description: err instanceof Error ? err.message : "No se pudo registrar el pago", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Residente</Label>
            <div className="text-sm">{resident.name} {resident.lastName}</div>
          </div>
          <div>
            <Label>Cédula</Label>
            <div className="text-sm">{resident.cedula}</div>
          </div>
          <div>
            <Label>No. Registro</Label>
            <div className="text-sm">{resident.noRegistro}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Monto del pago</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Ingrese el monto"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          min={1}
          step="0.01"
          className="w-full"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Registrando..." : "Registrar Pago"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}