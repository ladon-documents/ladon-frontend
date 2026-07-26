import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { PluginManagerStore } from '../store/pluginmanager.store';
import { PluginmanagerComponent } from './pluginmanager.component';

describe('PluginmanagerComponent', () => {
  let component: PluginmanagerComponent;
  let fixture: ComponentFixture<PluginmanagerComponent>;
  let store: jasmine.SpyObj<any>;
  let router: jasmine.SpyObj<Router>;
  let pluginmanagerRoute: ActivatedRoute;

  beforeEach(async () => {
    store = jasmine.createSpyObj(
      'PluginManagerStore',
      ['initialize', 'changeChannel', 'setSearchTerm', 'selectPlugin', 'runPluginAction'],
      {
        channels: signal([]),
        activeChannel: signal('stable'),
        filteredItems: signal([]),
        selectedPlugin: signal(null),
        selectedPluginId: signal(null),
        searchTerm: signal(''),
        overview: signal({
          totalCount: 0,
          installedCount: 0,
          updateCount: 0,
          notInstalledCount: 0,
          requiredCount: 0,
          bundleCount: 0,
          bundleUpdateCount: 0,
          activeActionCount: 0,
          failedActionCount: 0,
        }),
        activeAction: signal(null),
        loadError: signal(null),
        actionError: signal(null),
        isLoadingPlugins: signal(false),
        normalizedChannel: signal(null),
      },
    );
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    pluginmanagerRoute = {} as ActivatedRoute;

    await TestBed.configureTestingModule({
      imports: [PluginmanagerComponent],
      providers: [
        { provide: PluginManagerStore, useValue: store },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ channelName: 'stable' })),
            parent: pluginmanagerRoute,
          },
        },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginmanagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes the store from the route channel', () => {
    expect(store.initialize).toHaveBeenCalledWith('stable');
  });

  it('changes channel within the pluginmanager route', () => {
    component.onChannelSelected('beta');

    expect(store.changeChannel).toHaveBeenCalledWith('beta');
    expect(router.navigate).toHaveBeenCalledWith(['beta'], { relativeTo: pluginmanagerRoute });
  });
});
