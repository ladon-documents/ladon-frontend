import { NavigationEntry } from '../interfaces/navigation-entry';
import { StaticDefinition } from './staticweb.types';

export type DracoStaticDiscoveryState = 'idle' | 'loading' | 'ready' | 'failed';
export type DracoStaticMode = 'display-only' | 'trusted';

export interface DracoStaticConfigJson {
  staticId?: unknown;
  html?: unknown;
  mode?: unknown;
  allowScripts?: unknown;
  allowedScriptSources?: unknown;
}

export interface DracoStaticNavigationJson {
  id?: unknown;
  label?: unknown;
  target?: unknown;
  component?: unknown;
  path?: unknown;
  icon?: unknown;
  type?: unknown;
  index?: unknown;
}

export interface DracoStaticEntry {
  staticId: string;
  bucket: 'draco-statics';
  basePath: string;
  html: string;
  htmlKey: string;
  mode: DracoStaticMode;
  allowScripts: boolean;
  allowedScriptSources: 'same-origin';
  definition: StaticDefinition;
  navigation?: NavigationEntry;
}

export interface DracoStaticRegistrySnapshot {
  state: DracoStaticDiscoveryState;
  entries: DracoStaticEntry[];
  byId: ReadonlyMap<string, DracoStaticEntry>;
  error?: string;
}
