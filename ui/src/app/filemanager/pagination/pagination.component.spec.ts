import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilemanagerPaginationComponent, PaginationInfo } from './pagination.component';
import { FilemanagerFacade } from '../filemanager.facade';

describe('FilemanagerPaginationComponent', () => {
  let component: FilemanagerPaginationComponent;
  let fixture: ComponentFixture<FilemanagerPaginationComponent>;
  let mockFacade: jasmine.SpyObj<FilemanagerFacade>;
  let infoSignal: WritableSignal<PaginationInfo>;

  const makeInfo = (over: Partial<PaginationInfo> = {}): PaginationInfo => ({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false,
    ...over,
  });

  beforeEach(async () => {
    infoSignal = signal<PaginationInfo>(makeInfo({ totalItems: 10, pageSize: 10, currentPage: 1, totalPages: 1 }));
    const facade = jasmine.createSpyObj<FilemanagerFacade>('FilemanagerFacade', [
      'goToPage',
      'nextPage',
      'previousPage',
      'firstPage',
      'lastPage',
      'setPageSize',
    ]);
    // The component only reads `pagination` and delegates navigation to the facade;
    // we expose the writable signal on the spy object so the template has live state.
    (facade as unknown as { pagination: WritableSignal<PaginationInfo> }).pagination = infoSignal;
    mockFacade = facade;

    await TestBed.configureTestingModule({
      imports: [FilemanagerPaginationComponent],
      providers: [{ provide: FilemanagerFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(FilemanagerPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('computes start/end item ranges from the pagination info', () => {
    expect(component.getStartItem()).toBe(1);
    expect(component.getEndItem()).toBe(10);
  });

  it('returns a single page list for totalPages <= 7', () => {
    expect(component.getVisiblePages()).toEqual([1]);
  });

  it('collapses the middle with ellipses for many pages near the start', () => {
    infoSignal.set(
      makeInfo({ totalItems: 1000, totalPages: 10, currentPage: 1, pageSize: 10, hasNextPage: true, hasPreviousPage: false }),
    );
    expect(component.getVisiblePages()).toEqual([1, 2, 3, 4, 5, '...', 10]);
  });

  it('delegates a page-size change to the facade', () => {
    component.onPageSizeChange({ target: { value: '20' } } as unknown as Event);
    expect(mockFacade.setPageSize).toHaveBeenCalledWith(20);
  });

  it('delegates a "go to page" click to the facade', () => {
    component.goToPage(3);
    expect(mockFacade.goToPage).toHaveBeenCalledWith(3);
  });
});
