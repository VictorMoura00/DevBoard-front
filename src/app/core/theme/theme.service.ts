import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

import { APP_THEMES, ThemeName } from './theme.model';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly themes = APP_THEMES;
  readonly currentTheme = signal<ThemeName>('classic-amber');

  constructor() {
    effect(() => {
      this.document.documentElement.dataset['theme'] = this.currentTheme();
    });
  }

  setTheme(theme: ThemeName): void {
    this.currentTheme.set(theme);
  }
}
