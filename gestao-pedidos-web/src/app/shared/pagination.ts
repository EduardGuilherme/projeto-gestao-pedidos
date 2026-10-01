import { Component, input, output } from '@angular/core';
import { PageMeta } from '../core/models';

@Component({
  selector: 'app-pagination',
  template: `
    @if (meta().lastPage > 1) {
      <nav class="pagination" aria-label="Paginação">
        <button type="button" class="btn" [disabled]="meta().currentPage <= 1" (click)="pageChange.emit(meta().currentPage - 1)">Anterior</button>
        <span>Página {{ meta().currentPage }} de {{ meta().lastPage }} ({{ meta().total }} registros)</span>
        <button type="button" class="btn" [disabled]="meta().currentPage >= meta().lastPage" (click)="pageChange.emit(meta().currentPage + 1)">Próxima</button>
      </nav>
    }
  `,
})
export class Pagination {
  meta = input.required<PageMeta>();
  pageChange = output<number>();
}
