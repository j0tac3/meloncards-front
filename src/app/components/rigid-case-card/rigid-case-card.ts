import { Component, input, computed, signal, output, HostListener } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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

  // ── ESTADO UI ──
  isFlipped = signal<boolean>(false);
  
  // ── ESTADO GIROSCOPIO (Foil Glare) ──
  glareX = signal<number>(50);
  glareY = signal<number>(50);
  gyroEnabled = signal<boolean>(false);

  toggleFlip() {
    this.isFlipped.set(!this.isFlipped());
  }

  // ── DATOS BÁSICOS ──
  userQuantity = computed(() => this.card().quantity || 0);
  cardCode = computed(() => this.card().card_number || 'N/A');
  cardPrice = computed(() => this.card().market_price ?? null);
  
  cardName = computed(() => this.card().name || this.card().attributes?.name?.[this.currentRegion()] || 'Unknown');
  cardDescription = computed(() => this.card().attributes?.ability?.[this.currentRegion()] ?? '');
  
  cardStats = computed(() => ({
    type: this.card().attributes?.type || '',
    color: this.card().attributes?.color || '',
    rarity: this.card().rarity || ''
  }));

  // ── VALIDADORES ESTRICTOS PARA OCULTAR CAJAS ──
  hasColor = computed(() => {
    const c = this.cardStats().color;
    return c && c !== '-' && c.toUpperCase() !== 'N/A';
  });

  hasType = computed(() => {
    const t = this.cardStats().type;
    return t && t !== '-' && t.toUpperCase() !== 'N/A';
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

  // ── MICRO-INTERACCIÓN: GIROSCOPIO ──
  async requestGyroPermissions() {
    // Soporte nativo para iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          this.gyroEnabled.set(true);
        }
      } catch (error) {
        console.error('Permiso de giroscopio denegado', error);
      }
    } else {
      // Android / Web estándar
      this.gyroEnabled.set(true);
    }
  }

  @HostListener('window:deviceorientation', ['$event'])
  handleOrientation(event: DeviceOrientationEvent) {
    if (!this.gyroEnabled()) return;
    
    // Inclinación frontal/trasera (beta) e izquierda/derecha (gamma)
    const beta = Math.max(-45, Math.min(45, event.beta || 0)); 
    const gamma = Math.max(-45, Math.min(45, event.gamma || 0));

    // Convertimos de -45/45 a porcentajes 0-100 para mover el fondo radial
    this.glareY.set(((beta + 45) / 90) * 100);
    this.glareX.set(((gamma + 45) / 90) * 100);
  }
}