import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileEditorDialogComponent } from './file-editor-dialog.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('FileEditorDialogComponent', () => {
  let component: FileEditorDialogComponent;
  let fixture: ComponentFixture<FileEditorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileEditorDialogComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(FileEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
