import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AppComponent } from '../app.component';
import { NavigationEntry } from '../interfaces/navigation-entry';
import { NavigationStore } from '../navigation/navigation-store.service';
import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { KeyboardShortcutsService } from '../shared/services/keyboard-shortcuts.service';
import { AppStore } from '../store/app.store';
import { StaticAssetUrlService } from './static-asset-url.service';
import { StaticScriptRunnerService } from './static-script-runner.service';
import { STATIC_TRUSTED_EXECUTION_ENABLED } from './static-trust-boundary.service';
import { StaticwebComponent } from './staticweb.component';

type DocumentListItem = { key?: string };
type DocumentBody = string | Record<string, unknown> | Error;
type DocumentsApiSpy = jasmine.SpyObj<{
  listDocuments: (request: Record<string, unknown>) => Promise<DocumentListItem[]>;
  getDocument: (request: Record<string, unknown>) => Promise<Blob>;
}>;

describe('StaticwebComponent integration', () => {
  let fixture: ComponentFixture<StaticwebComponent>;
  let documentsApi: DocumentsApiSpy;

  afterEach(() => {
    delete (window as any).__staticIntegrationAllowed;
    delete (window as any).ladonStatic;
    delete (window as any).ladonStaticReady;
    document.head.querySelectorAll('script[data-ladon-static-script="true"]').forEach((script) => script.remove());
    TestBed.resetTestingModule();
  });

  it('renders /static/demo through registry and document html', fakeAsync(() => {
    createStaticwebComponent({
      staticId: 'demo',
      trustedExecutionEnabled: false,
      documents: {
        'demo/config.json': config('demo', { html: 'demo.html' }),
        'demo/demo.html': '<main><h1 id="demo-title">Draco Demo</h1><p>Loaded from document html</p></main>',
      },
    });

    renderAndFlush();

    expect(documentsApi.listDocuments).toHaveBeenCalledOnceWith({
      bucket: 'draco-statics',
      limit: 1000,
      page: 0,
      currentFolder: false,
    });
    expect(documentKeys()).toContain('demo/config.json');
    expect(documentKeys()).toContain('demo/demo.html');
    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#demo-title')?.textContent).toContain('Draco Demo');
  }));

  it('runs trusted inline script from draco static html when the trust gate is enabled', fakeAsync(() => {
    createStaticwebComponent({
      staticId: 'trusted-inline',
      trustedExecutionEnabled: true,
      documents: {
        'trusted-inline/config.json': config('trusted-inline', { mode: 'trusted', allowScripts: true }),
        'trusted-inline/index.html':
          '<p id="trusted-inline-content">Trusted</p><script>window.__staticIntegrationAllowed = true</script>',
      },
    });

    renderAndFlush();

    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#trusted-inline-content')).toBeTruthy();
    expect((window as any).__staticIntegrationAllowed).toBeTrue();
  }));

  it('does not run trusted script config when the trust gate is disabled', fakeAsync(() => {
    const scriptRunner = createScriptRunner();
    createStaticwebComponent({
      staticId: 'trusted-disabled',
      trustedExecutionEnabled: false,
      scriptRunner,
      documents: {
        'trusted-disabled/config.json': config('trusted-disabled', { mode: 'trusted', allowScripts: true }),
        'trusted-disabled/index.html':
          '<p id="trusted-disabled-content">Display only</p><script>window.__staticIntegrationAllowed = true</script>',
      },
    });

    renderAndFlush();

    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#trusted-disabled-content')).toBeTruthy();
    expect((window as any).__staticIntegrationAllowed).toBeUndefined();
    expect(scriptRunner.run).not.toHaveBeenCalled();
  }));

  it('blocks unknown /static/missing without document html load', fakeAsync(() => {
    createStaticwebComponent({
      staticId: 'missing',
      trustedExecutionEnabled: false,
      listDocuments: [],
      documents: {},
    });

    renderAndFlush();

    expect(fixture.nativeElement.querySelector('#static-page-error')?.textContent).toContain(
      'Static "missing" was not found',
    );
    expect(documentsApi.getDocument).not.toHaveBeenCalled();
  }));

  it('rewrites same-folder script src and waits for script runner', fakeAsync(() => {
    let resolveScripts!: () => void;
    const scriptsFinished = new Promise<void>((resolve) => {
      resolveScripts = resolve;
    });
    const scriptRunner = createScriptRunner();
    scriptRunner.run.and.returnValue(scriptsFinished);

    createStaticwebComponent({
      staticId: 'scripted',
      trustedExecutionEnabled: true,
      scriptRunner,
      documents: {
        'scripted/config.json': config('scripted', { mode: 'trusted', allowScripts: true }),
        'scripted/index.html': '<section id="scripted-content">Scripted</section><script src="app.js" defer></script>',
      },
    });

    renderAndFlush();

    expect(scriptRunner.run).toHaveBeenCalledOnceWith([
      jasmine.objectContaining({
        kind: 'external',
        src: expectedAssetUrl('scripted/app.js'),
        attributes: { defer: '' },
      }),
    ]);
    expect(fixture.nativeElement.querySelector('#static-page-loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeNull();

    resolveScripts();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#static-page-loading')).toBeNull();
    expect(fixture.nativeElement.querySelector('#scripted-content')).toBeTruthy();
  }));

  it('keeps global navigation when discovery fails', fakeAsync(() => {
    documentsApi = createDocumentsApi();
    documentsApi.listDocuments.and.rejectWith(new Error('list unavailable'));
    const globalEntries = [navigationEntry('global:filemanager', 'Filemanager', 10)];
    const appStore = createAppStore(false, true);

    TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        NavigationStore,
        { provide: FetchApiFactory, useValue: { documentsApi } },
        { provide: STATIC_TRUSTED_EXECUTION_ENABLED, useValue: false },
        { provide: AppStore, useValue: appStore },
        { provide: KeyboardShortcutsService, useValue: jasmine.createSpyObj('KeyboardShortcutsService', ['init']) },
      ],
    });

    const navigationStore = TestBed.inject(NavigationStore);
    navigationStore.setGlobal(globalEntries);
    const appFixture = TestBed.createComponent(AppComponent);
    appFixture.detectChanges();
    appStore.auth.isAuthenticated.set(true);
    appFixture.detectChanges();
    flushAngularEffects();
    flushMicrotasks();
    flushAngularEffects();

    expect(documentsApi.listDocuments).toHaveBeenCalled();
    expect(appFixture.componentInstance.navigationEntries).toEqual(globalEntries);
  }));

  function createStaticwebComponent(options: {
    staticId: string;
    trustedExecutionEnabled: boolean;
    documents: Record<string, DocumentBody>;
    listDocuments?: DocumentListItem[];
    scriptRunner?: jasmine.SpyObj<StaticScriptRunnerService>;
  }): void {
    documentsApi = createDocumentsApi();
    documentsApi.listDocuments.and.resolveTo(
      options.listDocuments ??
        Object.keys(options.documents)
          .filter((key) => key.endsWith('/config.json'))
          .map((key) => ({ key })),
    );
    documentsApi.getDocument.and.callFake(({ key }) => loadDocument(options.documents, String(key)));

    TestBed.configureTestingModule({
      imports: [StaticwebComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            paramMap: of(convertToParamMap({ staticId: options.staticId })),
          },
        },
        { provide: FetchApiFactory, useValue: { documentsApi } },
        { provide: STATIC_TRUSTED_EXECUTION_ENABLED, useValue: options.trustedExecutionEnabled },
        ...(options.scriptRunner ? [{ provide: StaticScriptRunnerService, useValue: options.scriptRunner }] : []),
      ],
    });

    fixture = TestBed.createComponent(StaticwebComponent);
  }

  function renderAndFlush(): void {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  }

  function createDocumentsApi(): DocumentsApiSpy {
    return jasmine.createSpyObj('documentsApi', ['listDocuments', 'getDocument']);
  }

  function loadDocument(documents: Record<string, DocumentBody>, key: string): Promise<Blob> {
    if (key.endsWith('/navigation.json') && documents[key] === undefined) {
      return Promise.reject({ response: { status: 404 } });
    }

    const body = documents[key];
    if (body instanceof Error) {
      return Promise.reject(body);
    }

    if (body === undefined) {
      return Promise.reject(new Error(`Missing document ${key}`));
    }

    return Promise.resolve(blob(body));
  }

  function blob(body: string | Record<string, unknown>): Blob {
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    return { text: () => Promise.resolve(text) } as Blob;
  }

  function config(staticId: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      staticId,
      html: 'index.html',
      mode: 'display-only',
      allowScripts: false,
      ...overrides,
    };
  }

  function createScriptRunner(): jasmine.SpyObj<StaticScriptRunnerService> {
    const scriptRunner = jasmine.createSpyObj<StaticScriptRunnerService>('StaticScriptRunnerService', [
      'run',
      'cleanup',
    ]);
    scriptRunner.run.and.resolveTo();
    return scriptRunner;
  }

  function expectedAssetUrl(key: string): string {
    return new URL(`${StaticAssetUrlService.documentEndpoint}?key=${encodeURIComponent(key)}`, window.location.origin)
      .href;
  }

  function documentKeys(): string[] {
    return documentsApi.getDocument.calls.allArgs().map(([request]) => String(request['key']));
  }

  function navigationEntry(id: string, label: string, index: number): NavigationEntry {
    return {
      id,
      label,
      index,
      path: id,
      target: 'internal',
      type: 'main',
    };
  }

  function createAppStore(isAuthenticated = true, isAuthenticating = false): {
    auth: {
      isAuthenticated: ReturnType<typeof signal<boolean>>;
      isAuthenticating: ReturnType<typeof signal<boolean>>;
      user: ReturnType<typeof signal<{ fullName: string; userId: string }>>;
    };
    ui: {
      isSidenavClosed: ReturnType<typeof signal<boolean>>;
      isBurgerMenuOpen: ReturnType<typeof signal<boolean>>;
    };
    logout: jasmine.Spy;
    toggleDarkMode: jasmine.Spy;
  } {
    return {
      auth: {
        isAuthenticated: signal(isAuthenticated),
        isAuthenticating: signal(isAuthenticating),
        user: signal({ fullName: 'Test User', userId: 'test-user' }),
      },
      ui: {
        isSidenavClosed: signal(false),
        isBurgerMenuOpen: signal(false),
      },
      logout: jasmine.createSpy('logout'),
      toggleDarkMode: jasmine.createSpy('toggleDarkMode'),
    };
  }

  function flushAngularEffects(): void {
    const testBed = TestBed as typeof TestBed & { flushEffects?: () => void };
    testBed.flushEffects?.();
  }
});
