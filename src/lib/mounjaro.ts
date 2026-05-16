export const MOUNJARO_DOSE_COLORS: Record<number, string> = {
  2.5:  '#707070',
  5.0:  '#5E2D91',
  7.5:  '#00A88F',
  10.0: '#E4007F',
  12.5: '#007FC3',
};

export const MOUNJARO_DOSES = [2.5, 5.0, 7.5, 10.0, 12.5] as const;

export function getMounjaroDoseColor(dose: number): string {
  return MOUNJARO_DOSE_COLORS[dose] ?? '#8B5CF6';
}
