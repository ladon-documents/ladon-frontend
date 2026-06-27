import { Injectable } from '@angular/core';

import { StaticAssetUrlService } from './static-asset-url.service';

@Injectable({ providedIn: 'root' })
export class StaticAssetRewriterService {
  constructor(private readonly assetUrl: StaticAssetUrlService) {}

  rewrite(html: string, basePath: string): string {
    const template = document.createElement('template');
    template.innerHTML = html;

    this.rewriteAttribute(template, 'script[src]', 'src', basePath, true);
    this.rewriteStylesheetLinks(template, basePath);
    this.rewriteAttribute(template, 'img[src]', 'src', basePath, false);
    this.rewriteAttribute(template, 'source[src]', 'src', basePath, false);
    this.rewriteAttribute(template, 'video[src]', 'src', basePath, false);
    this.rewriteAttribute(template, 'audio[src]', 'src', basePath, false);

    return template.innerHTML;
  }

  private rewriteStylesheetLinks(template: HTMLTemplateElement, basePath: string): void {
    for (const link of Array.from(template.content.querySelectorAll<HTMLLinkElement>('link[href]'))) {
      const rel = link.getAttribute('rel') ?? '';
      if (!rel.split(/\s+/).some((value) => value.toLowerCase() === 'stylesheet')) continue;

      this.rewriteElementAttribute(link, 'href', basePath, false);
    }
  }

  private rewriteAttribute(
    template: HTMLTemplateElement,
    selector: string,
    attribute: string,
    basePath: string,
    script: boolean,
  ): void {
    for (const element of Array.from(template.content.querySelectorAll<HTMLElement>(selector))) {
      this.rewriteElementAttribute(element, attribute, basePath, script);
    }
  }

  private rewriteElementAttribute(element: Element, attribute: string, basePath: string, script: boolean): void {
    const rawValue = element.getAttribute(attribute) ?? '';
    const value = rawValue.trim();

    if (script && /[\\?#]/.test(value)) throw new Error('Static asset path is not allowed');
    if (!value || value.startsWith('#')) return;
    if (script && this.isExternalOrAbsoluteUrl(value)) throw new Error('Static asset path is not allowed');
    if (this.isExternalOrAbsoluteUrl(value)) return;

    element.setAttribute(attribute, this.assetUrl.buildAssetUrl(basePath, value));
  }

  private isExternalOrAbsoluteUrl(value: string): boolean {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(value);
  }
}
