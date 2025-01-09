import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadonPdfBookmarkComponent } from './ladon-pdf-bookmark.component';

describe('LadonPdfBookmarkComponent', () => {
  let component: LadonPdfBookmarkComponent;
  let fixture: ComponentFixture<LadonPdfBookmarkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LadonPdfBookmarkComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LadonPdfBookmarkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
