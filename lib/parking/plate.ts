const PLATE_REGEX = /^[A-Z0-9]{5,8}$/;

export function normalizePlate(plate: string): string {
  return plate.replace(/[\s\-]/g, "").toUpperCase();
}

export function validatePlate(plate: string): { ok: true } | { ok: false; error: string } {
  const normalized = normalizePlate(plate);
  if (!normalized) {
    return { ok: false, error: "La placa es obligatoria" };
  }
  if (!PLATE_REGEX.test(normalized)) {
    return {
      ok: false,
      error: "Placa inválida (5–8 caracteres alfanuméricos)",
    };
  }
  return { ok: true };
}

export function formatPlateDisplay(plate: string): string {
  return normalizePlate(plate);
}
