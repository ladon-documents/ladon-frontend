import { ComponentFixture, TestBed } from '@angular/core/testing';
import { pluginFetchClient } from '@ladon/api';
import { PluginManagerItem } from '../models/pluginmanager.models';
import { PluginDetailComponent } from './plugin-detail.component';

function item(overrides: Partial<PluginManagerItem> = {}): PluginManagerItem {
  return {
    id: 'package-id',
    pluginId: 'mind/example-plugin',
    name: 'Example Plugin',
    type: 'static-web',
    isBundle: false,
    isRequired: false,
    installedVersion: '1.0.0',
    availableVersion: '1.1.0',
    status: 'updateAvailable',
    canInstall: false,
    canUpdate: true,
    canDeinstall: true,
    documentationUrl: 'https://docs.example/plugin',
    bundleItems: [],
    rawPlugin: {} as pluginFetchClient.Plugin,
    ...overrides,
  };
}

describe('PluginDetailComponent', () => {
  let fixture: ComponentFixture<PluginDetailComponent>;
  let component: PluginDetailComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('plugin', item());
    fixture.detectChanges();
  });

  it('renders the update action and emits it', () => {
    const emitSpy = spyOn(component.actionTriggered, 'emit');

    expect(component.primaryActionLabel()).toBe('Update');
    component.triggerPrimaryAction();

    expect(emitSpy).toHaveBeenCalledWith({ item: item(), actionType: 'update' });
  });
});
