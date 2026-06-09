import { Component, input, output, computed, signal, inject, OnInit, model } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { WishlistService } from '../../services/wishlist';
// 🚀 IMPORTANTE: Importamos el entorno para leer tu environment.apiUrl
import { environment } from '../../../environments/environment';

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

  private wishlistService = inject(WishlistService);
  isWishlisted = signal<boolean>(false);

  ngOnInit() {
    this.isWishlisted.set(this.card().is_wishlisted ?? false);
  }

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

  // ── Computed: Datos visuales básicos ────────────────────────────
  
  // 🚀 LA NUEVA LÓGICA DE IMAGEN DIRECTA A TU LARAVEL
  imageUrl = computed(() => {
    const c = this.card();
    const region = this.currentRegion(); 
    const cardNumber = c.card_number;
    const rawUrl = c.attributes?.image_url?.[region] ?? c.image_url;
    
    if (!cardNumber || !rawUrl) return '';

    // Sacamos el Set (ej. "EB01")
    const setId = cardNumber.split('-')[0] || 'PROMO';
    
    // Extraemos la extensión real (png, jpg)
    const extension = rawUrl.split('.').pop()?.split('?')[0] || 'png';
    const filename = `${c.unique_id}.${extension}`;

    // Sacamos la URL base (quitando el /api si lo tiene environment.apiUrl)
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

    // Devolvemos la ruta directa al archivo público de Laravel
    return `${baseUrl}/storage/cards/${setId}/${region}/${filename}`;
    // Ahora sí, la ruta exacta con /images/ incluida
    //return `${baseUrl}/storage/cards/${setId}/${region}/images/${filename}`;
    // Devolvemos la ruta directa al archivo público de Laravel (¡añadimos /images/!)
  });

  cardName = computed(() => {
    const c      = this.card();
    const region = this.currentRegion();
    return c.attributes?.name?.[region] ?? c.name;
  });

  // ── Computed para Etiquetas (Badges) a prueba de fallos ──

  cardCategory = computed(() => {
    const attrs = this.card().attributes;
    if (!attrs || !attrs.category) return null;
    return attrs.category[this.currentRegion()] || attrs.category['en'] || null;
  });

  cardRarity = computed(() => {
    const attrs = this.card().attributes;
    const rootRarity = this.card().rarity; // Por si viene en la raíz en otros juegos
    if (attrs && attrs.rarity) {
      return attrs.rarity[this.currentRegion()] || attrs.rarity['en'] || null;
    }
    return rootRarity || null;
  });

  cardColor = computed(() => {
    return this.card().attributes?.color || null;
  });

  // 🚀 ASIGNA COLORES DINÁMICOS Y GRADIENTES PARA CARTAS BICOLOR
  cardColorClass = computed(() => {
    const colorRaw = this.cardColor()?.toLowerCase() || '';

    // 1. Si es un color simple
    if (colorRaw === 'red') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
    if (colorRaw === 'green') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
    if (colorRaw === 'blue') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
    if (colorRaw === 'purple') return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50';
    if (colorRaw === 'yellow') return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50';
    if (colorRaw === 'black') return 'bg-zinc-200 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600';

    // 2. Si es una carta Bicolor (Ej: "red/yellow")
    if (colorRaw.includes('/')) {
      const colors = colorRaw.split('/');
      const c1 = colors[0].trim();
      const c2 = colors[1].trim();

      // Diccionario de colores de inicio del gradiente (from)
      const fromMap: Record<string, string> = {
        'red': 'from-red-100 dark:from-red-900/60',
        'green': 'from-emerald-100 dark:from-emerald-900/60',
        'blue': 'from-blue-100 dark:from-blue-900/60',
        'purple': 'from-purple-100 dark:from-purple-900/60',
        'yellow': 'from-yellow-100 dark:from-yellow-900/60',
        'black': 'from-zinc-300 dark:from-zinc-800',
      };

      // Diccionario de colores de fin del gradiente (to)
      const toMap: Record<string, string> = {
        'red': 'to-red-100 dark:to-red-900/60',
        'green': 'to-emerald-100 dark:to-emerald-900/60',
        'blue': 'to-blue-100 dark:to-blue-900/60',
        'purple': 'to-purple-100 dark:to-purple-900/60',
        'yellow': 'to-yellow-100 dark:to-yellow-900/60',
        'black': 'to-zinc-300 dark:to-zinc-800',
      };

      const fromClass = fromMap[c1] || 'from-slate-100 dark:from-slate-800';
      const toClass = toMap[c2] || 'to-slate-100 dark:to-slate-800';

      // Combinamos el gradiente. Ponemos el texto en un color neutral oscuro/claro para que siempre sea legible
      return `bg-gradient-to-br ${fromClass} ${toClass} text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/50`;
    }

    // 3. Fallback genérico por si aparece un color raro que no esté en la lista
    return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  });
}