"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as xlsx from 'xlsx';

type PreviewResident = {
  name: string;
  apellido: string;
  cedula: string;
  noRegistro: string;
  phone: string;
  address: string;
};

export function BulkUploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResident[]>([]);
  const { toast } = useToast();

  const normalizeColumnName = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const columnAlias: Record<string, keyof PreviewResident> = {
    nombre: "name",
    apellido: "apellido",
    cedula: "cedula",
    noregistro: "noRegistro",
    telefono: "phone",
    direccion: "address",
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.xlsx')) {
        toast({
          title: "Formato incorrecto",
          description: "Por favor, selecciona un archivo .xlsx",
          variant: "destructive",
        });
        setFile(null);
        setPreviewData([]);
        return;
      }

      setFile(selectedFile);
      setIsLoading(true);
      setPreviewData([]);

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = event.target?.result as string;
          const workbook = xlsx.read(data, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = xlsx.utils.sheet_to_json(sheet) as any[];

          const processedData = rows.map((row) => {
            const cleaned: Partial<PreviewResident> = {};
            for (const key in row) {
              const normalizedKey = normalizeColumnName(key);
              const alias = columnAlias[normalizedKey];
              if (alias) {
                cleaned[alias] = String(row[key]).trim();
              }
            }
            return cleaned;
          });

          const validPreviewData = processedData.filter(
            (row) =>
              row.name &&
              row.apellido &&
              row.cedula &&
              row.noRegistro &&
              row.phone &&
              row.address
          ) as PreviewResident[];

          setPreviewData(validPreviewData);

          if (processedData.length !== validPreviewData.length) {
            toast({
              title: "Advertencia de datos",
              description: `Se omitieron ${processedData.length - validPreviewData.length} filas con datos incompletos.`,
              variant: "warning",
            });
          }
        } catch (error: any) {
          toast({
            title: "Error al leer archivo",
            description: error.message,
            variant: "destructive",
          });
          setFile(null);
          setPreviewData([]);
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Error al leer archivo",
          description: "Hubo un error leyendo el archivo.",
          variant: "destructive",
        });
        setFile(null);
        setPreviewData([]);
        setIsLoading(false);
      };

      reader.readAsBinaryString(selectedFile);
    } else {
      setFile(null);
      setPreviewData([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewData.length === 0) {
      toast({
        title: "Sin datos para guardar",
        description: "No hay residentes válidos para guardar.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/residents/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(previewData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al cargar residentes");
      }

      toast({
        title: "Carga exitosa",
        description: `${data.inserted} residentes agregados. ${
          data.errors > 0 ? `${data.errors} filas con errores.` : ""
        }`,
      });

      setOpen(false);
      setFile(null);
      setPreviewData([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Carga masiva
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cargar residentes desde Excel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="file" className="text-sm font-medium">
              Seleccionar archivo Excel (.xlsx)
            </label>
            <input
              id="file"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              El archivo debe tener las columnas: Nombre, Apellido, Cédula, No. Registro, Teléfono, Dirección
            </p>
          </div>

          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground">
              Procesando archivo para vista previa...
            </div>
          ) : previewData.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Vista previa de datos ({previewData.length} filas válidas)</h3>
              <div className="max-h-[400px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Apellido</TableHead>
                      <TableHead>Cédula</TableHead>
                      <TableHead>No. Registro</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Dirección</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((resident, index) => (
                      <TableRow key={index}>
                        <TableCell>{resident.name}</TableCell>
                        <TableCell>{resident.apellido}</TableCell>
                        <TableCell>{resident.cedula}</TableCell>
                        <TableCell>{resident.noRegistro}</TableCell>
                        <TableCell>{resident.phone}</TableCell>
                        <TableCell>{resident.address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : file && !isLoading ? (
            <div className="text-center text-sm text-muted-foreground">
              No se encontraron datos válidos en el archivo.
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || previewData.length === 0}>
              {isLoading ? "Guardando..." : `Confirmar y guardar (${previewData.length})`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
