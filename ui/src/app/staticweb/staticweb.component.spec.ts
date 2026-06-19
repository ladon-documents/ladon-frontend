import { HttpClient } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Params } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { StaticRuntimeFacadeService } from './static-runtime-facade.service';
import { StaticScriptRunnerService } from './static-script-runner.service';
import { StaticwebComponent } from './staticweb.component';

describe('StaticwebComponent', () => {
  let fixture: ComponentFixture<StaticwebComponent>;
  let component: StaticwebComponent;
  let queryParams: BehaviorSubject<Params>;
  let paramMap: BehaviorSubject<ParamMap>;
  let http: jasmine.SpyObj<HttpClient>;
  let runtimeFacade: jasmine.SpyObj<StaticRuntimeFacadeService>;
  let scriptRunner: jasmine.SpyObj<StaticScriptRunnerService>;

  function createComponent(page: string | null): void {
    queryParams = new BehaviorSubject<Params>(page ? { page } : {});
    paramMap = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    runtimeFacade = jasmine.createSpyObj<StaticRuntimeFacadeService>('StaticRuntimeFacadeService', ['install', 'clear']);
    scriptRunner = jasmine.createSpyObj<StaticScriptRunnerService>('StaticScriptRunnerService', ['run', 'cleanup']);
    scriptRunner.run.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [StaticwebComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: queryParams.asObservable(), paramMap: paramMap.asObservable() } },
        { provide: HttpClient, useValue: http },
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

  it('renders display-only html for legacy sources without trusted fallback', fakeAsync(() => {
    createComponent('/public/html/unknown.html');
    http.get.and.returnValue(of('<p onclick="x()">Hello</p><script>bad()</script>'));

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('#static-page-content') as HTMLElement;
    expect(content.textContent).toContain('Hello');
    expect(content.innerHTML).not.toContain('onclick');
    expect(content.innerHTML).not.toContain('script');
    expect(scriptRunner.run).not.toHaveBeenCalled();
    expect(runtimeFacade.install).not.toHaveBeenCalled();
  }));

  it('installs trusted runtime and runs scripts for trusted local fallback', fakeAsync(() => {
    createComponent('./public/html/test.html');
    http.get.and.returnValue(of('<p>Hello</p><script>window.__trustedStatic=1</script>'));

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(runtimeFacade.install).toHaveBeenCalled();
    expect(scriptRunner.run).toHaveBeenCalledWith([
      jasmine.objectContaining({ kind: 'inline-classic', content: 'window.__trustedStatic=1' }),
    ]);
  }));

  it('shows policy error when resolver blocks source', fakeAsync(() => {
    createComponent('https://example.test/x.html');

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(http.get).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#static-page-error')?.textContent).toContain('not allowed');
  }));

  it('cleans up scripts and runtime on destroy', () => {
    createComponent(null);
    fixture.detectChanges();

    component.ngOnDestroy();

    expect(scriptRunner.cleanup).toHaveBeenCalled();
    expect(runtimeFacade.clear).toHaveBeenCalled();
  });
});
