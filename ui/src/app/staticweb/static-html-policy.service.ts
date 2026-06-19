import { Injectable } from '@angular/core';

import { StaticHtmlSanitizer } from './static-html-sanitizer.service';
import { StaticDefinition, StaticRenderPlan, StaticScriptDescriptor } from './staticweb.types';

const ALLOWED_EXTERNAL_SCRIPT_PROTOCOLS = new Set(['http:', 'https:']);

@Injectable({ providedIn: 'root' })
export class StaticHtmlPolicyService {
  constructor(private readonly htmlSanitizer: StaticHtmlSanitizer) {}

  createRenderPlan(html: string, definition: StaticDefinition): StaticRenderPlan {
    if (definition.mode === 'display-only') {
      return {
        mode: definition.mode,
        html: this.htmlSanitizer.sanitize(html),
        scripts: [],
      };
    }

    if (!definition.allowScripts) {
      throw new Error('Trusted static content requires scripts to be allowed');
    }

    const template = document.createElement('template');
    template.innerHTML = html;

    const scripts = Array.from(template.content.querySelectorAll('script')).map((script) => {
      const descriptor = this.createScriptDescriptor(script);
      script.remove();

      return descriptor;
    });

    return {
      mode: definition.mode,
      html: template.innerHTML,
      scripts,
    };
  }

  private createScriptDescriptor(script: HTMLScriptElement): StaticScriptDescriptor {
    if (script.hasAttribute('src')) {
      return this.createExternalScriptDescriptor(script);
    }

    return {
      kind: script.type.trim().toLowerCase() === 'module' ? 'inline-module' : 'inline-classic',
      content: script.textContent ?? '',
      attributes: this.collectAttributes(script),
    };
  }

  private createExternalScriptDescriptor(script: HTMLScriptElement): StaticScriptDescriptor {
    const rawSrc = script.getAttribute('src')?.trim() ?? '';
    if (!rawSrc) {
      throw new Error('External script source is not allowed');
    }

    let url: URL;
    try {
      url = new URL(rawSrc, window.location.origin);
    } catch {
      throw new Error('External script source is not allowed');
    }

    if (!ALLOWED_EXTERNAL_SCRIPT_PROTOCOLS.has(url.protocol) || url.origin !== window.location.origin) {
      throw new Error('External script source is not allowed');
    }

    return {
      kind: 'external',
      src: url.href,
      attributes: this.collectAttributes(script, new Set(['src'])),
    };
  }

  private collectAttributes(script: HTMLScriptElement, excluded = new Set<string>()): Record<string, string> {
    return Array.from(script.attributes).reduce<Record<string, string>>((attributes, attr) => {
      const name = attr.name.toLowerCase();
      if (!excluded.has(name)) {
        attributes[attr.name] = attr.value;
      }

      return attributes;
    }, {});
  }
}
