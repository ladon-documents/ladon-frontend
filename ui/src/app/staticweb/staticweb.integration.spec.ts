import { HttpClient } from '@angular/common/http';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { StaticwebComponent } from './staticweb.component';

describe('StaticwebComponent integration', () => {
  let fixture: ComponentFixture<StaticwebComponent>;
  let http: jasmine.SpyObj<HttpClient>;

  function createComponent(html: string): void {
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    http.get.and.returnValue(of(html));

    TestBed.configureTestingModule({
      imports: [StaticwebComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ page: './public/html/test.html' }),
            paramMap: of(convertToParamMap({})),
          },
        },
        { provide: HttpClient, useValue: http },
      ],
    });

    fixture = TestBed.createComponent(StaticwebComponent);
  }

  afterEach(() => {
    delete (window as any).__staticIntegrationAllowed;
    document.head.querySelectorAll('script[data-ladon-static-script="true"]').forEach((script) => script.remove());
    TestBed.resetTestingModule();
  });

  it('executes an allowed trusted inline script through the component', fakeAsync(() => {
    createComponent('<p id="ok">OK</p><script>window.__staticIntegrationAllowed = true</script>');

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#static-page-content')).toBeTruthy();
    expect((window as any).__staticIntegrationAllowed).toBeTrue();
  }));

  it('blocks the whole trusted static when it contains an external cdn script', fakeAsync(() => {
    createComponent('<p id="should-not-render">Blocked</p><script src="https://cdn.example/x.js"></script>');

    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#static-page-error')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#should-not-render')).toBeNull();
    expect(document.head.querySelector('script[src="https://cdn.example/x.js"]')).toBeNull();
  }));
});
