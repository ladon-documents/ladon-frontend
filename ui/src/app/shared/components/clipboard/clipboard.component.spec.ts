import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClipboardComponent } from './clipboard.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('ClipboardComponent', () => {
  let component: ClipboardComponent;
  let fixture: ComponentFixture<ClipboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClipboardComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(ClipboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
