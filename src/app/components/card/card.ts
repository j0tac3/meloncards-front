import { Component, input, output, computed, signal, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { WishlistService } from '../../services/wishlist'; 

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [RouterModule, CurrencyPipe], // ✨ Limpio, sin CommonModule ni NgClass
  templateUrl: './card.html',
  styleUrl: './card.scss'
})
export class CardComponent implements OnInit {
  // 📦 INPUTS Y OUTPUTS
  card = input.required<any>();
  isAuthenticated = input.required<boolean>();
  currentRegion = input<string>('en');
  gameSlug = input<string>('default');

  addClick = output<void>();
  
  // ❤️ LÓGICA WISHLIST (Signals)
  private wishlistService = inject(WishlistService);
  isWishlisted = signal<boolean>(false);

  wishlistChange = output<{ id: number, isWishlisted: boolean }>();

  ngOnInit() {
    this.isWishlisted.set(this.card().is_wishlisted || false);
  }

  onToggleWishlist(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isAuthenticated()) return;

    const previousState = this.isWishlisted();
    this.isWishlisted.set(!previousState);

    // 🚀 NUEVO: Avisamos al componente padre del cambio de estado al instante
    this.wishlistChange.emit({
      id: this.card().id,
      isWishlisted: !previousState
    });

    this.wishlistService.toggleWishlist(this.card().id).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error al actualizar wishlist:', err);
        // Revertimos si hay error
        this.isWishlisted.set(previousState);
        // Avisamos al padre de que hubo un error y volvió al estado original
        this.wishlistChange.emit({ id: this.card().id, isWishlisted: previousState });
      }
    });
  }

  // 🎨 ESTILOS COMPUTADOS ORIGINALES
  imageUrl = computed(() => {
    const c = this.card();
    const region = this.currentRegion();
    const rawUrl = c.attributes?.image_url?.[region] || c.image_url;
    return 'https://wsrv.nl/?url=' + rawUrl;
  });

  cardName = computed(() => {
    const c = this.card();
    const region = this.currentRegion();
    return c.attributes?.name?.[region] || c.name;
  });

  wrapperClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'bg-[#fdf8ed] border-[2px] border-[#8b5a2b] rounded-sm shadow-[6px_6px_0_rgba(139,90,43,0.15)]';
    if (slug === 'pokemon') return 'bg-white border-[2px] border-gray-200 rounded-xl shadow-lg relative';
    return 'bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)]';
  });
  
  imageContainerClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'p-3 pb-1 bg-transparent';
    if (slug === 'pokemon') return 'p-0 border-b-[4px] border-red-500';
    return 'bg-gray-50';
  });
  
  imageClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'rounded-sm border border-[#8b5a2b]/40 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]';
    if (slug === 'pokemon') return 'rounded-t-xl';
    return 'rounded-t-xl';
  });
  
  titleClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'text-[#4e342e] font-serif tracking-tight';
    if (slug === 'pokemon') return 'text-gray-800 font-black tracking-tight';
    return 'text-[#1e293b]';
  });
  
  priceClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'text-[#d32f2f] font-serif';
    if (slug === 'pokemon') return 'text-red-600 font-bold';
    return 'text-blue-600';
  });
  
  emptyPriceClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'text-[#8b5a2b]/60';
    if (slug === 'pokemon') return 'text-gray-400';
    return 'text-gray-400';
  });
  
  numberClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'bg-[#e7cfa4] text-[#5c3a21] border border-[#8b5a2b] rounded-sm';
    if (slug === 'pokemon') return 'bg-gray-800 text-white rounded-full';
    return 'bg-gray-100 text-[#64748b] rounded';
  });
  
  footerClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'border-t-2 border-dashed border-[#8b5a2b]/30';
    if (slug === 'pokemon') return 'border-t border-gray-100';
    return 'border-t border-gray-50';
  });
  
  footerTextClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'text-[#5c3a21]/80';
    if (slug === 'pokemon') return 'text-gray-500';
    return 'text-[#94a3b8]';
  });
  
  badgeClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'bg-[#8b5a2b] text-[#fdfaf3] rounded-sm';
    if (slug === 'pokemon') return 'bg-red-100 text-red-700 rounded-full';
    return 'bg-[#dcfce7] text-[#16a34a] rounded';
  });
  
  btnClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'bg-[#8b5a2b] text-[#fdfaf3] hover:bg-[#6d4622] rounded-sm shadow-sm';
    if (slug === 'pokemon') return 'bg-white text-red-600 border border-gray-200 hover:bg-gray-50 hover:border-red-600 rounded-full shadow-sm transition-all';
    return 'bg-transparent text-[#22c55e] hover:bg-[#dcfce7] rounded-full';
  });
  
  loginBtnClass = computed(() => {
    return this.gameSlug() === 'one-piece' ? 'rounded-sm' : 'rounded-full';
  });

  wishlistBtnClass = computed(() => {
    const slug = this.gameSlug();
    if (slug === 'one-piece') return 'bg-[#fdf8ed]/90 hover:bg-[#e7cfa4] border border-[#8b5a2b]/40 rounded-sm';
    if (slug === 'pokemon') return 'bg-white/90 hover:bg-gray-100 border border-gray-200 rounded-full';
    return 'bg-white/90 hover:bg-slate-100 rounded-full shadow-sm border border-slate-200';
  });
}