import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // 🚀 NUEVO: Obtener la colección filtrando por Juego
  getCollection(gameId?: number, page: number = 1): Observable<any> {
    let params = new HttpParams().set('page', page.toString());
    if (gameId) {
      params = params.set('game_id', gameId.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/collection`, { params });
  }

  // 1. Obtener la lista maestra de estados (Mint, Near Mint...)
  getCardStates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/card-states`);
  }

  // 2. Comprobar si el usuario ya tiene copias de una carta
  checkOwnedCopies(templateId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/collection/check/${templateId}`);
  }

  // 3. Añadir una nueva copia a la colección
  addToCollection(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/collection`, data);
  }

  // 4. Eliminar una copia específica
  removeFromCollection(userCardId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/collection/${userCardId}`);
  }

  getOwnedCount(cardId: number) {
    return this.http.get<{owned_copies: number}>(`${this.apiUrl}/collection/count/${cardId}`);
  }

  toggleFavorite(collectionId: number) {
    return this.http.post<{is_favorite: boolean, message: string}>(
      `${this.apiUrl}/collection/${collectionId}/favorite`, 
      {}
    );
  }
}