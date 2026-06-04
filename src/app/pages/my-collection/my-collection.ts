import { Component, OnInit, inject, signal, computed, PLATFORM_ID, untracked } from '@angular/core';
import { CollectionService } from '../../services/collection';
import { GameService } from '../../services/game';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, CurrencyPipe } from '@angular/common';
// 🚀 Importación de componentes y utilidades reutilizables
import { CardComponent } from '../../components/card/card'; 
import { CollectionModalComponent } from '../../components/collection-modal/collection-modal';

@Component({
  selector: 'app-my-collection',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, CardComponent, CollectionModalComponent], 
  templateUrl: './my-collection.html'
})
export class MyCollectionComponent implements OnInit {
  collectionService = inject(CollectionService);
  gameService = inject(GameService);
  platformId = inject(PLATFORM_ID);

  // 🎮 Signals de Juegos
  availableGames = signal<any[]>([]);
  currentGameId = signal<number | null>(null);
  vaultValue = signal<number>(0);

  // Estado principal
  isLoading = signal<boolean>(true);
  myCards = signal<any[]>([]);

  // 🚀 Control de visualización del Modal de inventario activo
  selectedCard = signal<any | null>(null);

  // 🚀 Estados de control para la barra de herramientas (Toolbar)
  searchTerm = signal<string>('');
  selectedSetFilter = signal<string>('all');
  sortBy = signal<string>('newest');

  // 🚀 Listado de expansiones cerradas/colapsadas por el usuario
  collapsedSets = signal<string[]>([]);

  showOnlyFavorites = signal<boolean>(false);

  groupedBySet = computed(() => {
    const cards = this.processedCards();
    const groupsMap = new Map<string, { set_name: string; set_total: number; unique_count: number; total_value: number; cards: any[] }>();

    cards.forEach(card => {
      const setName = card.set_name || 'Otros';
      if (!groupsMap.has(setName)) {
        groupsMap.set(setName, {
          set_name: setName,
          set_total: card.set_total || 0,
          unique_count: 0,
          total_value: 0,
          cards: []
        });
      }
      const group = groupsMap.get(setName)!;
      group.cards.push(card);
      group.total_value += (card.market_price || 0) * (card.quantity || 1);
    });

    const finalGroups = Array.from(groupsMap.values());

    // 🔥 EL TRUCO: Cuando se calculan los grupos, los metemos todos en la lista de "colapsados"
    // Usamos untracked para no crear un bucle infinito de reactividad
    untracked(() => {
      this.collapsedSets.set(finalGroups.map(g => g.set_name));
    });

    finalGroups.forEach(group => {
      group.unique_count = group.cards.length;
    });

    return finalGroups;
  });

  // 🎮 Deducción automática del slug del juego para renderizar los temas estéticos de las tarjetas
  gameSlug = computed(() => {
    const games = this.availableGames();
    const currentId = this.currentGameId();
    const activeGame = games.find(g => g.id === currentId);
    return activeGame?.slug || 'default';
  });

  // 🚀 Listado único de expansiones presentes en el baúl del usuario para alimentar el filtro
  availableSets = computed(() => {
    const cards = this.myCards();
    const setNames = new Set<string>();
    cards.forEach(c => {
      if (c.set_name) setNames.add(c.set_name);
    });
    return Array.from(setNames).sort();
  });

  // KPIs Calculados automáticamente (Mantenidos y optimizados)
  totalPhysicalCards = computed(() => {
    return this.myCards().reduce((acc, card) => acc + (card.quantity || 1), 0);
  });

  uniqueCardsCount = computed(() => {
    return this.myCards().length;
  });

  totalFoilCards = computed(() => {
    return this.myCards().filter(c => c.is_foil).reduce((acc, card) => acc + (card.quantity || 1), 0);
  });

  // 🚀 Nuevo KPI: Valor total de la cartera acumulada en el juego seleccionado
  /* totalCollectionValue = computed(() => {
    return this.myCards().reduce((acc, card) => acc + ((card.market_price || 0) * (card.quantity || 1)), 0);
  }); */

