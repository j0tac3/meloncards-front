import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { CollectionService } from '../../services/collection'; // Ajusta la ruta si es necesario
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../components/card/card';
import { CollectionModalComponent } from '../../components/collection-modal/collection-modal';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-set-collection',
  standalone: true,
  imports: [RouterLink, FormsModule, CardComponent, CollectionModalComponent],
  templateUrl: './set-collection.html'
})
export class SetCollectionComponent implements OnInit, OnDestroy {
  // ── Inyecciones ─────────────────────────────────────────────────────────────
  private route = inject(ActivatedRoute);
  private collectionService = inject(CollectionService);
  private location = inject(Location);

  // ── Estado de la URL y Set ──────────────────────────────────────────────────
  setId = signal<number>(0);
  setInfo = signal<{name: string, total_cards: number, owned_unique: number} | null>(null);

  // ── Estado de la Cuadrícula ─────────────────────────────────────────────────
  cards = signal<any[]>([]);
  currentPage = signal<number>(1);
  hasMore = signal<boolean>(true);
  isLoading = signal<boolean>(false);

  // ── Buscador Local ──────────────────────────────────────────────────────────
  searchTerm = signal<string>('');
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ── Modal ───────────────────────────────────────────────────────────────────
  selectedCard = signal<any | null>(null);
  
  currentIndex = computed(() => {
    const current = this.selectedCard();
    if (!current) return -1;
    return this.cards().findIndex(c => c.collection_id === current.collection_id);
  });
  hasPrev = computed(() => this.currentIndex() > 0);
  hasNext = computed(() => this.currentIndex() < this.cards().length - 1);

  // ── Scroll Infinito ─────────────────────────────────────────────────────────
  @HostListener('window:scroll')
  onScroll() {
    if (this.isLoading() || !this.hasMore()) return;

    const scrolled = window.innerHeight + window.scrollY;
    const totalHeight = document.documentElement.scrollHeight;

    if (scrolled >= totalHeight - 300) {
      this.loadCards(this.currentPage() + 1);
    }
  }

  // ── Ciclo de vida e Inicialización ──────────────────────────────────────────
  ngOnInit() {
    // 1. Obtenemos el ID de la URL (ej: /collection/set/5)
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.setId.set(Number(idParam));
      this.loadCards(1);
    }

    // 2. Escuchamos el buscador con 500ms de retraso
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.loadCards(1);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Acciones de Interfaz ────────────────────────────────────────────────────
  onSearchInput(term: string) {
    this.searchSubject.next(term);
  }

  goBack() {
    this.location.back(); // Vuelve a "Mi colección" de forma nativa
  }

  // ── Petición al Servidor ────────────────────────────────────────────────────
  loadCards(page: number = 1) {
    this.isLoading.set(true);
    
    this.collectionService.getSetCards(this.setId(), this.searchTerm(), page).subscribe({
      next: (response) => {
        if (page === 1) {
          this.cards.set(response.data);
          if (response.set_info) this.setInfo.set(response.set_info); // Guardamos la info de cabecera
        } else {
          this.cards.update(cards => [...cards, ...response.data]);
        }
        
        this.currentPage.set(response.current_page);
        this.hasMore.set(response.has_more_pages);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando cartas del set', err);
        this.isLoading.set(false);
      }
    });
  }

  // ── Lógica del Modal ────────────────────────────────────────────────────────
  openModal(card: any) { this.selectedCard.set(card); }
  closeModal() { this.selectedCard.set(null); }

  onNavigate(direction: 'prev' | 'next') {
    const index = this.currentIndex();
    const allCards = this.cards();
    if (index === -1) return;

    const next = direction === 'next' ? index + 1 : index - 1;
    if (next >= 0 && next < allCards.length) {
      this.selectedCard.set(allCards[next]);
    }
  }

  onFavoriteChange(event: { id: number; isFavorite: boolean }) {
    this.collectionService.toggleFavorite(event.id).subscribe({
      error: () => {
        // Revertir visualmente si falla
        const card = this.cards().find(c => c.collection_id === event.id);
        if (card) card.is_favorite = !event.isFavorite;
      }
    });
  }
}