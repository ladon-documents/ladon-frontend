import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadonPdfToggleSidebarComponent } from './ladon-pdf-toggle-sidebar.component';

describe('LadonPdfToggleSidebarComponent', () => {
  let component: LadonPdfToggleSidebarComponent;
  let fixture: ComponentFixture<LadonPdfToggleSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LadonPdfToggleSidebarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LadonPdfToggleSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
