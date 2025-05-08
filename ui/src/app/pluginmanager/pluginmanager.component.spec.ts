import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginmanagerComponent } from './pluginmanager.component';

describe('PluginmanagerComponent', () => {
  let component: PluginmanagerComponent;
  let fixture: ComponentFixture<PluginmanagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginmanagerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginmanagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