  // 🚀 Aplicación de criterios de búsqueda, filtros y ordenación sobre la colección original
  processedCards = computed(() => {
    let cards = [...this.myCards()];
    const search = this.searchTerm().trim().toLowerCase();
    const setFilter = this.selectedSetFilter();
    const order = this.sortBy();

    // 1. Filtrado por buscador por texto (Nombre o código identificador de carta)
    if (search) {
      cards = cards.filter(c => 
        (c.name && c.name.toLowerCase().includes(search)) || 
        (c.card_number && c.card_number.toLowerCase().includes(search))
      );
    }

    // 2. Filtrado por expansión específica
    if (setFilter !== 'all') {
      cards = cards.filter(c => c.set_name === setFilter);
    }

    // 3. Ordenación de resultados
    cards.sort((a, b) => {
      if (order === 'price_desc') return (b.market_price || 0) - (a.market_price || 0);
      if (order === 'price_asc') return (a.market_price || 0) - (b.market_price || 0);
      if (order === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      // 'newest' -> Orden inverso por su id de registro en base de datos
      return (b.collection_id || 0) - (a.collection_id || 0);
    });

    if (this.showOnlyFavorites()) {
      cards = cards.filter(c => c.is_favorite);
    }

    return cards;
  });

  

  // 🚀 Lógica de navegación interna del modal (Sincronizada con el orden de filtrado actual)
  currentIndex = computed(() => {
    const current = this.selectedCard();
    if (!current) return -1;
    return this.processedCards().findIndex(c => c.collection_id === current.collection_id);
  });

  hasPrev = computed(() => this.currentIndex() > 0);
  hasNext = computed(() => this.currentIndex() < this.processedCards().length - 1);

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
          this.loadMyCollection(targetGameId);
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
    
    // Reseteamos filtros al conmutar de juego para evitar colisiones de datos
    this.selectedSetFilter.set('all');
    this.collapsedSets.set([]);
    this.loadMyCollection(gameId);
  }

  loadMyCollection(gameId: number) {
    this.isLoading.set(true);
    this.collectionService.getCollection(gameId).subscribe({
      next: (response) => {
        // La respuesta ya no es un array, es el objeto con vault_value + collection paginada
        this.myCards.set(response.collection.data);   // ← el array real está aquí
        this.vaultValue.set(response.vault_value ?? 0); // ← KPI calculado en BD
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando colección', err);
        this.isLoading.set(false);
      }
    });
  }

  // 🚀 Controladores del modal reutilizado
  openModal(card: any) { this.selectedCard.set(card); }
  closeModal() { this.selectedCard.set(null); }

  onNavigate(direction: 'prev' | 'next') {
    const index = this.currentIndex();
    const cards = this.processedCards();
    if (index === -1) return;

    const newIndex = direction === 'next' ? index + 1 : index - 1;
    if (newIndex >= 0 && newIndex < cards.length) {
      this.selectedCard.set(cards[newIndex]);
    }
  }

  // 🚀 Métodos para expandir o colapsar de forma interactiva las expansiones
  toggleSetCollapse(setName: string) {
    this.collapsedSets.update(list => 
      list.includes(setName) ? list.filter(s => s !== setName) : [...list, setName]
    );
  }

  isSetCollapsed(setName: string): boolean {
    return this.collapsedSets().includes(setName);
  }

  onFavoriteChange(event: { id: number, isFavorite: boolean }) {
    // 1. Ya NO reconstruimos el array completo. 
    // La UI ya se ha actualizado gracias a [(isFavorite)]="card.is_favorite"

    // 2. Mandamos la petición al servidor silenciosamente
    this.collectionService.toggleFavorite(event.id).subscribe({
      error: () => {
        console.error('Fallo al guardar favorito');
        // Si el servidor falla, buscamos la carta exacta y revertimos su valor
        const cardToRevert = this.myCards().find(c => c.collection_id === event.id);
        if (cardToRevert) {
          cardToRevert.is_favorite = !event.isFavorite;
        }
      }
    });
  }
}