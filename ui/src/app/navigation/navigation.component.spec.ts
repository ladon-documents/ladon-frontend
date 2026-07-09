import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationComponent } from './navigation.component';
import { signal } from '@angular/core';
import { NavigationEntry } from '../interfaces/navigation-entry';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';
import { AppStore } from '../store/app.store';

export class NavigationTestObject {
  returnMockNavigation(): NavigationEntry[] {
    return [
      {
        label: 'BUCKET_MANAGER.NAVITEM',
        id: '@mind/mf-ladon-buckets',
        icon: 'heroFolder',
        target: 'internal',
        type: 'main',
        index: 10,
      },
      {
        label: '',
        id: '@mind/mf-ladon-dashboard',
        target: 'internal',
        type: 'main',
        index: 0,
      },
      {
        label: 'DOCMANAGER.NAVITEM',
        id: '@mind/mf-ladon-docmanager',
        target: 'internal',
        icon: 'heroDocumentText',
        type: 'main',
        index: 20,
      },
      {
        label: 'NAVIGATION.SUBNAV.REST_API',
        target: 'external',
        path: '/admin/swagger-ui.html',
        type: 'menu',
        index: 40,
      },
      {
        label: 'Documentation',
        target: 'external',
        path: 'https://ladon.org/doc',
        type: 'menu',
        index: 40,
      },
      {
        label: 'NAVIGATION.SUBNAV.LOGOUT',
        icon: 'heroArrowRightStartOnRectangle',
        id: 'ladon:logout',
        target: 'action',
        type: 'menu',
        index: 50,
      },
      {
        label: 'PLUGIN.NAVITEM',
        id: '@mind/mf-ladon-plugin',
        target: 'internal',
        type: 'menu',
        index: 30,
      },
      {
        label: 'SHARE.NAVITEM',
        id: '@mind/mf-ladon-share',
        target: 'internal',
        type: 'menu',
        index: 20,
      },
      {
        label: 'STATIC.TASKMANAGER',
        path: '_ui/task-manager/module.html',
        id: '@mind/mf-ladon-static-page',
        icon: 'heroListBullet',
        target: 'static',
        type: 'main',
        index: 40,
      },
      {
        label: 'USER_MANAGER.NAVITEM',
        target: 'internal',
        id: '@mind/mf-ladon-user-manager',
        type: 'menu',
        index: 10,
      },
    ];
  }
}

const navigationTO = new NavigationTestObject();

describe('NavigationComponent', () => {
  let component: NavigationComponent, fixture: ComponentFixture<NavigationComponent>;
  let router: Router;
  let appStoreStub: { ui: { isSidenavClosed: ReturnType<typeof signal<boolean>> }; logout: jasmine.Spy; toggleSidebar: jasmine.Spy };

  beforeEach(async () => {
    appStoreStub = {
      ui: { isSidenavClosed: signal(false) },
      logout: jasmine.createSpy('logout'),
      toggleSidebar: jasmine.createSpy('toggleSidebar'),
    };

    await TestBed.configureTestingModule({
      imports: [NavigationComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: AppStore, useValue: appStoreStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('test input', () => {
    it('main menu', () => {
      fixture.componentRef.setInput('navigation', navigationTO.returnMockNavigation());
      fixture.detectChanges();
      //		expect(component.mainMenu()).toHaveLength(4);
    });

    it('sub menu', () => {
      fixture.componentRef.setInput('navigation', navigationTO.returnMockNavigation());
      fixture.detectChanges();
      //		expect(component.subMenu()).toHaveLength(6);
    });
  });

  describe('test invokeItem', () => {
    it('action', () => {
      const dispatchEvent = spyOn(window, 'dispatchEvent').and.callThrough();
      const item = navigationTO.returnMockNavigation().find(({ target }) => target === 'action')!;

      component.invokeItem({ ...item, id: 'ladon:custom-action' });

      expect(dispatchEvent).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          type: 'ladon:navigation:item',
          detail: { ...item, id: 'ladon:custom-action' },
        }),
      );
    });
  });

  it('navigates static items by static id without page query params', async () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    const item = navigationTO.returnMockNavigation().find(({ target }) => target === 'static')!;

    await component.invokeItem({ ...item, path: 'demo' });

    expect(navigate).toHaveBeenCalledOnceWith([`${environment.baseHref}/static/demo`]);
  });

  it('marks static navigation active by static id', () => {
    const extractPathFromUrl = (component as unknown as { extractPathFromUrl(url: string): string | undefined })
      .extractPathFromUrl;

    expect(extractPathFromUrl(`${environment.baseHref}/static/demo`)).toBe('demo');
    expect(extractPathFromUrl(`${environment.baseHref}/static/demo?foo=bar#section`)).toBe('demo');
  });

  it('keeps existing active link extraction for non-static routes', () => {
    const extractPathFromUrl = (component as unknown as { extractPathFromUrl(url: string): string | undefined })
      .extractPathFromUrl;

    expect(extractPathFromUrl(`${environment.baseHref}/buckets/details`)).toBe('buckets');
  });
});
