import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import { CardService } from '../../services/card';
import { isPlatformBrowser, LowerCasePipe, TitleCasePipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-sets-view',
  standalone: true,
  imports: [ DatePipe], // 🚀 LIMPIO: Sin dependencias de formularios
  templateUrl: './sets.html'
})
export class SetsComponent implements OnInit {
  constructor(private cardService: CardService) {}

  catalogService = inject(CatalogService);
  router = inject(Router);
  platformId = inject(PLATFORM_ID);

  allSets = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  activeFilter = signal<string | null>(null);
  
  // 🚀 Señal para controlar la región actual
  currentRegion = signal<string>('en');

  availableFamilies = computed(() => {
    const sets = this.allSets();
    return [...new Set(sets.map(set => set.family).filter(Boolean))].sort();
  });

  filteredSets = computed(() => {
    const sets = this.allSets();
    const filter = this.activeFilter();
    
    if (!filter) return sets;
    return sets.filter(set => set.family === filter);
  });

  ngOnInit() {
    // Leemos la preferencia guardada en el catálogo si existe
    if (isPlatformBrowser(this.platformId)) {
      const savedRegion = localStorage.getItem('pref_region_one-piece');
      if (savedRegion) {
        this.currentRegion.set(savedRegion);
      }
    }
    this.loadSets();
  }

  loadSets() {
    this.isLoading.set(true);
    // 🚀 Pasamos la región actual a la API
    this.catalogService.getSets(2, this.currentRegion()).subscribe({
      next: (data) => {
        this.allSets.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando sets:', err);
        this.isLoading.set(false);
      }
    });
  }

  // 🚀 EVENTO NATIVO: Se dispara al cambiar el `<select>`
  onRegionChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const newRegion = select.value;
    
    this.currentRegion.set(newRegion);
    
    // Guardamos la preferencia para que el Catálogo también se entere
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('pref_region_one-piece', newRegion);
    }
    
    // Reseteamos el filtro de familias y volvemos a cargar las cajas
    this.activeFilter.set(null);
    this.loadSets();
  }

  setFilter(family: string | null) {
    this.activeFilter.set(family);
  }

  getFamilyName(family: string): string {
    const names: Record<string, string> = {
      'OP': 'Booster Packs (OP)',
      'ST': 'Starter Decks (ST)',
      'EB': 'Extra Boosters (EB)',
      'DP': 'Double Packs (DP)',
      'PRB': 'Premium Boosters (PRB)'
    };
    return names[family] || family;
  }

  goToCatalog(setId: number) {
    this.router.navigate(['/catalog'], { queryParams: { set: setId } });
  }

  onDescargarPdf(setCode: string) {
    this.cardService.descargarChecklist(setCode);
  }
}