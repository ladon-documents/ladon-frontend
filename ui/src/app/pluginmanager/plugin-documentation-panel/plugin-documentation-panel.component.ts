import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-plugin-documentation-panel',
  templateUrl: './plugin-documentation-panel.component.html',
  styleUrl: './plugin-documentation-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginDocumentationPanelComponent {
  documentationUrl = input<string | null>(null);

  safeDocumentationUrl = computed(() => {
    const documentationUrl = this.documentationUrl();
    return documentationUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(documentationUrl) : null;
  });

  constructor(private sanitizer: DomSanitizer) {}
}
