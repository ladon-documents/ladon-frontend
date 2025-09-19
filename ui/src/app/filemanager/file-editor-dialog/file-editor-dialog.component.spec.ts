import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileEditorDialogComponent } from './file-editor-dialog.component';

describe('FileEditorDialogComponent', () => {
  let component: FileEditorDialogComponent;
  let fixture: ComponentFixture<FileEditorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileEditorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
