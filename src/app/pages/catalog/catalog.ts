import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
// 🚀 ELIMINADO: FormsModule (Para ser 100% Angular 18 purista)
import { CatalogService } from '../../services/catalog.service';
import { AuthService } from '../../services/auth.service';
import { CollectionService } from '../../services/collection';
import { GameService } from '../../services/game'; 
import { CollectionModalComponent } from '../../components/collection-modal/collection-modal';
import { CardComponent } from '../../components/card/card';
import { SearchBarComponent } from '../../components/search-bar/search-bar';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CardService } from '../../services/card'; // Ajusta la ruta a tu proyecto

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CollectionModalComponent, CardComponent, SearchBarComponent],
  templateUrl: './catalog.html'
})
export class CatalogComponent implements OnInit {
  cardService = inject(CardService);

  route = inject(ActivatedRoute);

  catalogService = inject(CatalogService);
  authService = inject(AuthService);
  collectionService = inject(CollectionService); 
  gameService = inject(GameService); 
  platformId = inject(PLATFORM_ID);

  availableGames = signal<any[]>([]);
  currentGameId = signal<number | null>(null);

  currentGameSlug = computed(() => {
    const id = this.currentGameId();
    const games = this.availableGames();
    if (!id || !games.length) return 'default';
    const game = games.find(g => g.id === id);
    return game ? game.slug : 'default';
  });

  currentSearch = signal<string>('');
  currentSetId = signal<number | null>(null);
  availableSets = signal<any[]>([]);

  isModalOpen = signal<boolean>(false);
  selectedCard = signal<any>(null);
  
  cards = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  currentPage = signal<number>(1);
  lastPage = signal<number>(1);

  isAuthenticated = signal<boolean>(false);

  availableRegions = signal<any[]>([]);
  currentRegion = signal<string>('en');

  cardStates = signal<any[]>([]); 
  ownedCopies = signal<any[]>([]); 
  isCheckingCopies = signal<boolean>(false); 

  formStateId = signal<number | null>(null);
  formLanguage = signal<string>('es');
  formIsFoil = signal<boolean>(false);

  hasPrevCard = computed(() => {
    const current = this.selectedCard();
    if (!current) return false;
    return this.cards().findIndex(c => c.id === current.id) > 0;
  });

  hasNextCard = computed(() => {
    const current = this.selectedCard();
    if (!current) return false;
    const idx = this.cards().findIndex(c => c.id === current.id);
    return idx >= 0 && idx < this.cards().length - 1;
  });

  handleFilterChange(filters: { search: string; card_set_id: number | null }) {
    this.currentSearch.set(filters.search);
    this.currentSetId.set(filters.card_set_id);
    this.loadCards(1); 
  }

  visiblePages = computed(() => {
    const current = this.currentPage();
    const last = this.lastPage();
    const pages: (number | string)[] = [];
    if (last >= 1) pages.push(1);
    if (last >= 2) pages.push(2);
    let startPivot = Math.max(3, current - 1);
    let endPivot = Math.min(last, current + 1);
    if (startPivot > 3) pages.push('...');
    for (let i = startPivot; i <= endPivot; i++) pages.push(i);
    if (endPivot < last) {
      if (endPivot < last - 1) pages.push('...');
      pages.push(last);
    }
    return pages;
  });

