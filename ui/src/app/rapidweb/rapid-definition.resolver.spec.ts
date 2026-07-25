import { TestBed } from '@angular/core/testing';

import { DracoRapidRegistryService } from './draco-rapid-registry.service';
import { DracoRapidEntry } from './draco-rapid.types';
import { RapidDefinitionResolver } from './rapid-definition.resolver';
import { RapidDefinition } from './rapidweb.types';

describe('RapidDefinitionResolver', () => {
  let resolver: RapidDefinitionResolver;
  let registry: jasmine.SpyObj<DracoRapidRegistryService>;

  const displayOnlyDefinition: RapidDefinition = {
    id: 'display-rapid',
    source: 'display-rapid/index.html',
    mode: 'display-only',
    allowScripts: false,
    allowedScriptSources: 'same-origin',
  };

  const trustedDefinition: RapidDefinition = {
    id: 'trusted-rapid',
    source: 'trusted-rapid/index.html',
    mode: 'trusted',
    allowScripts: true,
    allowedScriptSources: 'same-origin',
  };

  function createEntry(rapidId: string, definition: RapidDefinition): DracoRapidEntry {
    return {
      rapidId,
      bucket: 'draco-rapids',
      basePath: `${rapidId}/`,
      html: 'index.html',
      htmlKey: `${rapidId}/index.html`,
      mode: definition.mode,
      allowScripts: definition.allowScripts,
      allowedScriptSources: 'same-origin',
      definition,
    };
  }

  beforeEach(() => {
    registry = jasmine.createSpyObj<DracoRapidRegistryService>('DracoRapidRegistryService', ['getById']);

    TestBed.configureTestingModule({
      providers: [RapidDefinitionResolver, { provide: DracoRapidRegistryService, useValue: registry }],
    });

    resolver = TestBed.inject(RapidDefinitionResolver);
  });

  it('resolves a known rapid id from the registry', () => {
    const entry = createEntry('display-rapid', displayOnlyDefinition);
    registry.getById.and.returnValue(entry);

    const result = resolver.resolve({ rapidId: 'display-rapid' });

    expect(registry.getById).toHaveBeenCalledOnceWith('display-rapid');
    expect(result).toEqual({ kind: 'allow', definition: entry.definition });
  });

  it('returns missing/error for unknown rapid ids', () => {
    registry.getById.and.returnValue(undefined);

    const result = resolver.resolve({ rapidId: 'missing-rapid' });

    expect(registry.getById).toHaveBeenCalledOnceWith('missing-rapid');
    expect(result.kind).toBe('missing');
    expect(result.error).toContain('missing-rapid');
    expect(result.definition).toBeUndefined();
  });

  it('rejects requests without a rapid id', () => {
    registry.getById.and.returnValue(createEntry('display-rapid', displayOnlyDefinition));

    const result = resolver.resolve({});

    expect(registry.getById).not.toHaveBeenCalled();
    expect(result.kind).toBe('invalid');
    expect(result.definition).toBeUndefined();
  });

  it('returns display-only when config is not trusted', () => {
    const entry = createEntry('display-rapid', displayOnlyDefinition);
    registry.getById.and.returnValue(entry);

    const result = resolver.resolve({ rapidId: 'display-rapid' });

    expect(result.kind).toBe('allow');
    expect(result.definition).toEqual(displayOnlyDefinition);
  });

  it('returns trusted only when mode trusted and allowScripts true', () => {
    const entry = createEntry('trusted-rapid', trustedDefinition);
    registry.getById.and.returnValue(entry);

    const result = resolver.resolve({ rapidId: 'trusted-rapid' });

    expect(result.kind).toBe('allow');
    expect(result.definition).toEqual(trustedDefinition);
  });

  it('returns display-only when trusted config is downgraded by the trust boundary gate', () => {
    const downgradedDefinition: RapidDefinition = {
      id: 'trusted-rapid',
      source: 'trusted-rapid/index.html',
      mode: 'display-only',
      allowScripts: false,
      allowedScriptSources: 'same-origin',
    };
    const entry = createEntry('trusted-rapid', downgradedDefinition);
    registry.getById.and.returnValue(entry);

    const result = resolver.resolve({ rapidId: 'trusted-rapid' });

    expect(result.kind).toBe('allow');
    expect(result.definition).toEqual(downgradedDefinition);
  });

  it('rejects invalid rapid ids before registry lookup', () => {
    const result = resolver.resolve({ rapidId: '../demo' });

    expect(registry.getById).not.toHaveBeenCalled();
    expect(result.kind).toBe('invalid');
    expect(result.error).toContain('rapidId');
    expect(result.definition).toBeUndefined();
  });
});
