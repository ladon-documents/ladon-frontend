const ASSET_CANDIDATES = {
  api: ['../ladon-api/ladon-api-static.mjs', '../api/dist/ladon-api/ladon-api-static.mjs'],
  styles: ['../styles/global.css', '../style/dist/styles/global.css'],
};

export function resolveLadonStaticAssetCandidates(asset, baseUrl = import.meta.url) {
  const candidates = ASSET_CANDIDATES[asset];
  if (!candidates) {
    throw new Error(`Unknown Ladon static asset: ${asset}`);
  }

  const resolvedBaseUrl = new URL(baseUrl);
  const orderedCandidates = isLocalDevelopmentHost(resolvedBaseUrl) ? [...candidates].reverse() : candidates;
  return orderedCandidates.map((candidate) => new URL(candidate, resolvedBaseUrl).href);
}

export function isLocalDevelopmentHost(url) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}

export async function resolveFirstReachableUrl(urls, options = {}) {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    return urls[0];
  }

  for (const url of urls) {
    try {
      const response = await fetchImpl(url, { method: 'HEAD', cache: 'no-store' });
      if (response.ok) {
        return url;
      }
    } catch {
      // Try next candidate. This keeps local file and restricted deployments usable.
    }
  }

  return urls[0];
}

export async function importFirstAvailableModule(urls, importer = (url) => import(url)) {
  let lastError;

  for (const url of urls) {
    try {
      return await importer(url);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('No Ladon API module candidate configured');
}

export function loadStylesheet(href, documentRef = globalThis.document) {
  if (!documentRef) {
    return undefined;
  }

  const existing = documentRef.querySelector(`link[data-ladon-static-style="${href}"]`);
  if (existing) {
    return existing;
  }

  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-ladon-static-style', href);
  documentRef.head.appendChild(link);
  return link;
}

export function createLadonStaticFacade({ api, cssHref }) {
  return {
    api,
    fetchClient: api.fetchClient,
    utility: api.utility,
    auth: api.auth ?? api.utility?.auth,
    cssHref,
    init: async (options = {}) => initLadonStatic(options),
  };
}

export async function initLadonStatic(options = {}) {
  const baseUrl = options.baseUrl ?? import.meta.url;
  const resolvedBaseUrl = new URL(baseUrl);
  const isLocalHost = isLocalDevelopmentHost(resolvedBaseUrl);
  const shouldProbeAssetCandidates = options.probeAssets ?? !isLocalHost;
  const shouldLoadWebComponents = options.webComponents ?? !isLocalHost;
  const styleCandidates = resolveLadonStaticAssetCandidates('styles', baseUrl);
  const apiCandidates = options.apiUrl ? [options.apiUrl] : resolveLadonStaticAssetCandidates('api', baseUrl);
  const cssHref =
    options.cssHref ??
    (shouldProbeAssetCandidates ? await resolveFirstReachableUrl(styleCandidates, options) : styleCandidates[0]);

  if (options.styles !== false) {
    loadStylesheet(cssHref, options.document ?? globalThis.document);
  }

  const api = options.api ?? (await importFirstAvailableModule(apiCandidates, options.importer));
  const facade = createLadonStaticFacade({ api, cssHref });

  if (shouldLoadWebComponents && api.utility?.Initalizer) {
    await api.utility.Initalizer().initWebComponents(options.webComponentOptions);
  }

  globalThis.ladonStatic = facade;
  return facade;
}

if (typeof window !== 'undefined') {
  window.ladonStaticReady = initLadonStatic(window.ladonStaticConfig ?? {}).catch((error) => {
    console.error('Failed to initialize Ladon static runtime', error);
    throw error;
  });
}
