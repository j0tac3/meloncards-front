import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID); // <-- Inyectamos el ID de la plataforma
  private apiUrl = environment.apiUrl;
  private tokenKey = 'tcg_token';

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.access_token) {
          this.setToken(response.access_token);
        }
      })
    );
  }

  register(userData: any) {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.access_token) {
          this.setToken(response.access_token);
        }
      })
    );
  }

  setToken(token: string) {
    // Solo guardamos si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    // Solo leemos si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}