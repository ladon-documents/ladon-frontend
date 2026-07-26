import { SafeHtml } from '@angular/platform-browser';

export type RapidRenderMode = 'display-only' | 'trusted';
export type RapidPolicyResultKind = 'allow' | 'deny' | 'missing' | 'legacy' | 'invalid';
export type RapidScriptKind = 'inline-classic' | 'inline-module' | 'external';

export interface RapidDefinition {
  id?: string;
  source: string;
  mode: RapidRenderMode;
  allowScripts: boolean;
  allowedScriptSources: 'same-origin';
}

export interface RapidResolveInput {
  rapidId?: string | null;
}

export interface RapidPolicyResult {
  kind: RapidPolicyResultKind;
  definition?: RapidDefinition;
  error?: string;
}

export interface RapidPolicyProvider {
  resolve(input: RapidResolveInput): RapidPolicyResult;
}

export interface RapidScriptDescriptor {
  kind: RapidScriptKind;
  content?: string;
  src?: string;
  attributes: Record<string, string>;
}

export interface RapidRenderPlan {
  mode: RapidRenderMode;
  html: string;
  safeHtml?: SafeHtml;
  scripts: RapidScriptDescriptor[];
}

export interface LadonRapidFacade {
  api: unknown;
  fetchClient: unknown;
  utility: unknown;
  auth: unknown;
  cssHref?: string;
  init(options?: Record<string, unknown>): Promise<LadonRapidFacade>;
}
