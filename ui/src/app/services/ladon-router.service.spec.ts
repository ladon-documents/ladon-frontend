import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { NavigationEntry } from '../interfaces/navigation-entry';
import { NavigationStore } from '../navigation/navigation-store.service';
import { LadonRouterService } from './ladon-router.service';

type RoutableNavigationEntry = NavigationEntry & { component: string };

describe('LadonRouterService', () => {
  let service: LadonRouterService;
  let router: jasmine.SpyObj<Router>;
  let navigationStore: NavigationStore;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl', 'createUrlTree'], {
      url: '/current-url',
    });
    router.navigate.and.resolveTo(true);
    router.navigateByUrl.and.resolveTo(true);
    router.createUrlTree.and.returnValue({ toString: () => '/updated-url' } as ReturnType<Router['createUrlTree']>);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: Location, useValue: jasmine.createSpyObj<Location>('Location', ['go']) },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });

    navigationStore = TestBed.inject(NavigationStore);
    const filemanagerEntry: RoutableNavigationEntry = {
      id: 'global:filemanager',
      label: 'Filemanager',
      path: 'filemanager',
      target: 'internal',
      type: 'main',
      component: 'filemanager',
    };
    navigationStore.setGlobal([filemanagerEntry]);
    service = TestBed.inject(LadonRouterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns the filemanager base route from navigation store', () => {
    expect(service.getFilemanagerBaseRoute()).toBe('ui/draco/ladon-core/filemanager/');
  });

  it('navigates to filemanager bucket from navigation store', async () => {
    await service.navigateToFilemanagerWithBucket('documents');

    expect(router.navigate).toHaveBeenCalledWith(['ui/draco/ladon-core/filemanager/documents']);
  });

  it('navigates to filemanager bucket path from navigation store', async () => {
    await service.filemanagerRoute('documents', 'folder/report.pdf');

    expect(router.navigate).toHaveBeenCalledWith(['ui/draco/ladon-core/filemanager/documents/folder/report.pdf']);
  });

  it('navigates to folder from navigation store', async () => {
    await service.navigateToFolder('documents', 'folder/report.pdf');

    expect(router.navigate).toHaveBeenCalledWith([
      'ui/draco/ladon-core/filemanager/',
      'documents',
      'folder/report.pdf',
    ]);
  });
});
