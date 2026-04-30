export const PROVINCE_NAME_ALIASES: Record<string, string> = {
  // Legacy aliases
  'Province 1': 'Koshi Province',
  'Province 2': 'Madhesh Province',
  Bagmati: 'Bagmati Province',
  Gandaki: 'Gandaki Province',
  Lumbini: 'Lumbini Province',
  Karnali: 'Karnali Province',
  Sudurpaschim: 'Sudurpashchim Province',

  // Custom GeoJSON PR_NAME values
  'Province No 1': 'Koshi Province',
  'Province No 2': 'Madhesh Province',
  'Province No 5': 'Lumbini Province',
  'Bagmati Pradesh': 'Bagmati Province',
  'Gandaki Pradesh': 'Gandaki Province',
  'Karnali Pradesh': 'Karnali Province',
  'Sudurpashchim Pradesh': 'Sudurpashchim Province',
};

export function toCanonicalProvinceName(name: string | null | undefined): string {
  if (!name) {
    return '';
  }

  return PROVINCE_NAME_ALIASES[name.trim()] ?? name.trim();
}
