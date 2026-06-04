import { Component, input, output, computed, signal, inject, OnInit, model } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { WishlistService } from '../../services/wishlist';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [RouterModule, CurrencyPipe],
  templateUrl: './card.html',
  styleUrl: './card.scss'
})
export class CardComponent implements OnInit {

  // ── Inputs / Outputs ────────────────────────────────────────────
  card             = input.required<any>();
  isAuthenticated  = input.required<boolean>();
  currentRegion    = input<string>('en');
  gameSlug         = input<string>('default');
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

  // ── Wishlist toggle ─────────────────────────────────────────────
  onToggleWishlist(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isAuthenticated()) return;

    const prev = this.isWishlisted();
    this.isWishlisted.set(!prev);
    this.wishlistChange.emit({ id: this.card().id, isWishlisted: !prev });

    this.wishlistService.toggleWishlist(this.card().id).subscribe({
      next: () => {},
      error: () => {
        this.isWishlisted.set(prev);
        this.wishlistChange.emit({ id: this.card().id, isWishlisted: prev });
      }
    });
  }

  // ── Favorite toggle ─────────────────────────────────────────────
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

  // ── Computed: estilos por juego ─────────────────────────────────

  wrapperClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece':
        return 'bg-[#fdf8ed] border-[2px] border-[#8b5a2b] rounded-sm shadow-[4px_4px_0_rgba(139,90,43,0.18)]';
      case 'pokemon':
        return 'bg-white border-[2px] border-gray-200 rounded-xl shadow-lg';
      default:
        return 'bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)]';
    }
  });

  imageContainerClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece': return 'p-2.5 pb-1 bg-transparent';
      case 'pokemon':   return 'p-0 border-b-[4px] border-red-500';
      default:          return 'bg-gray-50';
    }
  });

  imageClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece': return 'rounded-sm border border-[#8b5a2b]/40 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]';
      case 'pokemon':   return 'rounded-t-xl';
      default:          return 'rounded-t-xl';
    }
  });

  // footerBgClass: fondo del área de info
  footerBgClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece': return 'bg-[#fdf8ed]';
      case 'pokemon':   return 'bg-white';
      default:          return 'bg-white dark:bg-slate-900';
    }
  });

  // footerDividerClass: separador antes de la fila set+botón
  footerDividerClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece': return 'border-t-2 border-dashed border-[#8b5a2b]/30';
      case 'pokemon':   return 'border-t border-gray-100';
      default:          return 'border-t border-slate-50 dark:border-slate-800';
    }
  });

  numberClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece': return 'bg-[#e7cfa4] text-[#5c3a21] border border-[#8b5a2b] rounded-sm tracking-wide';
      case 'pokemon':   return 'bg-gray-800 text-white rounded-full tracking-wide';
      default:          return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded tracking-wide';
    }
  });

  priceClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece': return 'text-[#d32f2f] font-serif text-base';
      case 'pokemon':   return 'text-red-600 font-bold text-base';
      default:          return 'text-blue-600 dark:text-blue-400 font-bold text-base';
    }
  });

  emptyPriceClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece': return 'text-[#8b5a2b]/50';
      case 'pokemon':   return 'text-gray-400';
      default:          return 'text-slate-400 dark:text-slate-500';
    }
  });

  footerTextClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece': return 'text-[#5c3a21]/70';
      case 'pokemon':   return 'text-gray-500';
      default:          return 'text-slate-400 dark:text-slate-500';
    }
  });

  badgeClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece': return 'bg-[#8b5a2b] text-[#fdfaf3] rounded-sm';
      case 'pokemon':   return 'bg-red-100 text-red-700 rounded-full';
      default:          return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded';
    }
  });

  // Botón info (reemplaza al +)
  btnClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece':
        return 'bg-[#8b5a2b] text-[#fdfaf3] hover:bg-[#6d4622] rounded-sm shadow-sm';
      case 'pokemon':
        return 'bg-white text-red-600 border border-gray-200 hover:bg-gray-50 hover:border-red-500 rounded-full shadow-sm';
      default:
        return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-full';
    }
  });

  loginBtnClass = computed(() =>
    this.gameSlug() === 'one-piece'
      ? 'bg-transparent text-[#8b5a2b]/60 hover:bg-[#e7cfa4] rounded-sm'
      : 'bg-transparent text-slate-400 hover:bg-slate-100 rounded-full'
  );

  wishlistBtnClass = computed(() => {
    switch (this.gameSlug()) {
      case 'one-piece':
        return 'bg-[#fdf8ed]/90 hover:bg-[#e7cfa4] border border-[#8b5a2b]/40 rounded-sm';
      case 'pokemon':
        return 'bg-white/90 hover:bg-gray-100 border border-gray-200 rounded-full';
      default:
        return 'bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full shadow-sm border border-slate-200 dark:border-slate-700';
    }
  });
}
