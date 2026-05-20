/**
 * Intenta cargar el logo fiscal como data URL para incrustar en jsPDF.
 * Si no hay logo, retorna null (el PDF dibuja un placeholder).
 */
export async function loadFiscalLogoDataUrl(): Promise<string | null> {
  try {
    const configRes = await fetch("/api/fiscal-config");
    if (!configRes.ok) return null;

    const config = (await configRes.json()) as { logoPath?: string | null };
    const logoPath = config?.logoPath?.trim();
    if (!logoPath) return null;

    const url = logoPath.startsWith("http") ? logoPath : logoPath;
    const imgRes = await fetch(url);
    if (!imgRes.ok) return null;

    const blob = await imgRes.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
