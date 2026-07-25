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
import { RapidAssetUrlService } from './rapid-asset-url.service';
import { RapidScriptRunnerService } from './rapid-script-runner.service';
import { RAPID_TRUSTED_EXECUTION_ENABLED } from './rapid-trust-boundary.service';
import { RapidwebComponent } from './rapidweb.component';

type DocumentListItem = { key?: string };
type DocumentBody = string | Record<string, unknown> | Error;
type DocumentsApiSpy = jasmine.SpyObj<{
  listDocuments: (request: Record<string, unknown>) => Promise<DocumentListItem[]>;
  getDocument: (request: Record<string, unknown>) => Promise<Blob>;
}>;

describe('RapidwebComponent integration', () => {
  let fixture: ComponentFixture<RapidwebComponent>;
  let documentsApi: DocumentsApiSpy;

  afterEach(() => {
    delete (window as any).__rapidIntegrationAllowed;
    delete (window as any).ladonRapid;
    delete (window as any).ladonRapidReady;
    document.head.querySelectorAll('script[data-ladon-rapid-script="true"]').forEach((script) => script.remove());
    TestBed.resetTestingModule();
  });

  it('renders /rapid/demo through registry and document html', fakeAsync(() => {
    createRapidwebComponent({
      rapidId: 'demo',
      trustedExecutionEnabled: false,
      documents: {
        'demo/config.json': config('demo', { html: 'demo.html' }),
        'demo/demo.html': '<main><h1 id="demo-title">Draco Demo</h1><p>Loaded from document html</p></main>',
      },
    });

    renderAndFlush();

    expect(documentsApi.listDocuments).toHaveBeenCalledOnceWith({
      bucket: 'draco-rapids',
      limit: 1000,
      page: 0,
      currentFolder: false,
    });
    expect(documentKeys()).toContain('demo/config.json');
    expect(documentKeys()).toContain('demo/demo.html');
    expect(fixture.nativeElement.querySelector('#rapid-page-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#demo-title')?.textContent).toContain('Draco Demo');
  }));

  it('runs trusted inline script from draco rapid html when the trust gate is enabled', fakeAsync(() => {
    createRapidwebComponent({
      rapidId: 'trusted-inline',
      trustedExecutionEnabled: true,
      documents: {
        'trusted-inline/config.json': config('trusted-inline', { mode: 'trusted', allowScripts: true }),
        'trusted-inline/index.html':
          '<p id="trusted-inline-content">Trusted</p><script>window.__rapidIntegrationAllowed = true</script>',
      },
    });

    renderAndFlush();

    expect(fixture.nativeElement.querySelector('#rapid-page-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#trusted-inline-content')).toBeTruthy();
    expect((window as any).__rapidIntegrationAllowed).toBeTrue();
  }));

  it('does not run trusted script config when the trust gate is disabled', fakeAsync(() => {
    const scriptRunner = createScriptRunner();
    createRapidwebComponent({
      rapidId: 'trusted-disabled',
      trustedExecutionEnabled: false,
      scriptRunner,
      documents: {
        'trusted-disabled/config.json': config('trusted-disabled', { mode: 'trusted', allowScripts: true }),
        'trusted-disabled/index.html':
          '<p id="trusted-disabled-content">Display only</p><script>window.__rapidIntegrationAllowed = true</script>',
      },
    });

    renderAndFlush();

    expect(fixture.nativeElement.querySelector('#rapid-page-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#trusted-disabled-content')).toBeTruthy();
    expect((window as any).__rapidIntegrationAllowed).toBeUndefined();
    expect(scriptRunner.run).not.toHaveBeenCalled();
  }));

  it('blocks unknown /rapid/missing without document html load', fakeAsync(() => {
    createRapidwebComponent({
      rapidId: 'missing',
      trustedExecutionEnabled: false,
      listDocuments: [],
      documents: {},
    });

    renderAndFlush();

    expect(fixture.nativeElement.querySelector('#rapid-page-error')?.textContent).toContain(
      'Rapid "missing" was not found',
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

    createRapidwebComponent({
      rapidId: 'scripted',
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
    expect(fixture.nativeElement.querySelector('#rapid-page-loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#rapid-page-content')).toBeNull();

    resolveScripts();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#rapid-page-loading')).toBeNull();
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
        { provide: RAPID_TRUSTED_EXECUTION_ENABLED, useValue: false },
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

  function createRapidwebComponent(options: {
    rapidId: string;
    trustedExecutionEnabled: boolean;
    documents: Record<string, DocumentBody>;
    listDocuments?: DocumentListItem[];
    scriptRunner?: jasmine.SpyObj<RapidScriptRunnerService>;
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
      imports: [RapidwebComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            paramMap: of(convertToParamMap({ rapidId: options.rapidId })),
          },
        },
        { provide: FetchApiFactory, useValue: { documentsApi } },
        { provide: RAPID_TRUSTED_EXECUTION_ENABLED, useValue: options.trustedExecutionEnabled },
        ...(options.scriptRunner ? [{ provide: RapidScriptRunnerService, useValue: options.scriptRunner }] : []),
      ],
    });

    fixture = TestBed.createComponent(RapidwebComponent);
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

  function config(rapidId: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      rapidId,
      html: 'index.html',
      mode: 'display-only',
      allowScripts: false,
      ...overrides,
    };
  }

  function createScriptRunner(): jasmine.SpyObj<RapidScriptRunnerService> {
    const scriptRunner = jasmine.createSpyObj<RapidScriptRunnerService>('RapidScriptRunnerService', ['run', 'cleanup']);
    scriptRunner.run.and.resolveTo();
    return scriptRunner;
  }

  function expectedAssetUrl(key: string): string {
    return new URL(`${RapidAssetUrlService.documentEndpoint}?key=${encodeURIComponent(key)}`, window.location.origin)
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

  function createAppStore(
    isAuthenticated = true,
    isAuthenticating = false,
  ): {
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
