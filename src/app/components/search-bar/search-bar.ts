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
  
  // 🚀 CAMBIO CLAVE: Ahora es un Signal
  selectedSetId = signal<number | null>(null); 

  isDropdownOpen = signal<boolean>(false);
  dropdownSearchTxt = signal<string>('');

  filteredSets = computed(() => {
    const term = this.dropdownSearchTxt().toLowerCase();
    if (!term) return this.sets();
    return this.sets().filter(set => 
      set.name.toLowerCase().includes(term) || 
      set.code.toLowerCase().includes(term)
    );
  });

  // 🚀 Ahora sí recalculará cada vez que el usuario elija una nueva expansión
  selectedSet = computed(() => {
    const id = this.selectedSetId(); 
    if (!id) return null;
    return this.sets().find(set => set.id === id) || null;
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const setIdFromUrl = params['set'];
      this.selectedSetId.set(setIdFromUrl ? Number(setIdFromUrl) : null);
    });
  }

  onInputText(text: string) {
    this.searchTxt = text;
    this.emitFilters();
  }

  onSelectCustomSet(setId: number | null) {
    this.selectedSetId.set(setId);
    this.closeDropdown();
    this.emitFilters();
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
    if (this.isDropdownOpen()) this.dropdownSearchTxt.set('');
  }

  closeDropdown() {
    this.isDropdownOpen.set(false);
  }

  updateDropdownSearch(term: string) {
    this.dropdownSearchTxt.set(term);
  }

  onDownloadClick() {
    const id = this.selectedSetId();
    if (id) {
      this.onDownloadChecklist.emit(id);
    }
  }

  private emitFilters() {
    this.onFilterChange.emit({
      search: this.searchTxt,
      card_set_id: this.selectedSetId()
    });
  }
}