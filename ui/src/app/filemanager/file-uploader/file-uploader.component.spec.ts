import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploaderComponent } from './file-uploader.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('FileUploaderComponent', () => {
  let component: FileUploaderComponent;
  let fixture: ComponentFixture<FileUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploaderComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
