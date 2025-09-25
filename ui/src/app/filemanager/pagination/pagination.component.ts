import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroChevronLeft,
  heroChevronRight,
  heroChevronDoubleLeft,
  heroChevronDoubleRight
} from '@ng-icons/heroicons/outline';
import { FilemanagerFacade } from '../filemanager.facade';

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
  templateUrl: "pagination.component.html",
  styles: [`
    .join-item:not(.btn) {
      display: flex;
      align-items: center;
    }
  `]
})
export class FilemanagerPaginationComponent {
  readonly #facade = inject(FilemanagerFacade);
  paginationInfo: Signal<PaginationInfo> = this.#facade.pagination;

  goToPage(page: number) {
    this.#facade.goToPage(page);
  }

  nextPage() {
    this.#facade.nextPage();
  }

  previousPage() {
    this.#facade.previousPage();
  }

  firstPage() {
    this.#facade.firstPage();
  }

  lastPage() {
    this.#facade.lastPage();
  }

  setPageSize(pageSize: number) {
    this.#facade.setPageSize(pageSize);
  }

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

    pages.push(1);

    if (currentPage <= 4) {
      for (let i = 2; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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
    this.setPageSize(pageSize);
  }
}
