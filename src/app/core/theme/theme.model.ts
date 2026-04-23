export type ThemeName = 'classic-amber' | 'phosphor-green' | 'crt-blue';

export interface AppTheme {
  name: ThemeName;
  label: string;
}

export const APP_THEMES: AppTheme[] = [
  { name: 'classic-amber', label: 'Classic Amber' },
  { name: 'phosphor-green', label: 'Phosphor Green' },
  { name: 'crt-blue', label: 'CRT Blue' },
];
