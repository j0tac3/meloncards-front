import { Component, input, output, inject, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [], 
  templateUrl: './search-bar.html'
})
export class SearchBarComponent implements OnInit {
  route = inject(ActivatedRoute); 

  sets = input<any[]>([]); 
  onFilterChange = output<{ search: string; card_set_id: number | null }>();
  onDownloadChecklist = output<number>();

  private searchTxt = '';
  selectedSetId: number | null = null; 

  // 🚀 NUEVO: Estado del Custom Dropdown / Bottom Sheet
  isDropdownOpen = signal<boolean>(false);
  dropdownSearchTxt = signal<string>('');

  // 🚀 NUEVO: Filtro en tiempo real para el menú flotante
  filteredSets = computed(() => {
    const term = this.dropdownSearchTxt().toLowerCase();
    if (!term) return this.sets();
    return this.sets().filter(set => 
      set.name.toLowerCase().includes(term) || 
      set.code.toLowerCase().includes(term)
    );
  });

  // 🚀 NUEVO: Obtener el objeto completo de la expansión seleccionada
  selectedSet = computed(() => {
    const id = this.selectedSetId;
    if (!id) return null;
    return this.sets().find(set => set.id === id) || null;
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const setIdFromUrl = params['set'];
      this.selectedSetId = setIdFromUrl ? Number(setIdFromUrl) : null;
    });
  }

  onInputText(text: string) {
    this.searchTxt = text;
    this.emitFilters();
  }

  // 🚀 REFACTORIZADO: Lógica de selección del menú custom
  onSelectCustomSet(setId: number | null) {
    this.selectedSetId = setId;
    this.closeDropdown();
    this.emitFilters();
  }

  // Controles del Dropdown
  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
    if (this.isDropdownOpen()) this.dropdownSearchTxt.set(''); // Resetea el buscador al abrir
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  updateDropdownSearch(term: string) {
    this.dropdownSearchTxt.set(term);
  }

  onDownloadClick() {
    if (this.selectedSetId) {
      this.onDownloadChecklist.emit(this.selectedSetId);
    }
  }

  private emitFilters() {
    this.onFilterChange.emit({
      search: this.searchTxt,
      card_set_id: this.selectedSetId
    });
  }
}