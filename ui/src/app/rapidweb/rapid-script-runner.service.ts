import { Injectable } from '@angular/core';

import { RapidScriptDescriptor } from './rapidweb.types';

const RAPID_SCRIPT_MARKER = 'data-ladon-rapid-script';

@Injectable({ providedIn: 'root' })
export class RapidScriptRunnerService {
  private readonly injectedScripts: HTMLScriptElement[] = [];

  async run(scripts: RapidScriptDescriptor[]): Promise<void> {
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

  private runScript(descriptor: RapidScriptDescriptor): Promise<void> {
    if (descriptor.kind === 'external') {
      return this.runExternalScript(descriptor);
    }

    this.runInlineScript(descriptor);
    return Promise.resolve();
  }

  private runInlineScript(descriptor: RapidScriptDescriptor): void {
    const script = this.createScriptElement(descriptor);
    if (descriptor.kind === 'inline-module') {
      script.type = 'module';
    }

    script.text = descriptor.content ?? '';
    document.head.appendChild(script);
  }

  private runExternalScript(descriptor: RapidScriptDescriptor): Promise<void> {
    const script = this.createScriptElement(descriptor);
    script.src = descriptor.src ?? '';

    return new Promise((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load rapid script: ${script.src}`));
      document.head.appendChild(script);
    });
  }

  private createScriptElement(descriptor: RapidScriptDescriptor): HTMLScriptElement {
    const script = document.createElement('script');
    this.copyAttributes(script, descriptor.attributes);
    script.setAttribute(RAPID_SCRIPT_MARKER, 'true');
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
