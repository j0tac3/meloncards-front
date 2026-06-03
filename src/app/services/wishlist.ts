import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private http = inject(HttpClient);
  // Usa el endpoint exacto que sale en tu error
  private apiUrl = environment.apiUrl;

  // Añade este método debajo del que ya tienes (toggleWishlist)
  getWishlist(gameId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/wishlist`, {
      params: { game_id: gameId.toString() }
    });
  }

  toggleWishlist(cardId: number | string): Observable<{status: string, message: string}> {
    
    // 🛡️ NUEVO: Obligamos a Laravel a devolver siempre JSON
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    return this.http.post<{status: string, message: string}>(
      `${this.apiUrl}/wishlist/toggle`, 
      { card_id: cardId },
      { headers }
    );
  }
}