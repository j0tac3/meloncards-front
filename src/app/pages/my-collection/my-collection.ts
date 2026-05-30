import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CollectionService } from '../../services/collection';
import { GameService } from '../../services/game';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-my-collection',
  standalone: true,
  imports: [RouterLink, FormsModule], 
  templateUrl: './my-collection.html'
})
export class MyCollectionComponent implements OnInit {
  collectionService = inject(CollectionService);
  gameService = inject(GameService);
  platformId = inject(PLATFORM_ID);

  // 🎮 Signals de Juegos
  availableGames = signal<any[]>([]);
  currentGameId = signal<number | null>(null);

  // Estado principal
  isLoading = signal<boolean>(true);
  myCards = signal<any[]>([]);

  // KPIs Calculados automáticamente
  totalPhysicalCards = computed(() => {
    return this.myCards().reduce((acc, card) => acc + (card.quantity || 1), 0);
  });

  uniqueCardsCount = computed(() => {
    return this.myCards().length;
  });

  totalFoilCards = computed(() => {
    return this.myCards().filter(c => c.is_foil).reduce((acc, card) => acc + (card.quantity || 1), 0);
  });

  ngOnInit() {
    this.loadGames(); // 🚀 Ahora cargamos los juegos primero
  }

  // 🎮 Descargar los juegos y leer el último seleccionado
  loadGames() {
    this.gameService.getGames().subscribe({
      next: (games) => {
        this.availableGames.set(games);
        
        if (games.length > 0) {
          let targetGameId = games[0].id;

          if (isPlatformBrowser(this.platformId)) {
            const savedGameId = localStorage.getItem('pref_last_game_id');
            if (savedGameId) {
              const parsedId = Number(savedGameId);
              if (games.some(g => g.id === parsedId)) {
                targetGameId = parsedId;
              }
            }
          }

          this.currentGameId.set(targetGameId);
          this.loadMyCollection(targetGameId);
        }
      },
      error: (err) => console.error('Error cargando juegos', err)
    });
  }

  // 🎮 Evento al cambiar de juego en el selector
  onGameChange(gameValue: any) {
    const gameId = Number(gameValue); 
    if (this.currentGameId() === gameId) return; 
    
    this.currentGameId.set(gameId);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('pref_last_game_id', gameId.toString());
    }
    
    this.loadMyCollection(gameId);
  }

  // Cargar la colección pasando el juego actual
  loadMyCollection(gameId: number) {
    this.isLoading.set(true);
    this.collectionService.getCollection(gameId).subscribe({
      next: (data) => {
        this.myCards.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando colección', err);
        this.isLoading.set(false);
      }
    });
  }
}