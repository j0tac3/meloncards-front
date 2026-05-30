// 🚀 1. Importamos OnDestroy, PLATFORM_ID, DOCUMENT e isPlatformBrowser
import { Component, OnInit, OnDestroy, inject, signal, input, output, computed, effect, untracked, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CollectionService } from '../../services/collection';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-collection-modal',
  standalone: true,
  imports: [CurrencyPipe], 
  templateUrl: './collection-modal.html'
})
export class CollectionModalComponent implements OnInit, OnDestroy { // 🚀 2. Implementamos OnDestroy
  private collectionService = inject(CollectionService);
  
  // 🚀 3. Inyectamos utilidades del navegador
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  card = input.required<any>(); 
  currentRegion = input<string>('en'); 
  availableRegions = input<any[]>([]);
  
  hasPrev = input<boolean>(false);
  hasNext = input<boolean>(false);
  navigate = output<'prev' | 'next'>();

  close = output<void>();       
  onCollectionChange = output<void>();

  cardStates = signal<any[]>([]);
  ownedCopies = signal<any[]>([]);
  isCheckingCopies = signal<boolean>(true);

  formStateId = signal<number | null>(null);
  formLanguage = signal<string>('');
  formIsFoil = signal<boolean>(false);
  formQuantity = signal<number>(1);
  deletingIds = signal<number[]>([]);

  isZoomActive = signal<boolean>(false);
  showZoom = signal<boolean>(false);
  zoomCursorX = signal<number>(0);
  zoomCursorY = signal<number>(0);
  zoomBgX = signal<number>(0);
  zoomBgY = signal<number>(0);

  constructor() {
    effect(() => {
      const currentCard = this.card();
      untracked(() => {
        if (currentCard) {
          this.isCheckingCopies.set(true);
          this.checkCopies();
          this.formQuantity.set(1);
          this.formIsFoil.set(false);
          this.isZoomActive.set(false);
          this.showZoom.set(false);
        }
      });
    });
  }

  imageUrl = computed(() => {
    const c = this.card();
    const formLang = this.formLanguage(); 
    const regionToUse = formLang || this.currentRegion(); 
    const rawUrl = c.attributes?.image_url?.[regionToUse] || c.image_url;
    return 'https://wsrv.nl/?url=' + rawUrl;
  });

  cardName = computed(() => {
    const c = this.card();
    const formLang = this.formLanguage();
    const regionToUse = formLang || this.currentRegion();
    return c.attributes?.name?.[regionToUse] || c.name;
  });

  private extractText(value: any, lang: string): string | null {
    if (!value) return null;
    if (Array.isArray(value)) return value.join(' / '); 
    if (typeof value === 'object') return value[lang] || value['en'] || Object.values(value)[0] || null;
    return String(value);
  }

  cardCategory = computed(() => {
    const c = this.card();
    const lang = this.formLanguage() || this.currentRegion();
    return this.extractText(c.attributes?.category || c.category, lang);
  });

  cardEffect = computed(() => {
    const c = this.card();
    const lang = this.formLanguage() || this.currentRegion();
    return this.extractText(c.attributes?.effect || c.effect, lang);
  });

  cardColor = computed(() => {
    const c = this.card();
    const lang = this.formLanguage() || this.currentRegion();
    return this.extractText(c.attributes?.color || c.color, lang);
  });

  cardRarity = computed(() => {
    const c = this.card();
    const lang = this.formLanguage() || this.currentRegion();
    return this.extractText(c.attributes?.rarity || c.rarity, lang);
  });

  ngOnInit() {
    // 🚀 BLOQUEAMOS EL SCROLL AL ABRIR
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.classList.add('overflow-hidden');
    }
    
    this.formLanguage.set(this.currentRegion()); 
    this.loadCardStates();
  }

  ngOnDestroy() {
    // 🚀 DEVOLVEMOS EL SCROLL AL CERRAR
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.classList.remove('overflow-hidden');
    }
  }

  toggleZoom() {
    this.isZoomActive.update(v => !v);
    if (!this.isZoomActive()) this.showZoom.set(false);
  }

  handleMouseMove(event: MouseEvent) {
    if (!this.isZoomActive()) return;
    
    const img = event.currentTarget as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.zoomCursorX.set(x);
    this.zoomCursorY.set(y);
    
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    this.zoomBgX.set(xPercent);
    this.zoomBgY.set(yPercent);
  }

  onStateChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.formStateId.set(Number(select.value));
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.formLanguage.set(select.value);
  }

  onFoilChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.formIsFoil.set(checkbox.checked);
  }

  onQuantityChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.formQuantity.set(Number(input.value));
  }

  incrementQuantity() {
    this.formQuantity.update(q => q + 1);
  }

  decrementQuantity() {
    this.formQuantity.update(q => (q > 1 ? q - 1 : 1));
  }

  loadCardStates() {
    this.collectionService.getCardStates().subscribe({
      next: (states) => {
        const statesArray = Array.isArray(states) ? states : (states as any).data || [];
        this.cardStates.set(statesArray);
        const defaultState = statesArray.find((s: any) => s.slug === 'near-mint') || statesArray[0];
        if (defaultState) this.formStateId.set(defaultState.id);
      }
    });
  }

  checkCopies() {
    this.collectionService.checkOwnedCopies(this.card().id).subscribe({
      next: (copies) => {
        this.ownedCopies.set(copies);
        this.isCheckingCopies.set(false);
      },
      error: () => this.isCheckingCopies.set(false)
    });
  }

  save() {
    if (!this.formStateId()) return;

    const payload = {
      card_template_id: this.card().id,
      card_state_id: this.formStateId(),
      language: this.formLanguage(),
      is_foil: this.formIsFoil(),
      quantity: this.formQuantity()
    };

    this.collectionService.addToCollection(payload).subscribe({
      next: (res) => {
        const stateName = this.cardStates().find(s => s.id === this.formStateId())?.name || 'Desconocido';
        const savedCard = { ...res.data, card_state: { name: stateName } };

        this.onCollectionChange.emit();
        this.ownedCopies.update(copies => {
          const index = copies.findIndex(c => c.id === savedCard.id);
          if (index > -1) {
            const newCopies = [...copies];
            newCopies[index] = savedCard;
            return newCopies;
          }
          return [...copies, savedCard];
        });

        this.formIsFoil.set(false);
        this.formQuantity.set(1);
      }
    });
  }

  delete(id: number) {
    if (this.deletingIds().includes(id)) return;
    this.deletingIds.update(ids => [...ids, id]);

    this.collectionService.removeFromCollection(id).subscribe({
      next: (res) => {
        if (res.action === 'decremented') {
          this.ownedCopies.update(copies => 
            copies.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c)
          );
        } else {
          this.ownedCopies.update(copies => copies.filter(item => item.id !== id));
        }
        
        this.onCollectionChange.emit();
        this.deletingIds.update(ids => ids.filter(i => i !== id));
      },
      error: (err) => {
        console.error('Error al eliminar', err);
        this.deletingIds.update(ids => ids.filter(i => i !== id));
      }
    });
  }
}