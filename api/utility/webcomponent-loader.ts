import { DocumentsApi } from '../fetch-client';

export type WebComponentSource = 'server' | 'local';

export interface WebComponentServerConfig {
  bucket?: string;
  term?: string;
  limit?: number;
}

export interface WebComponentLocalConfig {
  basePath?: string;
  manifestPath?: string;
  scripts?: string[];
}

export interface WebComponentLoaderOptions {
  source?: WebComponentSource;
  server?: WebComponentServerConfig;
  local?: WebComponentLocalConfig;
  fallbackToServer?: boolean;
}

export class WebcomponentLoader {
  private readonly defaultServerConfig: Required<WebComponentServerConfig> = {
    bucket: '_ui',
    term: '*/draco/**/wc-*.js',
    limit: 100,
  };

  private readonly defaultLocalConfig: Required<Pick<WebComponentLocalConfig, 'basePath' | 'manifestPath'>> = {
    basePath: '/public/dev-wc',
    manifestPath: '/public/dev-wc/manifest.json',
  };

  private readonly documentApi: DocumentsApi;

  constructor() {
    this.documentApi = new DocumentsApi();
  }

  public async initWebComponents(options: WebComponentLoaderOptions = {}): Promise<boolean> {
    const source = options.source ?? 'server';

    if (source === 'local') {
      const localLoaded = await this.initWebComponentsFromLocal(options.local);
      if (localLoaded) {
        return true;
      }

      if (options.fallbackToServer) {
        return this.initWebComponentsFromServer(options.server);
      }

      return false;
    }

    return this.initWebComponentsFromServer(options.server);
  }

  private async initWebComponentsFromServer(serverConfig?: WebComponentServerConfig): Promise<boolean> {
    const config = {
      ...this.defaultServerConfig,
      ...(serverConfig || {}),
    };

    try {
      const result = await this.documentApi.findDocumentPath({
        bucket: config.bucket,
        term: config.term,
        limit: config.limit,
      });

      if (Array.isArray(result)) {
        for (const webcomponent of result) {
          this.injectWebComponent(this.normalizeServerPath(webcomponent));
        }
      }

      return true;
    } catch (error) {
      console.warn('WebcomponentLoader: failed to load webcomponents from server', error);
      return false;
    }
  }

  private async initWebComponentsFromLocal(localConfig?: WebComponentLocalConfig): Promise<boolean> {
    const config = {
      ...this.defaultLocalConfig,
      ...(localConfig || {}),
    };

    try {
      const scripts = await this.resolveLocalScripts(config);
      for (const script of scripts) {
        this.injectWebComponent(script);
      }
      return true;
    } catch (error) {
      console.warn('WebcomponentLoader: failed to load local webcomponents', error);
      return false;
    }
  }

  private async resolveLocalScripts(config: WebComponentLocalConfig & { basePath: string; manifestPath: string }): Promise<string[]> {
    if (Array.isArray(config.scripts) && config.scripts.length > 0) {
      return config.scripts.map((script) => this.toLocalScriptUrl(script, config.basePath));
    }

    const manifestUrl = this.resolvePublicPath(config.manifestPath);
    const response = await fetch(manifestUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Local manifest not reachable: ${manifestUrl} (${response.status})`);
    }

    const manifest = await response.json();
    const entries = Array.isArray(manifest)
      ? manifest
      : Array.isArray((manifest as { scripts?: unknown[] }).scripts)
        ? (manifest as { scripts: unknown[] }).scripts
        : [];

    return entries
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map((script) => this.toLocalScriptUrl(script, config.basePath));
  }

  private toLocalScriptUrl(script: string, basePath: string): string {
    const trimmed = script.trim();
    if (/^(https?:)?\/\//.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('/')) {
      return this.resolvePublicPath(trimmed);
    }

    const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const normalizedScript = trimmed.startsWith('./') ? trimmed.slice(2) : trimmed;
    return this.resolvePublicPath(`${normalizedBase}/${normalizedScript}`);
  }

  private normalizeServerPath(url: string): string {
    return url.replace('/_ui', '/ui');
  }

  private injectWebComponent(url: string): void {
    if (!url) {
      return;
    }

    const existing = document.querySelector(`script[data-ladon-wc-src="${url}"]`);
    if (existing) {
      return;
    }

    const wcScriptElm = document.createElement('script');
    wcScriptElm.setAttribute('src', url);
    wcScriptElm.setAttribute('type', 'module');
    wcScriptElm.setAttribute('data-ladon-wc-src', url);

    document.body.appendChild(wcScriptElm);
  }

  private resolvePublicPath(rawPath: string): string {
    const trimmedPath = rawPath.trim();
    if (!trimmedPath) {
      return trimmedPath;
    }

    if (/^(https?:)?\/\//.test(trimmedPath)) {
      return trimmedPath;
    }

    const basePath = this.getBaseHrefPath();
    if (!basePath) {
      return trimmedPath;
    }

    if (trimmedPath.startsWith('/')) {
      if (trimmedPath === basePath || trimmedPath.startsWith(`${basePath}/`)) {
        return trimmedPath;
      }
      return `${basePath}${trimmedPath}`;
    }

    const normalizedPath = trimmedPath.startsWith('./') ? trimmedPath.slice(2) : trimmedPath;
    return `${basePath}/${normalizedPath}`;
  }

  private getBaseHrefPath(): string {
    const baseHref = document.querySelector('base')?.getAttribute('href') || '/';

    try {
      const url = new URL(baseHref, window.location.origin);
      const normalizedPath = url.pathname.replace(/\/+$/, '');
      return normalizedPath === '' ? '' : normalizedPath;
    } catch {
      return '';
    }
  }
}

export const webComponentLoader = new WebcomponentLoader();
