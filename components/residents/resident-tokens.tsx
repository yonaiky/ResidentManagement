"use client";

import { useState } from "react";
import { TokenCard } from "@/components/tokens/token-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Token {
  id: number;
  name: string;
  status: string;
  paymentStatus: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  residentId: number;
}

interface ResidentTokensProps {
  tokens: Token[];
  residentId: number;
}

export function ResidentTokens({ tokens: initialTokens, residentId }: ResidentTokensProps) {
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const { toast } = useToast();

  const handleTokenDeleted = (deletedTokenId: number) => {
    // Actualizar la lista de tokens después de eliminar uno
    setTokens(tokens.filter(token => token.id !== deletedTokenId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tokens</h2>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Token
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tokens.map((token) => (
          <TokenCard 
            key={token.id} 
            token={token}
            onTokenDeleted={() => handleTokenDeleted(token.id)}
          />
        ))}
      </div>
    </div>
  );
} 