import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // 1. Obtener la lista de expansiones (Apunta a /sets)
  getSets(gameId: number): Observable<any[]> {
    let params = new HttpParams().set('game_id', gameId.toString());
    return this.http.get<any[]>(`${this.apiUrl}/sets`, { params });
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