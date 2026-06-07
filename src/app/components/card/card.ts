import { Component, input, output, computed, signal, inject, OnInit, model } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { WishlistService } from '../../services/wishlist';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [RouterModule, CurrencyPipe],
  templateUrl: './card.html',
  styleUrl: './card.scss' // Mantengo tu SCSS por si tienes el holo-glare ahí
})
export class CardComponent implements OnInit {

  // ── Inputs / Outputs ────────────────────────────────────────────
  card             = input.required<any>();
  isAuthenticated  = input.required<boolean>();
  currentRegion    = input<string>('en');
  gameSlug         = input<string>('default'); // Lo mantenemos por compatibilidad, aunque ya no altere el CSS
  isCollectionCard = input<boolean>(false);
  isFavorite       = model<boolean>(false);

  favoriteChange  = output<{ id: number; isFavorite: boolean }>();
  wishlistChange  = output<{ id: number; isWishlisted: boolean }>();
  addClick        = output<void>();

  // ── Wishlist state ──────────────────────────────────────────────
  private wishlistService = inject(WishlistService);
  isWishlisted = signal<boolean>(false);

  ngOnInit() {
    this.isWishlisted.set(this.card().is_wishlisted ?? false);
  }

  // ── Acciones de Botones ─────────────────────────────────────────
  onToggleWishlist(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isAuthenticated()) return;

    const prev = this.isWishlisted();
    this.isWishlisted.set(!prev);
    this.wishlistChange.emit({ id: this.card().id, isWishlisted: !prev });

    this.wishlistService.toggleWishlist(this.card().id).subscribe({
      error: () => {
        this.isWishlisted.set(prev);
        this.wishlistChange.emit({ id: this.card().id, isWishlisted: prev });
      }
    });
  }

  onToggleFavorite(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const next = !this.isFavorite();
    this.isFavorite.set(next);
    this.favoriteChange.emit({ id: this.card().collection_id, isFavorite: next });
  }

  // ── Computed: datos de la carta ─────────────────────────────────
  imageUrl = computed(() => {
    const c      = this.card();
    const region = this.currentRegion();
    const raw    = c.attributes?.image_url?.[region] ?? c.image_url;
    return 'https://wsrv.nl/?url=' + raw;
  });

  cardName = computed(() => {
    const c      = this.card();
    const region = this.currentRegion();
    return c.attributes?.name?.[region] ?? c.name;
  });
}