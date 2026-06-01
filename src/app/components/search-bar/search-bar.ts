import { Component, input, output, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [], 
  templateUrl: './search-bar.html'
})
export class SearchBarComponent implements OnInit {
  // 🚀 Inyectamos la ruta para leer los parámetros URL
  route = inject(ActivatedRoute); 

  sets = input<any[]>([]); 
  onFilterChange = output<{ search: string; card_set_id: number | null }>();
  // 1. Añade este nuevo output (debajo del onFilterChange)
  onDownloadChecklist = output<number>();

  private searchTxt = '';
  
  // 🚀 Quitamos 'private' para que sea accesible desde el HTML
  selectedSetId: number | null = null; 

  ngOnInit() {
    // 🚀 Escuchamos la URL de forma reactiva
    this.route.queryParams.subscribe(params => {
      const setIdFromUrl = params['set'];
      if (setIdFromUrl) {
        this.selectedSetId = Number(setIdFromUrl);
      } else {
        this.selectedSetId = null; // Si se limpia la URL, se resetea el selector
      }
    });
  }

  onInputText(text: string) {
    this.searchTxt = text;
    this.emitFilters();
  }

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

  // 2. Añade la función que se ejecuta al hacer clic en el botón
  onDownloadClick() {
    if (this.selectedSetId) {
      this.onDownloadChecklist.emit(this.selectedSetId);
    }
  }
  
}