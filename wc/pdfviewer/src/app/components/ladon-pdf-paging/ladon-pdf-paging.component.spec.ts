import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadonPdfPagingComponent } from './ladon-pdf-paging.component';

describe('LadonPdfPagingComponent', () => {
  let component: LadonPdfPagingComponent;
  let fixture: ComponentFixture<LadonPdfPagingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LadonPdfPagingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LadonPdfPagingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
