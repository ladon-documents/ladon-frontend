import { TestBed } from '@angular/core/testing';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { DracoRapidRegistryService } from './draco-rapid-registry.service';
import { RAPID_SOURCE_CONFIG } from './rapid-source-config';
import { RAPID_TRUSTED_EXECUTION_ENABLED } from './rapid-trust-boundary.service';

type DocumentStub = { key?: string };

describe('DracoRapidRegistryService', () => {
  let service: DracoRapidRegistryService;
  let documentsApi: jasmine.SpyObj<{
    listDocuments: (request: Record<string, unknown>) => Promise<DocumentStub[]>;
    getDocument: (request: Record<string, unknown>) => Promise<Blob>;
  }>;

  function configureService(sourceConfig?: unknown): void {
    TestBed.resetTestingModule();
    documentsApi = jasmine.createSpyObj('documentsApi', ['listDocuments', 'getDocument']);

    TestBed.configureTestingModule({
      providers: [
        DracoRapidRegistryService,
        { provide: RAPID_TRUSTED_EXECUTION_ENABLED, useValue: true },
        { provide: FetchApiFactory, useValue: { documentsApi } },
        ...(sourceConfig ? [{ provide: RAPID_SOURCE_CONFIG, useValue: sourceConfig }] : []),
      ],
    });

    service = TestBed.inject(DracoRapidRegistryService);
  }

  function jsonBlob(value: unknown): Blob {
    return new Blob([JSON.stringify(value)], { type: 'application/json' });
  }

  function validConfig(rapidId = 'demo-rapid', overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      rapidId,
      html: 'index.html',
      mode: 'trusted',
      allowScripts: true,
      ...overrides,
    };
  }

  function validNavigation(rapidId = 'demo-rapid', overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      label: 'Demo Rapid',
      target: 'rapid',
      path: rapidId,
      component: 'Rapidweb',
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

  it('discovers config files from draco-rapids documentlist', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-rapid/config.json' }, { key: 'notes/readme.md' }]);
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(documentsApi.listDocuments).toHaveBeenCalledOnceWith({
      bucket: 'draco-rapids',
      limit: 1000,
      page: 0,
      currentFolder: false,
    });
    expect(snapshot.state).toBe('ready');
    expect(snapshot.entries.map((entry) => entry.rapidId)).toEqual(['demo-rapid']);
    expect(documentsApi.getDocument).toHaveBeenCalledWith({ bucket: 'draco-rapids', key: 'demo-rapid/config.json' });
  });

  it('discovers local dev rapids from the configured manifest without calling documentlist', async () => {
    configureService({
      source: 'local',
      local: {
        basePath: '/ui/draco/ladon-core/public/dev-rapids',
        manifestPath: '/ui/draco/ladon-core/public/dev-rapids/rapid-pages.json',
      },
    });
    const fetchSpy = spyOn(window, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/ui/draco/ladon-core/public/dev-rapids/rapid-pages.json') {
        return Promise.resolve(new Response(JSON.stringify(['demo-rapid']), { status: 200 }));
      }
      if (url === '/ui/draco/ladon-core/public/dev-rapids/demo-rapid/config.json') {
        return Promise.resolve(new Response(JSON.stringify(validConfig()), { status: 200 }));
      }
      if (url === '/ui/draco/ladon-core/public/dev-rapids/demo-rapid/navigation.json') {
        return Promise.resolve(new Response(JSON.stringify(validNavigation()), { status: 200 }));
      }

      return Promise.resolve(new Response('missing', { status: 404 }));
    });

    const snapshot = await service.discover();

    expect(documentsApi.listDocuments).not.toHaveBeenCalled();
    expect(documentsApi.getDocument).not.toHaveBeenCalled();
    expect(fetchSpy.calls.allArgs().map(([input]) => String(input))).toEqual([
      '/ui/draco/ladon-core/public/dev-rapids/rapid-pages.json',
      '/ui/draco/ladon-core/public/dev-rapids/demo-rapid/config.json',
      '/ui/draco/ladon-core/public/dev-rapids/demo-rapid/navigation.json',
    ]);
    expect(snapshot.state).toBe('ready');
    expect(snapshot.entries[0]).toEqual(
      jasmine.objectContaining({
        rapidId: 'demo-rapid',
        bucket: 'draco-rapids',
        basePath: 'demo-rapid/',
        htmlKey: 'demo-rapid/index.html',
      }),
    );
  });

  it('loads valid config and optional navigation json', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-rapid/config.json' }]);
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
      'demo-rapid/navigation.json': validNavigation(),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries[0]).toEqual(
      jasmine.objectContaining({
        rapidId: 'demo-rapid',
        htmlKey: 'demo-rapid/index.html',
        navigation: jasmine.objectContaining({
          id: 'rapid:demo-rapid',
          label: 'Demo Rapid',
          path: 'demo-rapid',
        }),
      }),
    );
    expect(documentsApi.getDocument).toHaveBeenCalledWith({
      bucket: 'draco-rapids',
      key: 'demo-rapid/navigation.json',
    });
  });

  it('logs and skips invalid optional navigation json', async () => {
    const warnSpy = spyOn(console, 'warn');
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-rapid/config.json' }]);
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
      'demo-rapid/navigation.json': validNavigation('demo-rapid', { target: 'internal' }),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries[0].navigation).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/navigation.*demo-rapid/i));
  });

  it('treats generated fetch 404 errors as missing optional navigation', async () => {
    const warnSpy = spyOn(console, 'warn');
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-rapid/config.json' }]);
    documentsApi.getDocument.and.callFake(({ key }) => {
      if (key === 'demo-rapid/navigation.json') {
        return Promise.reject({ response: { status: 404 } });
      }

      return Promise.resolve(jsonBlob(validConfig()));
    });

    const snapshot = await service.discover();

    expect(snapshot.entries[0].rapidId).toBe('demo-rapid');
    expect(snapshot.entries[0].navigation).toBeUndefined();
    expect(warnSpy).not.toHaveBeenCalledWith(jasmine.stringMatching(/navigation.*demo-rapid/i));
  });

  it('skips invalid config and keeps discovery fail-soft', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'bad-rapid/config.json' }, { key: 'demo-rapid/config.json' }]);
    mockDocumentLoads({
      'bad-rapid/config.json': { rapidId: 'bad-rapid', html: '../index.html' },
      'demo-rapid/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.state).toBe('ready');
    expect(snapshot.entries.map((entry) => entry.rapidId)).toEqual(['demo-rapid']);
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

    expect(entry?.rapidId).toBe('on-demand');
    expect(snapshot.entries.map((item) => item.rapidId)).toEqual(['on-demand']);
    expect(service.getById('on-demand')?.rapidId).toBe('on-demand');
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

    expect(entry?.rapidId).toBe('on-demand');
    expect(snapshot.state).toBe('failed');
    expect(snapshot.entries.map((item) => item.rapidId)).toEqual(['on-demand']);
    expect(service.getById('on-demand')?.rapidId).toBe('on-demand');
  });

  it('looks up rapid entries by id', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-rapid/config.json' }]);
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
    });

    await service.discover();

    expect(service.getById('demo-rapid')?.rapidId).toBe('demo-rapid');
    expect(service.getById('missing-rapid')).toBeUndefined();
  });

  it('performs on-demand lookup after failed discovery', async () => {
    documentsApi.listDocuments.and.rejectWith(new Error('list unavailable'));
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
      'demo-rapid/navigation.json': validNavigation(),
    });

    await service.discover();
    const entry = await service.lookupOnDemand('demo-rapid');

    expect(entry?.rapidId).toBe('demo-rapid');
    expect(service.snapshot().state).toBe('ready');
    expect(documentsApi.getDocument).toHaveBeenCalledWith({ bucket: 'draco-rapids', key: 'demo-rapid/config.json' });
  });

  it('paginates document listing until the final short page', async () => {
    documentsApi.listDocuments.and.callFake(({ page }) =>
      Promise.resolve(
        page === 0
          ? Array.from({ length: 1000 }, (_, index) => ({ key: `ignored-${index}.txt` }))
          : [{ key: 'demo-rapid/config.json' }],
      ),
    );
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries.map((entry) => entry.rapidId)).toEqual(['demo-rapid']);
    expect(documentsApi.listDocuments.calls.allArgs().map(([request]) => request['page'])).toEqual([0, 1]);
  });

  it('continues through full pages with only non-config assets', async () => {
    documentsApi.listDocuments.and.callFake(({ page }) =>
      Promise.resolve(
        page === 0 || page === 1
          ? Array.from({ length: 1000 }, (_, index) => ({ key: `assets-${page}-${index}.txt` }))
          : [{ key: 'demo-rapid/config.json' }],
      ),
    );
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries.map((entry) => entry.rapidId)).toEqual(['demo-rapid']);
    expect(documentsApi.listDocuments.calls.allArgs().map(([request]) => request['page'])).toEqual([0, 1, 2]);
  });

  it('stops paginating when the same full document page repeats', async () => {
    const repeatedPage = [
      { key: 'demo-rapid/config.json' },
      ...Array.from({ length: 999 }, (_, index) => ({ key: `ignored-${index}.txt` })),
    ];
    documentsApi.listDocuments.and.callFake(({ page }) => {
      if (Number(page) > 1) {
        return Promise.reject(new Error('pagination guard did not stop'));
      }

      return Promise.resolve(repeatedPage);
    });
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.state).toBe('ready');
    expect(snapshot.entries.map((entry) => entry.rapidId)).toEqual(['demo-rapid']);
    expect(documentsApi.listDocuments.calls.allArgs().map(([request]) => request['page'])).toEqual([0, 1]);
  });

  it('does not let snapshot callers mutate registry state', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-rapid/config.json' }]);
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
    });
    await service.discover();

    const snapshot = service.snapshot();
    const injectedEntry = { ...snapshot.entries[0], rapidId: 'injected-rapid' };
    try {
      (snapshot.entries as (typeof snapshot.entries)[number][]).push(injectedEntry);
    } catch {
      // Frozen arrays throw in strict mode.
    }
    (snapshot.byId as Map<string, (typeof snapshot.entries)[number]>).set('injected-rapid', injectedEntry);

    const nextSnapshot = service.snapshot();
    expect(nextSnapshot.entries.map((entry) => entry.rapidId)).toEqual(['demo-rapid']);
    expect(nextSnapshot.byId.has('injected-rapid')).toBeFalse();
  });

  it('does not let snapshot emissions mutate registry state', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-rapid/config.json' }]);
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
    });
    let emittedSnapshot = service.snapshot();
    const subscription = service.snapshot$.subscribe((snapshot) => {
      emittedSnapshot = snapshot;
    });

    await service.discover();
    const injectedEntry = { ...emittedSnapshot.entries[0], rapidId: 'injected-rapid' };
    try {
      (emittedSnapshot.entries as (typeof emittedSnapshot.entries)[number][]).push(injectedEntry);
    } catch {
      // Frozen arrays throw in strict mode.
    }
    (emittedSnapshot.byId as Map<string, (typeof emittedSnapshot.entries)[number]>).set(
      'injected-rapid',
      injectedEntry,
    );
    subscription.unsubscribe();

    expect(service.snapshot().entries.map((entry) => entry.rapidId)).toEqual(['demo-rapid']);
    expect(service.snapshot().byId.has('injected-rapid')).toBeFalse();
  });

  it('keeps the first valid rapid when duplicate rapid ids are discovered', async () => {
    documentsApi.listDocuments.and.resolveTo([{ key: 'demo-rapid/config.json' }, { key: 'demo-rapid/config.json' }]);
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
    });

    const snapshot = await service.discover();

    expect(snapshot.entries.length).toBe(1);
    expect(snapshot.entries[0].rapidId).toBe('demo-rapid');
  });

  it('rejects invalid on-demand rapid ids before constructing document keys', async () => {
    for (const invalidId of ['../x', 'demo%2fx', 'bad:id', 'bad id', 'Demo', 'übung']) {
      expect(await service.lookupOnDemand(invalidId)).toBeUndefined();
    }

    expect(documentsApi.getDocument).not.toHaveBeenCalled();
  });

  it('skips listed invalid config keys before loading config documents', async () => {
    documentsApi.listDocuments.and.resolveTo([
      { key: 'nested/demo-rapid/config.json' },
      { key: 'Demo/config.json' },
      { key: '%2e%2e/config.json' },
      { key: 'bad:id/config.json' },
      { key: 'demo-rapid/config.json' },
    ]);
    mockDocumentLoads({
      'demo-rapid/config.json': validConfig(),
    });

    await service.discover();

    expect(documentsApi.getDocument.calls.allArgs().map(([request]) => request['key'])).toEqual([
      'demo-rapid/config.json',
      'demo-rapid/navigation.json',
    ]);
  });
});
