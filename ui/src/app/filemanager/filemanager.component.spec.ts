import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilemanagerComponent } from './filemanager.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('FilemanagerComponent', () => {
  let component: FilemanagerComponent;
  let fixture: ComponentFixture<FilemanagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilemanagerComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(FilemanagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
