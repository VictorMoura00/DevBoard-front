export type ThemeName =
  | 'classic-amber'
  | 'phosphor-green'
  | 'crt-blue'
  | 'dark-amber'
  | 'synthwave'
  | 'solar-sepia';

export interface AppTheme {
  name:   ThemeName;
  label:  string;
  accent: string;
  dark?:  boolean;
}

export const APP_THEMES: AppTheme[] = [
  { name: 'classic-amber',  label: 'Classic Amber',   accent: '#ffb000' },
  { name: 'phosphor-green', label: 'Phosphor Green',  accent: '#29c85f' },
  { name: 'crt-blue',       label: 'CRT Blue',        accent: '#2f7de1' },
  { name: 'dark-amber',     label: 'Dark Amber',      accent: '#ffb000', dark: true },
  { name: 'synthwave',      label: 'Synthwave',       accent: '#ff2d78', dark: true },
  { name: 'solar-sepia',    label: 'Solar Sepia',     accent: '#e8a020', dark: true },
];
