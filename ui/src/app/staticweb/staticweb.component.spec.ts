import { HttpClient } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Params } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { DracoStaticRegistryService } from './draco-static-registry.service';
import { DracoStaticEntry, DracoStaticRegistrySnapshot } from './draco-static.types';
import { StaticAssetRewriterService } from './static-asset-rewriter.service';
import { StaticDefinitionResolver } from './static-definition.resolver';
import { StaticHtmlPolicyService } from './static-html-policy.service';
import { StaticRuntimeFacadeService } from './static-runtime-facade.service';
import { StaticScriptRunnerService } from './static-script-runner.service';
import { StaticRenderPlan } from './staticweb.types';
import { StaticwebComponent } from './staticweb.component';

describe('StaticwebComponent', () => {
  let fixture: ComponentFixture<StaticwebComponent>;
  let component: StaticwebComponent;
  let queryParams: BehaviorSubject<Params>;
  let paramMap: BehaviorSubject<ParamMap>;
  let http: jasmine.SpyObj<HttpClient>;
  let documentsApi: jasmine.SpyObj<{ getDocument: (request: Record<string, unknown>) => Promise<Blob> }>;
  let registry: jasmine.SpyObj<DracoStaticRegistryService>;
  let definitionResolver: jasmine.SpyObj<StaticDefinitionResolver>;
  let assetRewriter: jasmine.SpyObj<StaticAssetRewriterService>;
  let htmlPolicy: jasmine.SpyObj<StaticHtmlPolicyService>;
  let runtimeFacade: jasmine.SpyObj<StaticRuntimeFacadeService>;
  let scriptRunner: jasmine.SpyObj<StaticScriptRunnerService>;

  const displayEntry = createEntry('display-static', 'display-static/index.html', 'display-only', false);
  const trustedEntry = createEntry('trusted-static', 'trusted-static/index.html', 'trusted', true);
  const secondEntry = createEntry('second-static', 'second-static/index.html', 'display-only', false);

  function createEntry(
    staticId: string,
    htmlKey: string,
    mode: DracoStaticEntry['mode'],
    allowScripts: boolean,
  ): DracoStaticEntry {
    return {
      staticId,
      bucket: 'draco-statics',
      basePath: `${staticId}/`,
      html: 'index.html',
      htmlKey,
      mode,
      allowScripts,
      allowedScriptSources: 'same-origin',
      definition: {
        id: staticId,
        source: htmlKey,
        mode,
        allowScripts,
        allowedScriptSources: 'same-origin',
      },
    };
  }

  function createSnapshot(
    state: DracoStaticRegistrySnapshot['state'],
    entries: DracoStaticEntry[] = [],
  ): DracoStaticRegistrySnapshot {
    return {
      state,
      entries,
      byId: new Map(entries.map((entry) => [entry.staticId, entry])),
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

  function setRegistrySnapshot(snapshot: DracoStaticRegistrySnapshot): void {
    registry.snapshot.and.returnValue(snapshot);
    registry.getById.and.callFake((id: string) => snapshot.byId.get(id));
  }

  function setResolverFromRegistry(): void {
    definitionResolver.resolve.and.callFake(({ staticId }) => {
      const entry = staticId ? registry.getById(staticId) : undefined;
      return entry
        ? { kind: 'allow', definition: entry.definition }
        : { kind: 'missing', error: `Static "${staticId ?? ''}" was not found in the registry` };
    });
  }

  function createComponent(staticId: string | null = displayEntry.staticId, page?: string): void {
    queryParams = new BehaviorSubject<Params>(page ? { page } : {});
    paramMap = new BehaviorSubject<ParamMap>(convertToParamMap(staticId ? { staticId } : {}));
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    http.get.and.returnValue(of('<p>legacy</p>'));
    documentsApi = jasmine.createSpyObj('documentsApi', ['getDocument']);
    documentsApi.getDocument.and.resolveTo(createBlob('<p>From document</p>'));
    registry = jasmine.createSpyObj<DracoStaticRegistryService>('DracoStaticRegistryService', [
      'snapshot',
      'waitUntilSettled',
      'lookupOnDemand',
      'getById',
    ]);
    setRegistrySnapshot(createSnapshot('ready', [displayEntry, trustedEntry]));
    registry.waitUntilSettled.and.resolveTo(createSnapshot('ready', [displayEntry, trustedEntry]));
    registry.lookupOnDemand.and.resolveTo(undefined);
    definitionResolver = jasmine.createSpyObj<StaticDefinitionResolver>('StaticDefinitionResolver', ['resolve']);
    setResolverFromRegistry();
    assetRewriter = jasmine.createSpyObj<StaticAssetRewriterService>('StaticAssetRewriterService', ['rewrite']);
    assetRewriter.rewrite.and.callFake((html: string) => html);
    htmlPolicy = jasmine.createSpyObj<StaticHtmlPolicyService>('StaticHtmlPolicyService', ['createRenderPlan']);
    htmlPolicy.createRenderPlan.and.callFake(
      (html, definition): StaticRenderPlan => ({
        mode: definition.mode,
        html,
        scripts:
          definition.mode === 'trusted'
            ? [{ kind: 'inline-classic', content: 'window.__trustedStatic=1', attributes: {} }]
            : [],
      }),
    );
    runtimeFacade = jasmine.createSpyObj<StaticRuntimeFacadeService>('StaticRuntimeFacadeService', ['install', 'clear']);
    scriptRunner = jasmine.createSpyObj<StaticScriptRunnerService>('StaticScriptRunnerService', ['run', 'cleanup']);
    scriptRunner.run.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [StaticwebComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: queryParams.asObservable(), paramMap: paramMap.asObservable() } },
        { provide: HttpClient, useValue: http },
        { provide: FetchApiFactory, useValue: { documentsApi } },
        { provide: DracoStaticRegistryService, useValue: registry },
        { provide: StaticDefinitionResolver, useValue: definitionResolver },
        { provide: StaticAssetRewriterService, useValue: assetRewriter },
        { provide: StaticHtmlPolicyService, useValue: htmlPolicy },
        { provide: StaticRuntimeFacadeService, useValue: runtimeFacade },
        { provide: StaticScriptRunnerService, useValue: scriptRunner },
      ],
    });

    fixture = TestBed.createComponent(StaticwebComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('waits for registry loading before resolving a static id', fakeAsync(() => {
    createComponent(displayEntry.staticId);
    let resolveRegistry!: (snapshot: DracoStaticRegistrySnapshot) => void;
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

    expect(definitionResolver.resolve).toHaveBeenCalledOnceWith({ staticId: displayEntry.staticId });
    expect(documentsApi.getDocument).toHaveBeenCalledOnceWith({
      bucket: 'draco-statics',
      key: displayEntry.htmlKey,
    });
    expect(fixture.nativeElement.querySelector('#static-page-content')?.textContent).toContain('From document');
  }));

  it('loads html from documents api for a known static id', fakeAsync(() => {
    createComponent(displayEntry.staticId);
    documentsApi.getDocument.and.resolveTo(createBlob('<h1>Draco document</h1>'));

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(http.get).not.toHaveBeenCalled();
    expect(documentsApi.getDocument).toHaveBeenCalledOnceWith({
      bucket: 'draco-statics',
      key: displayEntry.htmlKey,
    });
    expect(htmlPolicy.createRenderPlan).toHaveBeenCalledWith('<h1>Draco document</h1>', displayEntry.definition);
    expect(fixture.nativeElement.querySelector('#static-page-content')?.textContent).toContain('Draco document');
  }));

  it('does not render or run scripts when destroyed during an in-flight document load', fakeAsync(() => {
    createComponent(displayEntry.staticId);
    const documentLoad = deferred<Blob>();
    documentsApi.getDocument.and.returnValue(documentLoad.promise);

    fixture.detectChanges();
    flushMicrotasks();
    component.ngOnDestroy();
    documentLoad.resolve(createBlob('<script>window.__lateStatic = true</script><p>Late</p>'));
    flushMicrotasks();
    fixture.detectChanges();

    expect(assetRewriter.rewrite).not.toHaveBeenCalled();
    expect(htmlPolicy.createRenderPlan).not.toHaveBeenCalled();
    expect(runtimeFacade.install).not.toHaveBeenCalled();
    expect(scriptRunner.run).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeNull();
    expect((window as any).__lateStatic).toBeUndefined();
  }));

  it('dispatches not found events from fetch client response status with the html key context', fakeAsync(() => {
    createComponent(displayEntry.staticId);
    const eventDetails: string[] = [];
    const handler = (event: Event) => eventDetails.push((event as CustomEvent<string>).detail);
    window.addEventListener('ladon:error:page:404', handler);
    documentsApi.getDocument.and.rejectWith({ response: { status: 404 }, message: 'Missing document' });

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
    window.removeEventListener('ladon:error:page:404', handler);

    expect(eventDetails).toEqual([displayEntry.htmlKey]);
    expect(fixture.nativeElement.querySelector('#static-page-error')?.textContent).toContain('Static page could not be loaded');
  }));

  it('rewrites assets before creating the render plan', fakeAsync(() => {
    createComponent(displayEntry.staticId);
    documentsApi.getDocument.and.resolveTo(createBlob('<img src="logo.png">'));
    assetRewriter.rewrite.and.returnValue('<img src="/admin/documents/draco-statics/display-static/logo.png">');

    fixture.detectChanges();
    flushMicrotasks();

    expect(assetRewriter.rewrite).toHaveBeenCalledOnceWith('<img src="logo.png">', displayEntry.basePath);
    expect(htmlPolicy.createRenderPlan).toHaveBeenCalledOnceWith(
      '<img src="/admin/documents/draco-statics/display-static/logo.png">',
      displayEntry.definition,
    );
  }));

  it('shows error for an unknown static id without getDocument html load', fakeAsync(() => {
    createComponent('missing-static');
    setRegistrySnapshot(createSnapshot('ready', [displayEntry]));
    registry.waitUntilSettled.and.resolveTo(createSnapshot('ready', [displayEntry]));

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(documentsApi.getDocument).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#static-page-error')?.textContent).toContain('missing-static');
    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeNull();
  }));

  it('uses on-demand lookup when discovery failed', fakeAsync(() => {
    createComponent(displayEntry.staticId);
    setRegistrySnapshot(createSnapshot('failed'));
    registry.waitUntilSettled.and.resolveTo(createSnapshot('failed'));
    registry.lookupOnDemand.and.resolveTo(displayEntry);

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(registry.lookupOnDemand).toHaveBeenCalledOnceWith(displayEntry.staticId);
    expect(documentsApi.getDocument).toHaveBeenCalledOnceWith({
      bucket: 'draco-statics',
      key: displayEntry.htmlKey,
    });
    expect(fixture.nativeElement.querySelector('#static-page-content')?.textContent).toContain('From document');
  }));

  it('does not let stale route loads overwrite newer route content', fakeAsync(() => {
    createComponent(displayEntry.staticId);
    setRegistrySnapshot(createSnapshot('ready', [displayEntry, secondEntry]));
    registry.waitUntilSettled.and.resolveTo(createSnapshot('ready', [displayEntry, secondEntry]));
    const firstLoad = deferred<Blob>();
    documentsApi.getDocument.and.callFake(({ key }) =>
      key === displayEntry.htmlKey ? firstLoad.promise : Promise.resolve(createBlob('<p>Second route</p>')),
    );

    fixture.detectChanges();
    flushMicrotasks();
    paramMap.next(convertToParamMap({ staticId: secondEntry.staticId }));
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#static-page-content')?.textContent).toContain('Second route');

    firstLoad.resolve(createBlob('<p>First route</p>'));
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#static-page-content')?.textContent).toContain('Second route');
    expect(fixture.nativeElement.querySelector('#static-page-content')?.textContent).not.toContain('First route');
  }));

  it('clears runtime and content when trusted script execution fails', fakeAsync(() => {
    createComponent(trustedEntry.staticId);
    documentsApi.getDocument.and.resolveTo(createBlob('<p>Trusted</p><script>bad()</script>'));
    scriptRunner.run.and.rejectWith(new Error('script failed'));

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(runtimeFacade.install).toHaveBeenCalled();
    expect(scriptRunner.run).toHaveBeenCalled();
    expect(runtimeFacade.clear).toHaveBeenCalled();
    expect(scriptRunner.cleanup).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeNull();
    expect(fixture.nativeElement.querySelector('#static-page-error')?.textContent).toContain('script failed');
  }));

  it('does not accept page query rendering', fakeAsync(() => {
    createComponent(null, './public/html/test.html');

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(definitionResolver.resolve).not.toHaveBeenCalled();
    expect(registry.waitUntilSettled).not.toHaveBeenCalled();
    expect(http.get).not.toHaveBeenCalled();
    expect(documentsApi.getDocument).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#static-page-error')?.textContent).toContain('staticId');
  }));

  it('does not construct document keys for invalid route ids', fakeAsync(() => {
    const invalidStaticIds = ['../x', 'a%2Fb', 'a:b', 'white space', 'Uppercase', 'unicodé'];

    for (const invalidStaticId of invalidStaticIds) {
      TestBed.resetTestingModule();
      createComponent(invalidStaticId);

      fixture.detectChanges();
      flushMicrotasks();
      fixture.detectChanges();

      expect(registry.waitUntilSettled).withContext(invalidStaticId).not.toHaveBeenCalled();
      expect(registry.lookupOnDemand).withContext(invalidStaticId).not.toHaveBeenCalled();
      expect(definitionResolver.resolve).withContext(invalidStaticId).not.toHaveBeenCalled();
      expect(documentsApi.getDocument).withContext(invalidStaticId).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('#static-page-error')?.textContent)
        .withContext(invalidStaticId)
        .toContain('Invalid staticId');
    }
  }));

  it('cleans up scripts and runtime on destroy', () => {
    createComponent(displayEntry.staticId);
    fixture.detectChanges();

    component.ngOnDestroy();

    expect(scriptRunner.cleanup).toHaveBeenCalled();
    expect(runtimeFacade.clear).toHaveBeenCalled();
  });
});
