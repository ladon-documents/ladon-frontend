import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchModalComponent } from './search-modal.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('SearchModalComponent', () => {
  let component: SearchModalComponent;
  let fixture: ComponentFixture<SearchModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchModalComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(SearchModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
