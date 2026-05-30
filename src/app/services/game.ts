import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  // Ajusta esta URL según tu entorno local
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Llama a tu Laravel y pide el juego con sus regiones
  getGame(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/games/${slug}`);
  }

  // Obtiene la lista completa de juegos (Pokémon TCG, One Piece TCG, etc.)
  getGames(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/games`);
  }
}