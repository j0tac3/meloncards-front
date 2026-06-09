import { Component, input, computed } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-graded-card',
  standalone: true,
  templateUrl: './graded-card.html',
  styleUrl: './graded-card.scss' // Opcional, pero Tailwind hará el 99% del trabajo
})
export class GradedCardComponent {
  // Entradas
  card = input.required<any>();
  currentRegion = input<string>('en');
  
  // Parámetros del "Gradeo"
  grade = input<number>(10);
  companyName = input<string>('MELON UNIVERSAL GRADE');

  // Lógica de texto del grado (Ej: 10 = GEM MINT)
  gradeText = computed(() => {
    const g = this.grade();
    if (g === 10) return 'Gem Mint';
    if (g >= 9) return 'Mint';
    if (g >= 8) return 'NM-MT';
    return 'Excellent';
  });

  // ── LÓGICA DE IMAGEN (La misma que funciona en tu app) ──
  imageUrl = computed(() => {
    const c = this.card();
    const region = this.currentRegion(); 
    const cardNumber = c.card_number;
    const rawUrl = c.attributes?.image_url?.[region] ?? c.image_url;
    
    if (!cardNumber || !rawUrl) return '';

    const setId = cardNumber.split('-')[0] || 'PROMO';
    // Extraemos el nombre exacto del archivo original (ej: "EB04-043_p1.png") para respetar las paralelas
    const rawUrlWithoutQuery = rawUrl.split('?')[0];
    const filename = rawUrlWithoutQuery.split('/').pop() || `${cardNumber}.png`;
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

    return `${baseUrl}/storage/cards/${setId}/${region}/${filename}`;
  });

  // ── Añade esto dentro de la clase GradedCardComponent ──
  
  cardCategory = computed(() => {
    const attrs = this.card().attributes;
    if (!attrs || !attrs.category) return 'CARD';
    return attrs.category[this.currentRegion()] || attrs.category['en'] || 'CARD';
  });

  cardRarity = computed(() => {
    const attrs = this.card().attributes;
    const rootRarity = this.card().rarity;
    if (attrs && attrs.rarity) {
      return attrs.rarity[this.currentRegion()] || attrs.rarity['en'] || null;
    }
    return rootRarity || null;
  });

  // ── ATRIBUTOS DE ONE PIECE ──
  cardName = computed(() => this.card().attributes?.name?.[this.currentRegion()] ?? this.card().name);
  cardSet = computed(() => this.card().card_number); // Ej: OP01-001
  cardYear = computed(() => '2024'); // Podrías sacarlo de la base de datos
  
  cardCost = computed(() => this.card().attributes?.cost ?? '-');
  cardPower = computed(() => this.card().attributes?.power ?? '-');
  cardColor = computed(() => this.card().attributes?.color ?? 'N/A');
  cardAttribute = computed(() => this.card().attributes?.attribute ?? 'N/A');
}