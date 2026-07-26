import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PluginDocumentationPanelComponent } from './plugin-documentation-panel.component';

describe('PluginDocumentationPanelComponent', () => {
  let fixture: ComponentFixture<PluginDocumentationPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginDocumentationPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginDocumentationPanelComponent);
    fixture.componentRef.setInput('documentationUrl', 'https://docs.example/plugin');
    fixture.detectChanges();
  });

  it('renders an iframe for documentation', () => {
    expect(fixture.nativeElement.querySelector('iframe')).toBeTruthy();
  });
});
