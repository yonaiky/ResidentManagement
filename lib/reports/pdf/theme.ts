/** Colores alineados con el tema del sistema (primary ~ #2563eb) */
export const PDF_THEME = {
  primary: [37, 99, 235] as [number, number, number],
  primaryDark: [30, 64, 175] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  surface: [248, 250, 252] as [number, number, number],
  surfaceAlt: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  status: {
    success: { bg: [220, 252, 231] as [number, number, number], text: [22, 101, 52] as [number, number, number] },
    warning: { bg: [254, 249, 195] as [number, number, number], text: [161, 98, 7] as [number, number, number] },
    danger: { bg: [254, 226, 226] as [number, number, number], text: [185, 28, 28] as [number, number, number] },
    neutral: { bg: [241, 245, 249] as [number, number, number], text: [71, 85, 105] as [number, number, number] },
  },
} as const;

export const PDF_LAYOUT = {
  margin: 14,
  logoSize: 26,
  headerHeight: 38,
  summaryHeight: 28,
  footerHeight: 14,
  font: {
    title: 18,
    subtitle: 11,
    meta: 9,
    summaryLabel: 8,
    summaryValue: 11,
    table: 8,
    tableHead: 8.5,
    footer: 8,
  },
} as const;
