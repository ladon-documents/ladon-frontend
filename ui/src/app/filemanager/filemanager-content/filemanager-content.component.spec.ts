import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilemanagerContentComponent } from './filemanager-content.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('FilemanagerContentComponent', () => {
  let component: FilemanagerContentComponent;
  let fixture: ComponentFixture<FilemanagerContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilemanagerContentComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(FilemanagerContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
