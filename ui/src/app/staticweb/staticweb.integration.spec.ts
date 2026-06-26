import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { DracoStaticRegistryService } from './draco-static-registry.service';
import { DracoStaticEntry, DracoStaticRegistrySnapshot } from './draco-static.types';
import { StaticwebComponent } from './staticweb.component';

describe('StaticwebComponent integration', () => {
  let fixture: ComponentFixture<StaticwebComponent>;
  let documentsApi: jasmine.SpyObj<{ getDocument: (request: Record<string, unknown>) => Promise<Blob> }>;

  function createEntry(staticId: string, mode: DracoStaticEntry['mode'], allowScripts: boolean): DracoStaticEntry {
    const htmlKey = `${staticId}/index.html`;
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

  function createSnapshot(entry: DracoStaticEntry): DracoStaticRegistrySnapshot {
    return {
      state: 'ready',
      entries: [entry],
      byId: new Map([[entry.staticId, entry]]),
    };
  }

  function createBlob(html: string): Blob {
    return { text: () => Promise.resolve(html) } as Blob;
  }

  function createComponent(html: string, entry: DracoStaticEntry): void {
    const snapshot = createSnapshot(entry);
    const registry = jasmine.createSpyObj<DracoStaticRegistryService>('DracoStaticRegistryService', [
      'snapshot',
      'waitUntilSettled',
      'lookupOnDemand',
      'getById',
    ]);
    registry.snapshot.and.returnValue(snapshot);
    registry.waitUntilSettled.and.resolveTo(snapshot);
    registry.lookupOnDemand.and.resolveTo(undefined);
    registry.getById.and.callFake((id: string) => snapshot.byId.get(id));
    documentsApi = jasmine.createSpyObj('documentsApi', ['getDocument']);
    documentsApi.getDocument.and.resolveTo(createBlob(html));

    TestBed.configureTestingModule({
      imports: [StaticwebComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            paramMap: of(convertToParamMap({ staticId: entry.staticId })),
          },
        },
        { provide: FetchApiFactory, useValue: { documentsApi } },
        { provide: DracoStaticRegistryService, useValue: registry },
      ],
    });

    fixture = TestBed.createComponent(StaticwebComponent);
  }

  afterEach(() => {
    delete (window as any).__staticIntegrationAllowed;
    document.head.querySelectorAll('script[data-ladon-static-script="true"]').forEach((script) => script.remove());
    TestBed.resetTestingModule();
  });

  it('renders display-only html without executing scripts', fakeAsync(() => {
    createComponent(
      '<p id="ok">OK</p><script>window.__staticIntegrationAllowed = true</script>',
      createEntry('display-static', 'display-only', false),
    );

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(documentsApi.getDocument).toHaveBeenCalledOnceWith({
      bucket: 'draco-statics',
      key: 'display-static/index.html',
    });
    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#ok')).toBeTruthy();
    expect((window as any).__staticIntegrationAllowed).toBeUndefined();
  }));

  it('executes an allowed trusted inline script through the component', fakeAsync(() => {
    createComponent(
      '<p id="ok">OK</p><script>window.__staticIntegrationAllowed = true</script>',
      createEntry('trusted-static', 'trusted', true),
    );

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeTruthy();
    expect((window as any).__staticIntegrationAllowed).toBeTrue();
  }));

  it('blocks the whole trusted static when it contains an external cdn script', fakeAsync(() => {
    createComponent(
      '<p id="should-not-render">Blocked</p><script src="https://cdn.example/x.js"></script>',
      createEntry('trusted-static', 'trusted', true),
    );

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#static-page-error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#should-not-render')).toBeNull();
    expect(document.head.querySelector('script[src="https://cdn.example/x.js"]')).toBeNull();
  }));
});
