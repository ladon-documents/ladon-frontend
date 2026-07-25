import { NavigationEntry } from '../interfaces/navigation-entry';
import { RapidDefinition } from './rapidweb.types';

export type DracoRapidDiscoveryState = 'idle' | 'loading' | 'ready' | 'failed';
export type DracoRapidMode = 'display-only' | 'trusted';

export interface DracoRapidConfigJson {
  rapidId?: unknown;
  html?: unknown;
  mode?: unknown;
  allowScripts?: unknown;
  allowedScriptSources?: unknown;
}

export interface DracoRapidNavigationJson {
  id?: unknown;
  label?: unknown;
  target?: unknown;
  component?: unknown;
  path?: unknown;
  icon?: unknown;
  type?: unknown;
  index?: unknown;
}

export interface DracoRapidEntry {
  rapidId: string;
  bucket: 'draco-rapids';
  basePath: string;
  html: string;
  htmlKey: string;
  mode: DracoRapidMode;
  allowScripts: boolean;
  allowedScriptSources: 'same-origin';
  definition: RapidDefinition;
  navigation?: NavigationEntry;
}

export interface DracoRapidRegistrySnapshot {
  state: DracoRapidDiscoveryState;
  entries: DracoRapidEntry[];
  byId: ReadonlyMap<string, DracoRapidEntry>;
  error?: string;
}
