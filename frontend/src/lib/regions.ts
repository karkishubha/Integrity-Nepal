export const PROVINCE_NAME_ALIASES: Record<string, string> = {
  'Province 1': 'Koshi Province',
  'Province 2': 'Madhesh Province',
  Bagmati: 'Bagmati Province',
  Gandaki: 'Gandaki Province',
  Lumbini: 'Lumbini Province',
  Karnali: 'Karnali Province',
  Sudurpaschim: 'Sudurpashchim Province',
};

export function toCanonicalProvinceName(name: string | null | undefined): string {
  if (!name) {
    return '';
  }

  return PROVINCE_NAME_ALIASES[name.trim()] ?? name.trim();
}
