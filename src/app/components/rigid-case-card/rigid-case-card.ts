import { Component, input, computed, signal, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common'; // 🚀 IMPORTANTE: Añadir CurrencyPipe
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-rigid-case-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe], 
  templateUrl: './rigid-case-card.html',
  styleUrl: './rigid-case-card.scss'
})
export class RigidCaseCardComponent {
  card = input.required<any>();
  currentRegion = input<string>('en');

  addClick = output<void>();
  isFlipped = signal<boolean>(false);

  toggleFlip() {
    this.isFlipped.set(!this.isFlipped());
  }

  // ── DATOS BÁSICOS ──
  userQuantity = computed(() => this.card().quantity || 0);
  cardCode = computed(() => this.card().card_number || 'N/A');
  cardPrice = computed(() => this.card().market_price ?? null); // 🚀 NUEVO: Extraemos el precio
  
  cardName = computed(() => this.card().name || this.card().attributes?.name?.[this.currentRegion()] || 'Unknown');
  cardDescription = computed(() => this.card().attributes?.ability?.[this.currentRegion()] ?? 'Sin texto de habilidad.');
  
  cardStats = computed(() => ({
    type: this.card().attributes?.type || '-',
    color: this.card().attributes?.color || '-',
    rarity: this.card().rarity || '-'
  }));

  // ── VALIDADORES ESTRICTOS PARA OCULTAR NULLS ──
  hasColor = computed(() => {
    const c = this.cardStats().color;
    return c && c !== '-' && c !== 'N/A';
  });

  hasType = computed(() => {
    const t = this.cardStats().type;
    return t && t !== '-' && t !== 'N/A';
  });

  // ── LÓGICA DE IMAGEN ──
  imageUrl = computed(() => {
    const c = this.card();
    const region = this.currentRegion();
    const rawUrl = c.image_url || c.attributes?.image_url?.[region];
    if (!rawUrl) return '';

    const setId = c.card_number?.split('-')[0] || 'PROMO';
    const rawUrlWithoutQuery = rawUrl.split('?')[0];
    const filename = rawUrlWithoutQuery.split('/').pop();
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

    return `${baseUrl}/storage/cards/${setId}/${region}/${filename}`;
  });
}