import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderComponent } from './folder.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('FolderComponent', () => {
  let component: FolderComponent;
  let fixture: ComponentFixture<FolderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(FolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
