import {
  Component, OnInit, OnDestroy, inject,
  signal, computed, PLATFORM_ID, HostListener
} from '@angular/core';
import { CollectionService } from '../../services/collection';
import { GameService } from '../../services/game';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, CurrencyPipe } from '@angular/common';
import { CardComponent } from '../../components/card/card';
import { CollectionModalComponent } from '../../components/collection-modal/collection-modal';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-my-collection',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, CardComponent, CollectionModalComponent],
  templateUrl: './my-collection.html'
})
export class MyCollectionComponent implements OnInit, OnDestroy {

  // ── Servicios ────────────────────────────────────────────────────────────────
  private collectionService = inject(CollectionService);
  private gameService       = inject(GameService);
  private platformId        = inject(PLATFORM_ID);
  private destroy$          = new Subject<void>();
  private searchSubject     = new Subject<string>();

  // ── Juegos ───────────────────────────────────────────────────────────────────
  availableGames = signal<any[]>([]);
  currentGameId  = signal<number | null>(null);

  // ── KPIs (calculados en backend) ─────────────────────────────────────────────
  collectionStats = signal({ physical: 0, unique: 0, foil: 0, vault: 0 });

  // ── Modal ────────────────────────────────────────────────────────────────────
  selectedCard = signal<any | null>(null);

  // ── Búsqueda ─────────────────────────────────────────────────────────────────
  searchTerm    = signal<string>('');
  isSearching   = computed(() => this.searchTerm().trim().length > 0);

  // ── Estado 1: Escaparate (Dashboard con carruseles por set) ──────────────────
  dashboardSets    = signal<any[]>([]);
  dashCurrentPage  = signal<number>(1);
  dashHasMore      = signal<boolean>(true);
  isDashLoading    = signal<boolean>(false);

  // ── Estado 2: Resultados de búsqueda ─────────────────────────────────────────
  searchResults       = signal<any[]>([]);
  searchCurrentPage   = signal<number>(1);
  searchHasMore       = signal<boolean>(true);
  isSearchLoading     = signal<boolean>(false);

  // ── Computed: slug del juego activo (para temas visuales de la carta) ─────────
  gameSlug = computed(() => {
    const game = this.availableGames().find(g => g.id === this.currentGameId());
    return game?.slug ?? 'default';
  });

  // ── Computed: navegación dentro del modal ─────────────────────────────────────
  // El modal navega sobre los resultados de búsqueda activos, o sobre las cartas
  // del set expandido. Como ahora el modal se abre desde cualquier carrusel,
  // usamos searchResults cuando buscamos, y una lista plana del dashboard en otro caso.
  private modalCards = computed(() =>
    this.isSearching() ? this.searchResults() : this.dashboardSets().flatMap(s => s.recent_cards ?? [])
  );

  currentIndex = computed(() => {
    const current = this.selectedCard();
    if (!current) return -1;
    return this.modalCards().findIndex(c => c.collection_id === current.collection_id);
  });

  hasPrev = computed(() => this.currentIndex() > 0);
  hasNext = computed(() => this.currentIndex() < this.modalCards().length - 1);

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.loadGames();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Scroll infinito del escaparate ───────────────────────────────────────────
  @HostListener('window:scroll')
  onScroll() {
    if (this.isSearching() || this.isDashLoading() || !this.dashHasMore()) return;

    const scrolled    = window.innerHeight + window.scrollY;
    const totalHeight = document.documentElement.scrollHeight;

    if (scrolled >= totalHeight - 300) {
      this.loadDashboardSets(this.currentGameId()!, this.dashCurrentPage() + 1);
    }
  }

  // ── Búsqueda con debounce ─────────────────────────────────────────────────────
  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      if (!term.trim()) {
        this.searchResults.set([]);
      } else {
        this.loadSearchResults(this.currentGameId()!, term, 1);
      }
    });
  }

  onSearchInput(term: string) {
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  // ── Juegos ────────────────────────────────────────────────────────────────────
  loadGames() {
    this.gameService.getGames().subscribe({
      next: (games) => {
        this.availableGames.set(games);
        if (!games.length) return;

        let targetId = games[0].id;
        
        // 1. Solo leemos el localStorage si estamos en el navegador
        if (isPlatformBrowser(this.platformId)) {
          const saved = Number(localStorage.getItem('pref_last_game_id'));
          if (saved && games.some(g => g.id === saved)) targetId = saved;
        }

        this.currentGameId.set(targetId);
        
        // 2. ✅ EL FIX: Solo pedimos los datos privados si estamos en el navegador
        if (isPlatformBrowser(this.platformId)) {
          this.loadDashboardSets(targetId, 1);
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
      localStorage.setItem('pref_last_game_id', String(gameId));
    }

    this.searchTerm.set('');
    this.searchResults.set([]);
    this.dashCurrentPage.set(1);
    this.loadDashboardSets(gameId, 1);
  }

  // ── Escaparate ────────────────────────────────────────────────────────────────
  loadDashboardSets(gameId: number, page: number = 1) {
    this.isDashLoading.set(true);

    this.collectionService.getDashboardSets(gameId, page).subscribe({
      next: (response) => {
        if (page === 1) {
          this.dashboardSets.set(response.data);
          if (response.stats) this.collectionStats.set(response.stats);
        } else {
          this.dashboardSets.update(sets => [...sets, ...response.data]);
        }
        this.dashCurrentPage.set(response.current_page);
        this.dashHasMore.set(response.has_more_pages);
        this.isDashLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando escaparate', err);
        this.isDashLoading.set(false);
      }
    });
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────────────
  loadSearchResults(gameId: number, term: string, page: number = 1) {
    this.isSearchLoading.set(true);
    if (page === 1) this.searchResults.set([]);

    this.collectionService.searchCollectionCards(gameId, term, page).subscribe({
      next: (response) => {
        if (page === 1) {
          this.searchResults.set(response.data);
        } else {
          this.searchResults.update(cards => [...cards, ...response.data]);
        }
        this.searchCurrentPage.set(response.current_page);
        this.searchHasMore.set(response.has_more_pages);
        this.isSearchLoading.set(false);
      },
      error: (err) => {
        console.error('Error buscando cartas', err);
        this.isSearchLoading.set(false);
      }
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────────────
  openModal(card: any)  { this.selectedCard.set(card); }
  closeModal()          { this.selectedCard.set(null); }

  onNavigate(direction: 'prev' | 'next') {
    const index = this.currentIndex();
    const cards = this.modalCards();
    if (index === -1) return;

    const next = direction === 'next' ? index + 1 : index - 1;
    if (next >= 0 && next < cards.length) {
      this.selectedCard.set(cards[next]);
    }
  }

  // ── Favoritos ─────────────────────────────────────────────────────────────────
  onFavoriteChange(event: { id: number; isFavorite: boolean }) {
    this.collectionService.toggleFavorite(event.id).subscribe({
      error: () => {
        // Revertir en dashboard
        const sets = this.dashboardSets();
        for (const set of sets) {
          const card = set.recent_cards?.find((c: any) => c.collection_id === event.id);
          if (card) { card.is_favorite = !event.isFavorite; break; }
        }
      }
    });
  }
}
