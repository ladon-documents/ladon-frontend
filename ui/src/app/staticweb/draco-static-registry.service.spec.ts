import { TestBed } from '@angular/core/testing';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { DracoStaticRegistryService } from './draco-static-registry.service';
import { STATIC_SOURCE_CONFIG } from './static-source-config';
import { STATIC_TRUSTED_EXECUTION_ENABLED } from './static-trust-boundary.service';

type DocumentStub = { key?: string };

describe('DracoStaticRegistryService', () => {
  let service: DracoStaticRegistryService;
  let documentsApi: jasmine.SpyObj<{
    listDocuments: (request: Record<string, unknown>) => Promise<DocumentStub[]>;
    getDocument: (request: Record<string, unknown>) => Promise<Blob>;
  }>;

  function configureService(sourceConfig?: unknown): void {
    TestBed.resetTestingModule();
    documentsApi = jasmine.createSpyObj('documentsApi', ['listDocuments', 'getDocument']);

    TestBed.configureTestingModule({
      providers: [
        DracoStaticRegistryService,
        { provide: STATIC_TRUSTED_EXECUTION_ENABLED, useValue: true },
        { provide: FetchApiFactory, useValue: { documentsApi } },
        ...(sourceConfig ? [{ provide: STATIC_SOURCE_CONFIG, useValue: sourceConfig }] : []),
      ],
    });

    service = TestBed.inject(DracoStaticRegistryService);
  }

  function jsonBlob(value: unknown): Blob {
    return new Blob([JSON.stringify(value)], { type: 'application/json' });
  }

  function validConfig(staticId = 'demo-static', overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      staticId,
      html: 'index.html',
      mode: 'trusted',
      allowScripts: true,
      ...overrides,
    };
  }

  function validNavigation(staticId = 'demo-static', overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      label: 'Demo Static',
      target: 'static',
      path: staticId,
      component: 'Staticweb',
      type: 'main',
      index: 5,
      ...overrides,
    };
  }

  function mockDocumentLoads(loads: Record<string, unknown | Error>): void {
    documentsApi.getDocument.and.callFake(({ key }) => {
      const value = loads[String(key)];
      if (value instanceof Error) {
        return Promise.reject(value);
      }

      if (value === undefined) {
        return Promise.reject(new Error(`Missing ${String(key)}`));
      }

      return Promise.resolve(jsonBlob(value));
    });
  }

  beforeEach(() => {
    configureService();
  });

  it('starts idle and exposes an empty snapshot', () => {
    const snapshot = service.snapshot();

    expect(snapshot.state).toBe('idle');
    expect(snapshot.entries).toEqual([]);
    expect(snapshot.byId.size).toBe(0);
  });

  it('discovers config files from draco-statics documentlist', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-static/config.json' }, { key: 'notes/readme.md' }]);
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(documentsApi.listDocuments).toHaveBeenCalledOnceWith({
      bucket: 'draco-statics',
      limit: 1000,
      page: 0,
      currentFolder: false,
    });
    expect(snapshot.state).toBe('ready');
    expect(snapshot.entries.map((entry) => entry.staticId)).toEqual(['demo-static']);
    expect(documentsApi.getDocument).toHaveBeenCalledWith({ bucket: 'draco-statics', key: 'demo-static/config.json' });
  });

  it('discovers local dev statics from the configured manifest without calling documentlist', async () => {
    configureService({
      source: 'local',
      local: {
        basePath: '/ui/draco/ladon-core/public/dev-statics',
        manifestPath: '/ui/draco/ladon-core/public/dev-statics/static-pages.json',
      },
    });
    const fetchSpy = spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/ui/draco/ladon-core/public/dev-statics/static-pages.json') {
        return Promise.resolve(new Response(JSON.stringify(['demo-static']), { status: 200 }));
      }
      if (url === '/ui/draco/ladon-core/public/dev-statics/demo-static/config.json') {
        return Promise.resolve(new Response(JSON.stringify(validConfig()), { status: 200 }));
      }
      if (url === '/ui/draco/ladon-core/public/dev-statics/demo-static/navigation.json') {
        return Promise.resolve(new Response(JSON.stringify(validNavigation()), { status: 200 }));
      }

      return Promise.resolve(new Response('missing', { status: 404 }));
    });

    const snapshot = await service.discover();

    expect(documentsApi.listDocuments).not.toHaveBeenCalled();
    expect(documentsApi.getDocument).not.toHaveBeenCalled();
    expect(fetchSpy.calls.allArgs().map(([input]) => String(input))).toEqual([
      '/ui/draco/ladon-core/public/dev-statics/static-pages.json',
      '/ui/draco/ladon-core/public/dev-statics/demo-static/config.json',
      '/ui/draco/ladon-core/public/dev-statics/demo-static/navigation.json',
    ]);
    expect(snapshot.state).toBe('ready');
    expect(snapshot.entries[0]).toEqual(
      jasmine.objectContaining({
        staticId: 'demo-static',
        bucket: 'draco-statics',
        basePath: 'demo-static/',
        htmlKey: 'demo-static/index.html',
      }),
    );
  });

  it('loads valid config and optional navigation json', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-static/config.json' }]);
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
      'demo-static/navigation.json': validNavigation(),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries[0]).toEqual(
      jasmine.objectContaining({
        staticId: 'demo-static',
        htmlKey: 'demo-static/index.html',
        navigation: jasmine.objectContaining({
          id: 'static:demo-static',
          label: 'Demo Static',
          path: 'demo-static',
        }),
      }),
    );
    expect(documentsApi.getDocument).toHaveBeenCalledWith({
      bucket: 'draco-statics',
      key: 'demo-static/navigation.json',
    });
  });

  it('logs and skips invalid optional navigation json', async () => {
    const warnSpy = spyOn(console, 'warn');
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-static/config.json' }]);
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
      'demo-static/navigation.json': validNavigation('demo-static', { target: 'internal' }),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries[0].navigation).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/navigation.*demo-static/i));
  });

  it('treats generated fetch 404 errors as missing optional navigation', async () => {
    const warnSpy = spyOn(console, 'warn');
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-static/config.json' }]);
    documentsApi.getDocument.and.callFake(({ key }) => {
      if (key === 'demo-static/navigation.json') {
        return Promise.reject({ response: { status: 404 } });
      }

      return Promise.resolve(jsonBlob(validConfig()));
    });

    const snapshot = await service.discover();

    expect(snapshot.entries[0].staticId).toBe('demo-static');
    expect(snapshot.entries[0].navigation).toBeUndefined();
    expect(warnSpy).not.toHaveBeenCalledWith(jasmine.stringMatching(/navigation.*demo-static/i));
  });

  it('skips invalid config and keeps discovery fail-soft', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'bad-static/config.json' }, { key: 'demo-static/config.json' }]);
    mockDocumentLoads({
      'bad-static/config.json': { staticId: 'bad-static', html: '../index.html' },
      'demo-static/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.state).toBe('ready');
    expect(snapshot.entries.map((entry) => entry.staticId)).toEqual(['demo-static']);
  });

  it('sets state failed when documentlist fails', async () => {
    documentsApi.listDocuments.and.rejectWith(new Error('list unavailable'));

    const snapshot = await service.discover();

    expect(snapshot.state).toBe('failed');
    expect(snapshot.error).toContain('list unavailable');
    expect(snapshot.entries).toEqual([]);
  });

  it('does not duplicate concurrent discovery requests', async () => {
    let resolveList!: (documents: DocumentStub[]) => void;
    documentsApi.listDocuments.and.returnValue(new Promise((resolve) => (resolveList = resolve)));

    const first = service.discover();
    const second = service.discover();
    resolveList([]);

    await Promise.all([first, second]);

    expect(documentsApi.listDocuments).toHaveBeenCalledTimes(1);
  });

  it('preserves on-demand entries added while discovery is in flight', async () => {
    let resolveList!: (documents: DocumentStub[]) => void;
    documentsApi.listDocuments.and.returnValue(new Promise((resolve) => (resolveList = resolve)));
    mockDocumentLoads({
      'on-demand/config.json': validConfig('on-demand'),
    });

    const discovery = service.discover();
    const entry = await service.lookupOnDemand('on-demand');
    resolveList([]);
    const snapshot = await discovery;

    expect(entry?.staticId).toBe('on-demand');
    expect(snapshot.entries.map((item) => item.staticId)).toEqual(['on-demand']);
    expect(service.getById('on-demand')?.staticId).toBe('on-demand');
  });

  it('preserves existing on-demand entries when in-flight discovery fails', async () => {
    let rejectList!: (error: Error) => void;
    documentsApi.listDocuments.and.returnValue(new Promise((_, reject) => (rejectList = reject)));
    mockDocumentLoads({
      'on-demand/config.json': validConfig('on-demand'),
    });

    const discovery = service.discover();
    const entry = await service.lookupOnDemand('on-demand');
    rejectList(new Error('list unavailable'));
    const snapshot = await discovery;

    expect(entry?.staticId).toBe('on-demand');
    expect(snapshot.state).toBe('failed');
    expect(snapshot.entries.map((item) => item.staticId)).toEqual(['on-demand']);
    expect(service.getById('on-demand')?.staticId).toBe('on-demand');
  });

  it('looks up static entries by id', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-static/config.json' }]);
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
    });

    await service.discover();

    expect(service.getById('demo-static')?.staticId).toBe('demo-static');
    expect(service.getById('missing-static')).toBeUndefined();
  });

  it('performs on-demand lookup after failed discovery', async () => {
    documentsApi.listDocuments.and.rejectWith(new Error('list unavailable'));
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
      'demo-static/navigation.json': validNavigation(),
    });

    await service.discover();
    const entry = await service.lookupOnDemand('demo-static');

    expect(entry?.staticId).toBe('demo-static');
    expect(service.snapshot().state).toBe('ready');
    expect(documentsApi.getDocument).toHaveBeenCalledWith({ bucket: 'draco-statics', key: 'demo-static/config.json' });
  });

  it('paginates document listing until the final short page', async () => {
    documentsApi.listDocuments.and.callFake(({ page }) =>
      Promise.resolve(
        page === 0
          ? Array.from({ length: 1000 }, (_, index) => ({ key: `ignored-${index}.txt` }))
          : [{ key: 'demo-static/config.json' }],
      ),
    );
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries.map((entry) => entry.staticId)).toEqual(['demo-static']);
    expect(documentsApi.listDocuments.calls.allArgs().map(([request]) => request['page'])).toEqual([0, 1]);
  });

  it('continues through full pages with only non-config assets', async () => {
    documentsApi.listDocuments.and.callFake(({ page }) =>
      Promise.resolve(
        page === 0 || page === 1
          ? Array.from({ length: 1000 }, (_, index) => ({ key: `assets-${page}-${index}.txt` }))
          : [{ key: 'demo-static/config.json' }],
      ),
    );
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries.map((entry) => entry.staticId)).toEqual(['demo-static']);
    expect(documentsApi.listDocuments.calls.allArgs().map(([request]) => request['page'])).toEqual([0, 1, 2]);
  });

  it('stops paginating when the same full document page repeats', async () => {
    const repeatedPage = [
      { key: 'demo-static/config.json' },
      ...Array.from({ length: 999 }, (_, index) => ({ key: `ignored-${index}.txt` })),
    ];
    documentsApi.listDocuments.and.callFake(({ page }) => {
      if (Number(page) > 1) {
        return Promise.reject(new Error('pagination guard did not stop'));
      }

      return Promise.resolve(repeatedPage);
    });
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.state).toBe('ready');
    expect(snapshot.entries.map((entry) => entry.staticId)).toEqual(['demo-static']);
    expect(documentsApi.listDocuments.calls.allArgs().map(([request]) => request['page'])).toEqual([0, 1]);
  });

  it('does not let snapshot callers mutate registry state', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-static/config.json' }]);
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
    });
    await service.discover();

    const snapshot = service.snapshot();
    const injectedEntry = { ...snapshot.entries[0], staticId: 'injected-static' };
    try {
      (snapshot.entries as typeof snapshot.entries[number][]).push(injectedEntry);
    } catch {
      // Frozen arrays throw in strict mode.
    }
    (snapshot.byId as Map<string, typeof snapshot.entries[number]>).set('injected-static', injectedEntry);

    const nextSnapshot = service.snapshot();
    expect(nextSnapshot.entries.map((entry) => entry.staticId)).toEqual(['demo-static']);
    expect(nextSnapshot.byId.has('injected-static')).toBeFalse();
  });

  it('does not let snapshot emissions mutate registry state', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-static/config.json' }]);
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
    });
    let emittedSnapshot = service.snapshot();
    const subscription = service.snapshot$.subscribe((snapshot) => {
      emittedSnapshot = snapshot;
    });

    await service.discover();
    const injectedEntry = { ...emittedSnapshot.entries[0], staticId: 'injected-static' };
    try {
      (emittedSnapshot.entries as typeof emittedSnapshot.entries[number][]).push(injectedEntry);
    } catch {
      // Frozen arrays throw in strict mode.
    }
    (emittedSnapshot.byId as Map<string, typeof emittedSnapshot.entries[number]>).set('injected-static', injectedEntry);
    subscription.unsubscribe();

    expect(service.snapshot().entries.map((entry) => entry.staticId)).toEqual(['demo-static']);
    expect(service.snapshot().byId.has('injected-static')).toBeFalse();
  });

  it('keeps the first valid static when duplicate static ids are discovered', async () => {
    documentsApi.listDocuments.and.resolveTo([
      { key: 'demo-static/config.json' },
      { key: 'demo-static/config.json' },
    ]);
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries.length).toBe(1);
    expect(snapshot.entries[0].staticId).toBe('demo-static');
  });

  it('rejects invalid on-demand static ids before constructing document keys', async () => {
    for (const invalidId of ['../x', 'demo%2fx', 'bad:id', 'bad id', 'Demo', 'übung']) {
      expect(await service.lookupOnDemand(invalidId)).toBeUndefined();
    }

    expect(documentsApi.getDocument).not.toHaveBeenCalled();
  });

  it('skips listed invalid config keys before loading config documents', async () => {
    documentsApi.listDocuments.and.resolveTo([
      { key: 'nested/demo-static/config.json' },
      { key: 'Demo/config.json' },
      { key: '%2e%2e/config.json' },
      { key: 'bad:id/config.json' },
      { key: 'demo-static/config.json' },
    ]);
    mockDocumentLoads({
      'demo-static/config.json': validConfig(),
    });

    await service.discover();

    expect(documentsApi.getDocument.calls.allArgs().map(([request]) => request['key'])).toEqual([
      'demo-static/config.json',
      'demo-static/navigation.json',
    ]);
  });
});
