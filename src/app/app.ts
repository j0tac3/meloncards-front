import { Component, inject, signal, OnInit } from '@angular/core';
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

  isDarkMode = signal<boolean>(false);
  
  // 🚀 AÑADIDO: Control del menú lateral en móviles
  isMobileSidebarOpen = signal<boolean>(false);
  
  toggleSidebar() {
    this.isSidebarExpanded.set(!this.isSidebarExpanded());
  }

  // 🚀 AÑADIDO: Métodos para abrir/cerrar el menú en móvil
  toggleMobileSidebar() {
    this.isMobileSidebarOpen.set(!this.isMobileSidebarOpen());
  }

  toggleTheme() {
    this.isDarkMode.set(!this.isDarkMode());
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
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