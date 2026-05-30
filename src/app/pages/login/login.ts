import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // -- Signals de Estado --
  isLoginMode = signal<boolean>(true); // true = Login, false = Registro
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  // -- Datos del Formulario --
  formData = {
    name: '',
    email: '',
    password: ''
  };

  // Alternar entre modos
  toggleMode() {
    this.isLoginMode.update(mode => !mode);
    this.errorMessage.set(''); // Limpiamos errores al cambiar de pestaña
  }

  onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    if (this.isLoginMode()) {
      // --- FLUJO DE INICIAR SESIÓN ---
      const credentials = { email: this.formData.email, password: this.formData.password };
      
      this.authService.login(credentials).subscribe({
        next: () => {
          this.isLoading.set(false);
          // Redirigimos al catálogo y forzamos recarga para que el Navbar actualice el estado
          this.router.navigate(['/catalog']).then(() => {
            window.location.reload();
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set('Credenciales incorrectas o error de conexión.');
          console.error(err);
        }
      });
    } else {
      // --- FLUJO DE REGISTRO ---
      if (!this.formData.name.trim()) {
        this.errorMessage.set('El nombre es obligatorio para el registro.');
        this.isLoading.set(false);
        return;
      }

      this.authService.register(this.formData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/catalog']).then(() => {
            window.location.reload();
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set('Error al registrar la cuenta. Es posible que el email ya esté en uso.');
          console.error(err);
        }
      });
    }
  }
}