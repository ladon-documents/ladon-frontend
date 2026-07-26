import { HttpClient } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { DracoRapidRegistryService } from './draco-rapid-registry.service';
import { DracoRapidEntry, DracoRapidRegistrySnapshot } from './draco-rapid.types';
import { RapidAssetRewriterService } from './rapid-asset-rewriter.service';
import { RapidDefinitionResolver } from './rapid-definition.resolver';
import { RapidHtmlPolicyService } from './rapid-html-policy.service';
import { RapidRuntimeFacadeService } from './rapid-runtime-facade.service';
import { RapidScriptRunnerService } from './rapid-script-runner.service';
import { RAPID_SOURCE_CONFIG } from './rapid-source-config';
import { RapidRenderPlan } from './rapidweb.types';
import { RapidwebComponent } from './rapidweb.component';

describe('RapidwebComponent', () => {
  let fixture: ComponentFixture<RapidwebComponent>;
  let component: RapidwebComponent;
  let queryParams: BehaviorSubject<Record<string, never>>;
  let paramMap: BehaviorSubject<ParamMap>;
  let http: jasmine.SpyObj<HttpClient>;
  let documentsApi: jasmine.SpyObj<{ getDocument: (request: Record<string, unknown>) => Promise<Blob> }>;
  let registry: jasmine.SpyObj<DracoRapidRegistryService>;
  let definitionResolver: jasmine.SpyObj<RapidDefinitionResolver>;
  let assetRewriter: jasmine.SpyObj<RapidAssetRewriterService>;
  let htmlPolicy: jasmine.SpyObj<RapidHtmlPolicyService>;
  let runtimeFacade: jasmine.SpyObj<RapidRuntimeFacadeService>;
  let scriptRunner: jasmine.SpyObj<RapidScriptRunnerService>;

  const displayEntry = createEntry('display-rapid', 'display-rapid/index.html', 'display-only', false);
  const trustedEntry = createEntry('trusted-rapid', 'trusted-rapid/index.html', 'trusted', true);
  const secondEntry = createEntry('second-rapid', 'second-rapid/index.html', 'display-only', false);

  function createEntry(
    rapidId: string,
    htmlKey: string,
    mode: DracoRapidEntry['mode'],
    allowScripts: boolean,
  ): DracoRapidEntry {
    return {
      rapidId,
      bucket: 'draco-rapids',
      basePath: `${rapidId}/`,
      html: 'index.html',
      htmlKey,
      mode,
      allowScripts,
      allowedScriptSources: 'same-origin',
      definition: {
        id: rapidId,
        source: htmlKey,
        mode,
        allowScripts,
        allowedScriptSources: 'same-origin',
      },
    };
  }

  function createSnapshot(
    state: DracoRapidRegistrySnapshot['state'],
    entries: DracoRapidEntry[] = [],
  ): DracoRapidRegistrySnapshot {
    return {
      state,
      entries,
      byId: new Map(entries.map((entry) => [entry.rapidId, entry])),
    };
  }

  function createBlob(html: string): Blob {
    return { text: () => Promise.resolve(html) } as Blob;
  }

  function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
      resolve = promiseResolve;
      reject = promiseReject;
    });

    return { promise, resolve, reject };
  }

  function setRegistrySnapshot(snapshot: DracoRapidRegistrySnapshot): void {
    registry.snapshot.and.returnValue(snapshot);
    registry.getById.and.callFake((id: string) => snapshot.byId.get(id));
  }

  function setResolverFromRegistry(): void {
    definitionResolver.resolve.and.callFake(({ rapidId }) => {
      const entry = rapidId ? registry.getById(rapidId) : undefined;
      return entry
        ? { kind: 'allow', definition: entry.definition }
        : { kind: 'missing', error: `Rapid "${rapidId ?? ''}" was not found in the registry` };
    });
  }

  function createComponent(rapidId: string | null = displayEntry.rapidId, sourceConfig?: unknown): void {
    queryParams = new BehaviorSubject<Record<string, never>>({});
    paramMap = new BehaviorSubject<ParamMap>(convertToParamMap(rapidId ? { rapidId } : {}));
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    http.get.and.returnValue(of('<p>legacy</p>'));
    documentsApi = jasmine.createSpyObj('documentsApi', ['getDocument']);
    documentsApi.getDocument.and.resolveTo(createBlob('<p>From document</p>'));
    registry = jasmine.createSpyObj<DracoRapidRegistryService>('DracoRapidRegistryService', [
      'snapshot',
      'waitUntilSettled',
      'lookupOnDemand',
      'getById',
    ]);
    setRegistrySnapshot(createSnapshot('ready', [displayEntry, trustedEntry]));
    registry.waitUntilSettled.and.resolveTo(createSnapshot('ready', [displayEntry, trustedEntry]));
    registry.lookupOnDemand.and.resolveTo(undefined);
    definitionResolver = jasmine.createSpyObj<RapidDefinitionResolver>('RapidDefinitionResolver', ['resolve']);
    setResolverFromRegistry();
    assetRewriter = jasmine.createSpyObj<RapidAssetRewriterService>('RapidAssetRewriterService', ['rewrite']);
    assetRewriter.rewrite.and.callFake((html: string) => html);
    htmlPolicy = jasmine.createSpyObj<RapidHtmlPolicyService>('RapidHtmlPolicyService', ['createRenderPlan']);
    htmlPolicy.createRenderPlan.and.callFake(
      (html, definition): RapidRenderPlan => ({
        mode: definition.mode,
        html,
        scripts:
          definition.mode === 'trusted'
            ? [{ kind: 'inline-classic', content: 'window.__trustedRapid=1', attributes: {} }]
            : [],
      }),
    );
    runtimeFacade = jasmine.createSpyObj<RapidRuntimeFacadeService>('RapidRuntimeFacadeService', ['install', 'clear']);
    scriptRunner = jasmine.createSpyObj<RapidScriptRunnerService>('RapidScriptRunnerService', ['run', 'cleanup']);
    scriptRunner.run.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [RapidwebComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParams: queryParams.asObservable(), paramMap: paramMap.asObservable() },
        },
        { provide: HttpClient, useValue: http },
        { provide: FetchApiFactory, useValue: { documentsApi } },
        { provide: DracoRapidRegistryService, useValue: registry },
        { provide: RapidDefinitionResolver, useValue: definitionResolver },
        { provide: RapidAssetRewriterService, useValue: assetRewriter },
        { provide: RapidHtmlPolicyService, useValue: htmlPolicy },
        { provide: RapidRuntimeFacadeService, useValue: runtimeFacade },
        { provide: RapidScriptRunnerService, useValue: scriptRunner },
        ...(sourceConfig ? [{ provide: RAPID_SOURCE_CONFIG, useValue: sourceConfig }] : []),
      ],
    });

    fixture = TestBed.createComponent(RapidwebComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('waits for registry loading before resolving a rapid id', fakeAsync(() => {
    createComponent(displayEntry.rapidId);
    let resolveRegistry!: (snapshot: DracoRapidRegistrySnapshot) => void;
    setRegistrySnapshot(createSnapshot('loading'));
    registry.waitUntilSettled.and.returnValue(new Promise((resolve) => (resolveRegistry = resolve)));

    fixture.detectChanges();
    flushMicrotasks();

    expect(component.loading).toBeTrue();
    expect(definitionResolver.resolve).not.toHaveBeenCalled();
    expect(documentsApi.getDocument).not.toHaveBeenCalled();

    setRegistrySnapshot(createSnapshot('ready', [displayEntry]));
    resolveRegistry(createSnapshot('ready', [displayEntry]));
    flushMicrotasks();
    fixture.detectChanges();

    expect(definitionResolver.resolve).toHaveBeenCalledOnceWith({ rapidId: displayEntry.rapidId });
    expect(documentsApi.getDocument).toHaveBeenCalledOnceWith({
      bucket: 'draco-rapids',
      key: displayEntry.htmlKey,
    });
    expect(fixture.nativeElement.querySelector('#rapid-page-content')?.textContent).toContain('From document');
  }));

  it('loads html from documents api for a known rapid id', fakeAsync(() => {
    createComponent(displayEntry.rapidId);
    documentsApi.getDocument.and.resolveTo(createBlob('<h1>Draco document</h1>'));

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(http.get).not.toHaveBeenCalled();
    expect(documentsApi.getDocument).toHaveBeenCalledOnceWith({
      bucket: 'draco-rapids',
      key: displayEntry.htmlKey,
    });
    expect(htmlPolicy.createRenderPlan).toHaveBeenCalledWith('<h1>Draco document</h1>', displayEntry.definition);
    expect(fixture.nativeElement.querySelector('#rapid-page-content')?.textContent).toContain('Draco document');
  }));

  it('loads html from local dev rapids when the rapid source is local', async () => {
    createComponent(displayEntry.rapidId, {
      source: 'local',
      local: {
        basePath: '/ui/draco/ladon-core/public/dev-rapids',
        manifestPath: '/ui/draco/ladon-core/public/dev-rapids/rapid-pages.json',
      },
    });
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo({
      ok: true,
      status: 200,
      text: () => Promise.resolve('<h1>Local rapid</h1>'),
    } as Response);

    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    expect(documentsApi.getDocument).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledOnceWith('/ui/draco/ladon-core/public/dev-rapids/display-rapid/index.html');
    expect(htmlPolicy.createRenderPlan).toHaveBeenCalledWith('<h1>Local rapid</h1>', displayEntry.definition);
    expect(fixture.nativeElement.querySelector('#rapid-page-content')?.textContent).toContain('Local rapid');
  });

  it('does not render or run scripts when destroyed during an in-flight document load', fakeAsync(() => {
    createComponent(displayEntry.rapidId);
    const documentLoad = deferred<Blob>();
    documentsApi.getDocument.and.returnValue(documentLoad.promise);

    fixture.detectChanges();
    flushMicrotasks();
    component.ngOnDestroy();
    documentLoad.resolve(createBlob('<script>window.__lateRapid = true</script><p>Late</p>'));
    flushMicrotasks();
    fixture.detectChanges();

    expect(assetRewriter.rewrite).not.toHaveBeenCalled();
    expect(htmlPolicy.createRenderPlan).not.toHaveBeenCalled();
    expect(runtimeFacade.install).not.toHaveBeenCalled();
    expect(scriptRunner.run).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#rapid-page-content')).toBeNull();
    expect((window as any).__lateRapid).toBeUndefined();
  }));

  it('dispatches not found events from fetch client response status with the html key context', fakeAsync(() => {
    createComponent(displayEntry.rapidId);
    const eventDetails: string[] = [];
    const handler = (event: Event) => eventDetails.push((event as CustomEvent<string>).detail);
    window.addEventListener('ladon:error:page:404', handler);
    documentsApi.getDocument.and.rejectWith({ response: { status: 404 }, message: 'Missing document' });

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
    window.removeEventListener('ladon:error:page:404', handler);

    expect(eventDetails).toEqual([displayEntry.htmlKey]);
    expect(fixture.nativeElement.querySelector('#rapid-page-error')?.textContent).toContain(
      'Rapid page could not be loaded',
    );
  }));

  it('rewrites assets before creating the render plan', fakeAsync(() => {
    createComponent(displayEntry.rapidId);
    documentsApi.getDocument.and.resolveTo(createBlob('<img src="logo.png">'));
    assetRewriter.rewrite.and.returnValue('<img src="/admin/documents/draco-rapids/display-rapid/logo.png">');

    fixture.detectChanges();
    flushMicrotasks();

    expect(assetRewriter.rewrite).toHaveBeenCalledOnceWith('<img src="logo.png">', displayEntry.basePath);
    expect(htmlPolicy.createRenderPlan).toHaveBeenCalledOnceWith(
      '<img src="/admin/documents/draco-rapids/display-rapid/logo.png">',
      displayEntry.definition,
    );
  }));

  it('shows error for an unknown rapid id without getDocument html load', fakeAsync(() => {
    createComponent('missing-rapid');
    setRegistrySnapshot(createSnapshot('ready', [displayEntry]));
    registry.waitUntilSettled.and.resolveTo(createSnapshot('ready', [displayEntry]));

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(documentsApi.getDocument).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#rapid-page-error')?.textContent).toContain('missing-rapid');
    expect(fixture.nativeElement.querySelector('#rapid-page-content')).toBeNull();
  }));

  it('uses on-demand lookup when discovery failed', fakeAsync(() => {
    createComponent(displayEntry.rapidId);
    setRegistrySnapshot(createSnapshot('failed'));
    registry.waitUntilSettled.and.resolveTo(createSnapshot('failed'));
    registry.lookupOnDemand.and.resolveTo(displayEntry);

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(registry.lookupOnDemand).toHaveBeenCalledOnceWith(displayEntry.rapidId);
    expect(documentsApi.getDocument).toHaveBeenCalledOnceWith({
      bucket: 'draco-rapids',
      key: displayEntry.htmlKey,
    });
    expect(fixture.nativeElement.querySelector('#rapid-page-content')?.textContent).toContain('From document');
  }));

  it('does not let stale route loads overwrite newer route content', fakeAsync(() => {
    createComponent(displayEntry.rapidId);
    setRegistrySnapshot(createSnapshot('ready', [displayEntry, secondEntry]));
    registry.waitUntilSettled.and.resolveTo(createSnapshot('ready', [displayEntry, secondEntry]));
    const firstLoad = deferred<Blob>();
    documentsApi.getDocument.and.callFake(({ key }) =>
      key === displayEntry.htmlKey ? firstLoad.promise : Promise.resolve(createBlob('<p>Second route</p>')),
    );

    fixture.detectChanges();
    flushMicrotasks();
    paramMap.next(convertToParamMap({ rapidId: secondEntry.rapidId }));
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#rapid-page-content')?.textContent).toContain('Second route');

    firstLoad.resolve(createBlob('<p>First route</p>'));
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#rapid-page-content')?.textContent).toContain('Second route');
    expect(fixture.nativeElement.querySelector('#rapid-page-content')?.textContent).not.toContain('First route');
  }));

  it('clears runtime and content when trusted script execution fails', fakeAsync(() => {
    createComponent(trustedEntry.rapidId);
    documentsApi.getDocument.and.resolveTo(createBlob('<p>Trusted</p><script>bad()</script>'));
    scriptRunner.run.and.rejectWith(new Error('script failed'));

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(runtimeFacade.install).toHaveBeenCalled();
    expect(scriptRunner.run).toHaveBeenCalled();
    expect(runtimeFacade.clear).toHaveBeenCalled();
    expect(scriptRunner.cleanup).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#rapid-page-content')).toBeNull();
    expect(fixture.nativeElement.querySelector('#rapid-page-error')?.textContent).toContain('script failed');
  }));

  it('does not render without a rapid id', fakeAsync(() => {
    createComponent(null);

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(definitionResolver.resolve).not.toHaveBeenCalled();
    expect(registry.waitUntilSettled).not.toHaveBeenCalled();
    expect(http.get).not.toHaveBeenCalled();
    expect(documentsApi.getDocument).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#rapid-page-error')?.textContent).toContain('rapidId');
  }));

  it('does not construct document keys for invalid route ids', fakeAsync(() => {
    const invalidRapidIds = ['../x', 'a%2Fb', 'a:b', 'white space', 'Uppercase', 'unicodé'];

    for (const invalidRapidId of invalidRapidIds) {
      TestBed.resetTestingModule();
      createComponent(invalidRapidId);

      fixture.detectChanges();
      flushMicrotasks();
      fixture.detectChanges();

      expect(registry.waitUntilSettled).withContext(invalidRapidId).not.toHaveBeenCalled();
      expect(registry.lookupOnDemand).withContext(invalidRapidId).not.toHaveBeenCalled();
      expect(definitionResolver.resolve).withContext(invalidRapidId).not.toHaveBeenCalled();
      expect(documentsApi.getDocument).withContext(invalidRapidId).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('#rapid-page-error')?.textContent)
        .withContext(invalidRapidId)
        .toContain('Invalid rapidId');
    }
  }));

  it('cleans up scripts and runtime on destroy', () => {
    createComponent(displayEntry.rapidId);
    fixture.detectChanges();

    component.ngOnDestroy();

    expect(scriptRunner.cleanup).toHaveBeenCalled();
    expect(runtimeFacade.clear).toHaveBeenCalled();
  });
});
