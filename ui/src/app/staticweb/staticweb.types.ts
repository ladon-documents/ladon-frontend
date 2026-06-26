import { SafeHtml } from '@angular/platform-browser';

export type StaticRenderMode = 'display-only' | 'trusted';
export type StaticPolicyResultKind = 'allow' | 'deny' | 'missing' | 'legacy' | 'invalid';
export type StaticScriptKind = 'inline-classic' | 'inline-module' | 'external';

export interface StaticDefinition {
  id?: string;
  source: string;
  mode: StaticRenderMode;
  allowScripts: boolean;
  allowedScriptSources: 'same-origin';
}

export interface StaticResolveInput {
  staticId?: string | null;
  htmlId?: string | null;
  page?: string | null;
}

export interface StaticPolicyResult {
  kind: StaticPolicyResultKind;
  definition?: StaticDefinition;
  error?: string;
}

export interface StaticPolicyProvider {
  resolve(input: StaticResolveInput): StaticPolicyResult;
}

export interface StaticScriptDescriptor {
  kind: StaticScriptKind;
  content?: string;
  src?: string;
  attributes: Record<string, string>;
}

export interface StaticRenderPlan {
  mode: StaticRenderMode;
  html: string;
  safeHtml?: SafeHtml;
  scripts: StaticScriptDescriptor[];
}

export interface LadonStaticFacade {
  api: unknown;
  fetchClient: unknown;
  utility: unknown;
  auth: unknown;
  cssHref?: string;
  init(options?: Record<string, unknown>): Promise<LadonStaticFacade>;
}
