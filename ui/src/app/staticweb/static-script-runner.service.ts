import { Injectable } from '@angular/core';

import { StaticScriptDescriptor } from './staticweb.types';

const STATIC_SCRIPT_MARKER = 'data-ladon-static-script';

@Injectable({ providedIn: 'root' })
export class StaticScriptRunnerService {
  private readonly injectedScripts: HTMLScriptElement[] = [];

  async run(scripts: StaticScriptDescriptor[]): Promise<void> {
    this.cleanup();

    for (const descriptor of scripts) {
      await this.runScript(descriptor);
    }
  }

  cleanup(): void {
    for (const script of this.injectedScripts) {
      script.remove();
    }

    this.injectedScripts.length = 0;
  }

  private runScript(descriptor: StaticScriptDescriptor): Promise<void> {
    if (descriptor.kind === 'external') {
      return this.runExternalScript(descriptor);
    }

    this.runInlineScript(descriptor);
    return Promise.resolve();
  }

  private runInlineScript(descriptor: StaticScriptDescriptor): void {
    const script = this.createScriptElement(descriptor);
    if (descriptor.kind === 'inline-module') {
      script.type = 'module';
    }

    script.text = descriptor.content ?? '';
    document.head.appendChild(script);
  }

  private runExternalScript(descriptor: StaticScriptDescriptor): Promise<void> {
    const script = this.createScriptElement(descriptor);
    script.src = descriptor.src ?? '';

    return new Promise((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load static script: ${script.src}`));
      document.head.appendChild(script);
    });
  }

  private createScriptElement(descriptor: StaticScriptDescriptor): HTMLScriptElement {
    const script = document.createElement('script');
    this.copyAttributes(script, descriptor.attributes);
    script.setAttribute(STATIC_SCRIPT_MARKER, 'true');
    this.injectedScripts.push(script);

    return script;
  }

  private copyAttributes(script: HTMLScriptElement, attributes: Record<string, string>): void {
    for (const [name, value] of Object.entries(attributes)) {
      if (name.toLowerCase().startsWith('on')) {
        continue;
      }

      script.setAttribute(name, value);
    }
  }
}
