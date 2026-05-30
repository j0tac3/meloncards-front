import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [], // 100% limpio, sin FormsModule ni cosas raras
  templateUrl: './search-bar.html'
})
export class SearchBarComponent {
  // 🚀 Angular 18 Signal Input: Recibe las expansiones desde el padre
  sets = input<any[]>([]);

  // 🚀 Angular 18 Output: Emite un objeto limpio con los dos filtros a la vez
  onFilterChange = output<{ search: string; card_set_id: number | null }>();

  // Estado interno simple para combinar ambos filtros
  private searchTxt = '';
  private selectedSetId: number | null = null;

  // Evento nativo al escribir
  onInputText(text: string) {
    this.searchTxt = text;
    this.emitFilters();
  }

  // Evento nativo al cambiar el select
  onSelectSet(value: string) {
    this.selectedSetId = value === 'null' ? null : Number(value);
    this.emitFilters();
  }

  private emitFilters() {
    this.onFilterChange.emit({
      search: this.searchTxt,
      card_set_id: this.selectedSetId
    });
  }
}