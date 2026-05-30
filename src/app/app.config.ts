import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor';

// 🚀 NUEVO: Importaciones para el idioma español
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// 🚀 NUEVO: Registramos el idioma antes de arrancar la app
registerLocaleData(localeEs, 'es-ES');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(), 
      withInterceptors([authInterceptor])
    ),
    // 🚀 NUEVO: Le decimos a Angular que use español por defecto en toda la app
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ]
};