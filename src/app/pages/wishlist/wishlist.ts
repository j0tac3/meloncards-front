import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { WishlistService } from '../../services/wishlist';
import { GameService } from '../../services/game';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser, CurrencyPipe } from '@angular/common'; // Adiós FormsModule 👋
import { CardComponent } from '../../components/card/card';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, CardComponent],
  templateUrl: './wishlist.html'
})
export class WishlistComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  private gameService = inject(GameService);
  private platformId = inject(PLATFORM_ID);

  // 🎮 Signals de Juegos
  availableGames = signal<any[]>([]);
  currentGameId = signal<number | null>(null);

  // Estado principal
  isLoading = signal<boolean>(true);
  wishlistedCards = signal<any[]>([]);

  // Filtros
  searchTerm = signal<string>('');
  selectedSetFilter = signal<string>('all');
  sortBy = signal<string>('newest');

  // Computed: Game Slug
  gameSlug = computed(() => {
    const games = this.availableGames();
    const currentId = this.currentGameId();
    const activeGame = games.find(g => g.id === currentId);
    return activeGame?.slug || 'default';
  });

  // Computed: Available Sets
  availableSets = computed(() => {
    const setNames = new Set<string>();
    this.wishlistedCards().forEach(c => {
      if (c.set_name) setNames.add(c.set_name);
    });
    return Array.from(setNames).sort();
  });

  // Computed: KPIs
  totalWishlistValue = computed(() => {
    return this.wishlistedCards().reduce((acc, card) => acc + (card.market_price || 0), 0);
  });

  // Computed: Filtrado y Ordenación
  processedCards = computed(() => {
    let cards = [...this.wishlistedCards()];
    const search = this.searchTerm().trim().toLowerCase();
    const setFilter = this.selectedSetFilter();
    const order = this.sortBy();

    if (search) {
      cards = cards.filter(c => 
        (c.name && c.name.toLowerCase().includes(search)) || 
        (c.card_number && c.card_number.toLowerCase().includes(search))
      );
    }

    if (setFilter !== 'all') {
      cards = cards.filter(c => c.set_name === setFilter);
    }

    cards.sort((a, b) => {
      if (order === 'price_desc') return (b.market_price || 0) - (a.market_price || 0);
      if (order === 'price_asc') return (a.market_price || 0) - (b.market_price || 0);
      if (order === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      return 0; // 'newest' se mantiene por el orden del backend
    });

    return cards;
  });

  ngOnInit() {
    this.loadGames();
  }

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
              if (games.some(g => g.id === parsedId)) targetGameId = parsedId;
            }
          }
          this.currentGameId.set(targetGameId);
          this.loadWishlist(targetGameId);
        }
      },
      error: (err) => console.error('Error cargando juegos', err)
    });
  }

  onGameChange(gameValue: any) {
    const gameId = Number(gameValue); 
    if (this.currentGameId() === gameId) return; 
    
    this.currentGameId.set(gameId);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('pref_last_game_id', gameId.toString());
    }
    
    this.selectedSetFilter.set('all');
    this.loadWishlist(gameId);
  }

  loadWishlist(gameId: number) {
    this.isLoading.set(true);
    this.wishlistService.getWishlist(gameId).subscribe({
      next: (data) => {
        this.wishlistedCards.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando wishlist', err);
        this.isLoading.set(false);
      }
    });
  }

  // 🚀 NUEVO Y BLINDADO: Escuchamos el evento de la carta
  onWishlistChange(event: { id: number | string, isWishlisted: boolean }) {
    if (!event.isWishlisted) {
      // Forzamos a que ambos IDs sean números para evitar problemas de tipos débiles (string vs number)
      const targetId = Number(event.id);
      this.wishlistedCards.update(cards => cards.filter(c => Number(c.id) !== targetId));
    }
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
}