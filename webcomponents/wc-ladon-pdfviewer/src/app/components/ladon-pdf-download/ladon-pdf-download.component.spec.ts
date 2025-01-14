import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadonPdfDownloadComponent } from './ladon-pdf-download.component';

describe('LadonPdfDownloadComponent', () => {
  let component: LadonPdfDownloadComponent;
  let fixture: ComponentFixture<LadonPdfDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LadonPdfDownloadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LadonPdfDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
