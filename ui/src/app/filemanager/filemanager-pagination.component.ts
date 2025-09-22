import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  heroChevronLeft, 
  heroChevronRight, 
  heroChevronDoubleLeft, 
  heroChevronDoubleRight 
} from '@ng-icons/heroicons/outline';

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Component({
  selector: 'filemanager-pagination',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      heroChevronLeft,
      heroChevronRight,
      heroChevronDoubleLeft,
      heroChevronDoubleRight,
    })
  ],
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <!-- Info Text -->
      <div class="text-sm text-slate-600">
        Zeige {{ getStartItem() }} bis {{ getEndItem() }} von {{ paginationInfo().totalItems }} Einträgen
      </div>

      <!-- Page Size Selector -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-600">Einträge pro Seite:</span>
        <select 
          class="select select-bordered select-sm w-auto min-w-0"
          [value]="paginationInfo().pageSize"
          (change)="onPageSizeChange($event)">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <!-- Pagination Controls -->
      <div class="join" *ngIf="paginationInfo().totalPages > 1">
        <!-- First Page -->
        <button 
          class="join-item btn btn-sm" 
          [disabled]="!paginationInfo().hasPreviousPage"
          (click)="firstPage.emit()"
          title="Erste Seite">
          <ng-icon name="heroChevronDoubleLeft" size="1em"></ng-icon>
        </button>

        <!-- Previous Page -->
        <button 
          class="join-item btn btn-sm" 
          [disabled]="!paginationInfo().hasPreviousPage"
          (click)="previousPage.emit()"
          title="Vorherige Seite">
          <ng-icon name="heroChevronLeft" size="1em"></ng-icon>
        </button>

        <!-- Page Numbers -->
        <div class="join-item">
          <div class="flex items-center">
            @for (page of getVisiblePages(); track page) {
              @if (page === '...') {
                <span class="px-3 py-1 text-slate-400">...</span>
              } @else {
                <button
                  class="btn btn-sm join-item"
                  [class.btn-active]="page === paginationInfo().currentPage"
                  (click)="goToPage.emit(+page)">
                  {{ page }}
                </button>
              }
            }
          </div>
        </div>

        <!-- Next Page -->
        <button 
          class="join-item btn btn-sm" 
          [disabled]="!paginationInfo().hasNextPage"
          (click)="nextPage.emit()"
          title="Nächste Seite">
          <ng-icon name="heroChevronRight" size="1em"></ng-icon>
        </button>

        <!-- Last Page -->
        <button 
          class="join-item btn btn-sm" 
          [disabled]="!paginationInfo().hasNextPage"
          (click)="lastPage.emit()"
          title="Letzte Seite">
          <ng-icon name="heroChevronDoubleRight" size="1em"></ng-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .join-item:not(.btn) {
      display: flex;
      align-items: center;
    }
  `]
})
export class FilemanagerPaginationComponent {
  paginationInfo = input.required<PaginationInfo>();
  
  // Events
  goToPage = output<number>();
  nextPage = output<void>();
  previousPage = output<void>();
  firstPage = output<void>();
  lastPage = output<void>();
  pageSizeChange = output<number>();

  getStartItem(): number {
    const info = this.paginationInfo();
    return info.totalItems === 0 ? 0 : (info.currentPage - 1) * info.pageSize + 1;
  }

  getEndItem(): number {
    const info = this.paginationInfo();
    return Math.min(info.currentPage * info.pageSize, info.totalItems);
  }

  getVisiblePages(): (number | string)[] {
    const info = this.paginationInfo();
    const totalPages = info.totalPages;
    const currentPage = info.currentPage;
    
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (currentPage <= 4) {
      // Show pages 1-5 and ellipsis before last page
      for (let i = 2; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Show first page, ellipsis, and last 5 pages
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, ellipsis, current page area, ellipsis, last page
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const pageSize = parseInt(select.value, 10);
    this.pageSizeChange.emit(pageSize);
  }
}
