import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    // Restaura tema salvo no LocalStorage (somente no browser)
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('ford_theme');
      this.isDarkMode.set(saved === 'dark');
    }

    // Aplica a classe no <body> sempre que o sinal mudar
    effect(() => {
      if (typeof document !== 'undefined') {
        const body = document.body;
        if (this.isDarkMode()) {
          body.classList.add('theme-dark');
          body.classList.remove('theme-light');
          localStorage.setItem('ford_theme', 'dark');
        } else {
          body.classList.add('theme-light');
          body.classList.remove('theme-dark');
          localStorage.setItem('ford_theme', 'light');
        }
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update(v => !v);
  }
}
