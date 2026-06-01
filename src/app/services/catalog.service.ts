import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // 1. Obtener la lista de expansiones (Apunta a /sets)
  // En tu catalog.service.ts
getSets(gameId: number, region: string = 'en') {
    // Asegúrate de que la URL apunta a tu backend correctamente
    return this.http.get<any[]>(`${this.apiUrl}/sets?game_id=${gameId}&region=${region}`);
  }

  // 2. Obtener el catálogo filtrado y paginado (Apunta a /cards)
  getCards(search: string = '', page: number = 1, setId: number | null = null, gameId: number | null = null): Observable<any> {
    let params = new HttpParams().set('page', page.toString());
    
    if (search) params = params.set('search', search);
    if (setId) params = params.set('card_set_id', setId.toString());
    if (gameId) params = params.set('game_id', gameId.toString()); // <-- El nuevo filtro vital

    return this.http.get<any>(`${this.apiUrl}/cards`, { params });
  }

  // 3. Obtener el detalle de una carta (Apunta a /cards/{id})
  getCardById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cards/${id}`);
  }
}