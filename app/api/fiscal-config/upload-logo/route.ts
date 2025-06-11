import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(process.cwd(), "public", "logos", fileName);

    // Convertir el archivo a buffer y guardarlo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retornar la ruta relativa del archivo
    return NextResponse.json({
      success: true,
      filePath: `/logos/${fileName}`
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      { 
        error: "Error uploading logo",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function createDirIfNotExists(dir: string) {
  try {
    await writeFile(dir, "", { flag: "wx" });
  } catch (error) {
    // El directorio ya existe, no hay problema
  }
} 