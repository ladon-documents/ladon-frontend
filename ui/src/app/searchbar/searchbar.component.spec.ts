import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchbarComponent } from './searchbar.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('SearchbarComponent', () => {
  let component: SearchbarComponent;
  let fixture: ComponentFixture<SearchbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchbarComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(SearchbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
