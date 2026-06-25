import { Injectable } from '@angular/core';

import { NavigationEntry, NavigationEntryType } from '../interfaces/navigation-entry';
import { DracoStaticEntry, DracoStaticMode } from './draco-static.types';
import { StaticTrustBoundaryService } from './static-trust-boundary.service';
import { StaticDefinition } from './staticweb.types';

export const STATIC_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

const HTML_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/;
const CONFIG_FIELDS = new Set(['staticId', 'html', 'mode', 'allowScripts', 'allowedScriptSources']);
const NAVIGATION_FIELDS = new Set(['id', 'label', 'target', 'component', 'path', 'icon', 'type', 'index']);
const NAVIGATION_TYPES: ReadonlySet<NavigationEntryType> = new Set(['main', 'menu']);

@Injectable({ providedIn: 'root' })
export class DracoStaticConfigService {
  constructor(private readonly trustBoundary: StaticTrustBoundaryService) {}

  parseConfig(folderName: string, raw: unknown): DracoStaticEntry {
    const config = this.requireRecord(raw, 'config');
    if (Object.keys(config).some((key) => !CONFIG_FIELDS.has(key))) {
      throw new Error('Invalid Draco static config: unknown config field.');
    }

    const staticId = this.requireString(config['staticId'], 'staticId');

    if (!STATIC_ID_PATTERN.test(staticId)) {
      throw new Error(`Invalid Draco static staticId "${staticId}".`);
    }

    if (folderName !== staticId) {
      throw new Error(`Draco static staticId "${staticId}" must match folder "${folderName}".`);
    }

    const html = this.requireString(config['html'], 'html');
    if (!this.isValidHtmlDocument(html)) {
      throw new Error(`Invalid Draco static html "${html}".`);
    }

    const requestedMode = this.parseMode(config['mode']);
    const requestedAllowScripts = this.parseAllowScripts(config['allowScripts']);
    this.parseAllowedScriptSources(config['allowedScriptSources']);

    const basePath = `${staticId}/`;
    const htmlKey = `${basePath}${html}`;
    const requestedDefinition: StaticDefinition = {
      id: staticId,
      source: htmlKey,
      mode: requestedMode === 'trusted' && requestedAllowScripts === true ? 'trusted' : 'display-only',
      allowScripts: requestedMode === 'trusted' && requestedAllowScripts === true,
      allowedScriptSources: 'same-origin',
    };
    const definition = this.trustBoundary.applyToDefinition(requestedDefinition);

    return {
      staticId,
      bucket: 'draco-statics',
      basePath,
      html,
      htmlKey,
      mode: definition.mode,
      allowScripts: definition.allowScripts,
      allowedScriptSources: 'same-origin',
      definition,
    };
  }

  parseNavigation(staticId: string, raw: unknown): NavigationEntry | undefined {
    if (raw === undefined || raw === null) {
      return undefined;
    }

    if (!this.isRecord(raw)) {
      return undefined;
    }

    if (Object.keys(raw).some((key) => !NAVIGATION_FIELDS.has(key))) {
      return undefined;
    }

    const effectiveId = `static:${staticId}`;
    if (raw['id'] !== undefined && raw['id'] !== effectiveId) {
      return undefined;
    }

    if (raw['path'] !== staticId) {
      return undefined;
    }

    if (typeof raw['label'] !== 'string' || raw['label'].trim().length === 0) {
      return undefined;
    }

    if (raw['target'] !== 'static') {
      return undefined;
    }

    if (raw['component'] !== undefined && raw['component'] !== 'Staticweb') {
      return undefined;
    }

    if (raw['type'] !== undefined && !NAVIGATION_TYPES.has(raw['type'] as NavigationEntryType)) {
      return undefined;
    }

    if (raw['index'] !== undefined && (typeof raw['index'] !== 'number' || !Number.isFinite(raw['index']))) {
      return undefined;
    }

    if (raw['icon'] !== undefined && typeof raw['icon'] !== 'string') {
      return undefined;
    }

    return {
      id: effectiveId,
      label: raw['label'],
      target: 'static',
      path: staticId,
      icon: raw['icon'],
      type: raw['type'] as NavigationEntryType | undefined,
      index: raw['index'],
    };
  }

  private requireRecord(raw: unknown, fieldName: string): Record<string, unknown> {
    if (!this.isRecord(raw)) {
      throw new Error(`Invalid Draco static ${fieldName}: expected an object.`);
    }

    return raw;
  }

  private isRecord(raw: unknown): raw is Record<string, unknown> {
    return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
  }

  private requireString(raw: unknown, fieldName: string): string {
    if (typeof raw !== 'string' || raw.length === 0) {
      throw new Error(`Invalid Draco static ${fieldName}: expected a non-empty string.`);
    }

    return raw;
  }

  private parseMode(raw: unknown): DracoStaticMode {
    if (raw === 'display-only' || raw === 'trusted') {
      return raw;
    }

    return 'display-only';
  }

  private parseAllowScripts(raw: unknown): boolean {
    if (raw === undefined) {
      return false;
    }

    if (typeof raw === 'boolean') {
      return raw;
    }

    throw new Error(`Invalid Draco static allowScripts "${String(raw)}".`);
  }

  private parseAllowedScriptSources(raw: unknown): 'same-origin' {
    if (raw === undefined || raw === 'same-origin') {
      return 'same-origin';
    }

    throw new Error(`Invalid Draco static allowedScriptSources "${String(raw)}".`);
  }

  private isValidHtmlDocument(html: string): boolean {
    return HTML_PATTERN.test(html) && !html.includes('/') && !html.includes('\\') && !html.includes('%');
  }
}
