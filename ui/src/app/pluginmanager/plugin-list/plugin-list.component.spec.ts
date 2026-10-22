import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginListComponent } from './plugin-list.component';

import { smokeTestImports, smokeTestProviders } from '@ladon/tests/app.test-harness';


describe('FooComponent', () => {
  let component: PluginListComponent;
  let fixture: ComponentFixture<PluginListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginListComponent, ...smokeTestImports],
      providers: smokeTestProviders(),
    }).compileComponents();

    fixture = TestBed.createComponent(PluginListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