  ngOnInit() {
    // 1. Lo que ya tenías (se ejecuta normal)
    this.isAuthenticated.set(this.authService.isAuthenticated());
    this.loadGameSettings(); 
    this.loadGames(); 
    this.loadCardStates();

    // 2. 🚀 NUEVO: Escuchar si venimos de la pantalla de Sets
    this.route.queryParams.subscribe(params => {
      const setIdFromUrl = params['set'];

      if (setIdFromUrl) {
        // ACTUALIZA AQUÍ el nombre de tu variable. 
        // Si usas una señal para guardar el ID de la caja seleccionada, ponlo aquí.
        this.currentSetId.set(Number(setIdFromUrl)); 
        
        // ⚠️ IMPORTANTE: Aquí debes llamar a tu función que carga las cartas
        // Por ejemplo: this.applyFilters() o this.loadCards()
        this.loadCards(); 
      }
    });
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
          this.loadSetsForGame(targetGameId);
          this.loadCards(1);
        }
      },
      error: (err) => console.error('Error cargando juegos', err)
    });
  }

  // 🚀 ADAPTADO: Ahora recibe el Evento Nativo en lugar de Any/NgModel
  onGameChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const gameId = Number(select.value); 

    if (this.currentGameId() === gameId) return; 
    
    this.currentGameId.set(gameId);
    this.currentSetId.set(null); 
    this.currentPage.set(1);     
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('pref_last_game_id', gameId.toString());
    }
    
    this.loadSetsForGame(gameId);
    this.loadCards(1);
  }

  loadGameSettings() {
    this.gameService.getGame('one-piece').subscribe({
      next: (gameData: any) => {
        this.availableRegions.set(gameData?.regions || []);
        if (isPlatformBrowser(this.platformId)) {
          const savedRegion = localStorage.getItem('pref_region_one-piece');
          if (savedRegion) {
            this.currentRegion.set(savedRegion);
            return; 
          }
        } 
        if (this.availableRegions().length > 0) {
          const hasEnglish = this.availableRegions().find((r: any) => r.code === 'en');
          this.currentRegion.set(hasEnglish ? 'en' : this.availableRegions()[0].code);
        }
      }
    });
  }

  // 🚀 ADAPTADO: Ahora recibe el Evento Nativo
  onRegionChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newRegion = select.value;
    
    this.currentRegion.set(newRegion);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('pref_region_one-piece', newRegion);
    }
  }

  loadSetsForGame(gameId: number) {
    this.catalogService.getSets(gameId).subscribe({
      next: (sets) => this.availableSets.set(sets)
    });
  }

  loadCards(page: number = 1) {
    this.isLoading.set(true);
    this.catalogService.getCards(this.currentSearch(), page, this.currentSetId(), this.currentGameId()).subscribe({
      next: (response) => {
        this.cards.set(response?.data || []);
        this.currentPage.set(response?.current_page || 1);
        this.lastPage.set(response?.last_page || 1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando cartas', err);
        this.isLoading.set(false);
      }
    });
  }

  handleSearch(term: string) {
    this.currentSearch.set(term);
    this.loadCards(1); 
  }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page !== this.currentPage()) this.loadCards(page);
  }
  
  nextPage() {
    if (this.currentPage() < this.lastPage()) this.loadCards(this.currentPage() + 1);
  }
  
  prevPage() {
    if (this.currentPage() > 1) this.loadCards(this.currentPage() - 1);
  }

  loadCardStates() {
    this.collectionService.getCardStates().subscribe({
      next: (states) => {
        this.cardStates.set(states);
        const defaultState = states.find((s: any) => s.slug === 'near-mint') || states[0];
        if (defaultState) this.formStateId.set(defaultState.id);
      }
    });
  }

  openModal(card: any) {
    this.selectedCard.set(card);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedCard.set(null);
  }

  navigateModal(direction: 'prev' | 'next') {
    const current = this.selectedCard();
    if (!current) return;
    
    const idx = this.cards().findIndex(c => c.id === current.id);
    
    if (direction === 'prev' && idx > 0) {
      this.selectedCard.set(this.cards()[idx - 1]);
    } else if (direction === 'next' && idx < this.cards().length - 1) {
      this.selectedCard.set(this.cards()[idx + 1]);
    }
  }

  saveToCollection() {
    if (!this.formStateId()) return; 
    const payload = {
      card_template_id: this.selectedCard().id,
      card_state_id: this.formStateId(),
      language: this.formLanguage(),
      is_foil: this.formIsFoil(),
      quantity: 1
    };
    this.collectionService.addToCollection(payload).subscribe({
      next: (newCopy) => {
        const stateName = this.cardStates().find(s => s.id === this.formStateId())?.name;
        const copyToDisplay = { ...newCopy.data, card_state: { name: stateName } };
        this.ownedCopies.update(copies => [...copies, copyToDisplay]);
        this.formIsFoil.set(false);
      }
    });
  }

  deleteCopy(userCardId: number) {
    this.collectionService.removeFromCollection(userCardId).subscribe({
      next: () => this.ownedCopies.update(copies => copies.filter(c => c.id !== userCardId))
    });
  }

  refreshSpecificCard(cardId: number) {
    this.collectionService.getOwnedCount(cardId).subscribe({
      next: (res) => {
        this.cards.update(currentCards => 
          currentCards.map(card => 
            card.id === cardId ? { ...card, owned_copies: res.owned_copies } : card                                        
          )
        );
      }
    });
  }

  handleDownloadPdf(setId: number) {
    // Buscamos el Set en el array que ya tenemos cargado
    const setSeleccionado = this.availableSets().find(s => s.id === setId);
    
    if (setSeleccionado && setSeleccionado.code) {
      // Llamamos al servicio para descargar el PDF
      this.cardService.descargarChecklist(setSeleccionado.code);
    }
  }
}