import { Injectable } from '@angular/core';

const BLOCKED_ELEMENTS = new Set(['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'BASE', 'META']);
const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href', 'action', 'formaction']);
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

@Injectable({ providedIn: 'root' })
export class RapidHtmlSanitizer {
  sanitize(html: string): string {
    const template = document.createElement('template');
    template.innerHTML = html;
    this.walk(template.content);

    return template.innerHTML;
  }

  private walk(root: ParentNode): void {
    for (const node of Array.from(root.childNodes)) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const element = node as Element;
      if (BLOCKED_ELEMENTS.has(element.tagName.toUpperCase())) {
        element.remove();
        continue;
      }

      this.cleanAttributes(element);
      this.walk(element);
    }
  }

  private cleanAttributes(element: Element): void {
    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        element.removeAttribute(attr.name);
        continue;
      }

      if (URL_ATTRIBUTES.has(name) && !this.isSafeUrl(attr.value)) {
        element.removeAttribute(attr.name);
      }
    }
  }

  private isSafeUrl(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith('#')) return true;
    if (trimmed.startsWith('//')) return false;
    if (trimmed.startsWith('/')) return true;

    try {
      const url = new URL(trimmed, window.location.origin);

      return ALLOWED_PROTOCOLS.includes(url.protocol) && url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
}
