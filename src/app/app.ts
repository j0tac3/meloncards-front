import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { RouterOutlet, RouterModule, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, RouterLinkActive], 
  templateUrl: './app.html'
})
export class App implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  
  isAuthenticated = signal<boolean>(false);
  isSidebarExpanded = signal<boolean>(true);

  // Señal del tema
  isDarkMode = signal<boolean>(false);
  
  isMobileSidebarOpen = signal<boolean>(false);

  constructor() {
    // 1. Al cargar la app, leemos si el index.html ya puso la clase 'dark'
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      this.isDarkMode.set(isDark);
    }

    // 2. EFECTO: Angular vigilará esta señal. Si cambia, aplica la clase y guarda en localStorage
    effect(() => {
      if (typeof window !== 'undefined') {
        const dark = this.isDarkMode();
        if (dark) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      }
    });
  }
  
  toggleSidebar() {
    this.isSidebarExpanded.set(!this.isSidebarExpanded());
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.set(!this.isMobileSidebarOpen());
  }

  toggleTheme() {
    // 🚀 Simplificado: Como tenemos un 'effect', solo cambiamos el valor de la señal.
    // El efecto se disparará solo y hará el resto del trabajo.
    this.isDarkMode.update(dark => !dark);
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen.set(false);
  }

  ngOnInit() {
    this.isAuthenticated.set(this.authService.isAuthenticated());
  }

  logout() {
    this.authService.logout();
    this.isAuthenticated.set(false);
    this.router.navigate(['/catalog']).then(() => {
      window.location.reload();
    });
  }
}