import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LogoPreviewProps {
  currentLogo?: string;
  onLogoUpload: (filePath: string) => void;
}

export function LogoPreview({ currentLogo, onLogoUpload }: LogoPreviewProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "El archivo debe ser una imagen",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar los 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/fiscal-config/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir el logo");
      }

      const data = await response.json();
      onLogoUpload(data.filePath);
      
      toast({
        title: "Logo actualizado",
        description: "El logo se ha actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative w-48 h-48 border-2 border-dashed rounded-lg overflow-hidden">
        {currentLogo ? (
          <Image
            src={currentLogo}
            alt="Logo de la empresa"
            fill
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No hay logo
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="relative"
          disabled={isUploading}
        >
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={isUploading}
            aria-label="Seleccionar logo"
          />
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Subiendo..." : "Cambiar logo"}
        </Button>
      </div>
    </div>
  );
} 