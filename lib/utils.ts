import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Función para formatear la cédula
export function formatCedula(value: string) {
  // Eliminar todos los caracteres no numéricos
  const numbers = value.replace(/\D/g, "");
  
  // Aplicar el formato 000-0000000-0
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 10)}-${numbers.slice(10, 11)}`;
  }
}

// Función para formatear el teléfono
export function formatPhone(value: string) {
  // Eliminar todos los caracteres no numéricos
  const numbers = value.replace(/\D/g, "");
  
  // Aplicar el formato 000-000-0000
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }
}
