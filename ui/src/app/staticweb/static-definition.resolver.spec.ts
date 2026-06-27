import { TestBed } from '@angular/core/testing';

import { DracoStaticRegistryService } from './draco-static-registry.service';
import { DracoStaticEntry } from './draco-static.types';
import { StaticDefinitionResolver } from './static-definition.resolver';
import { StaticDefinition } from './staticweb.types';

describe('StaticDefinitionResolver', () => {
  let resolver: StaticDefinitionResolver;
  let registry: jasmine.SpyObj<DracoStaticRegistryService>;

  const displayOnlyDefinition: StaticDefinition = {
    id: 'display-static',
    source: 'display-static/index.html',
    mode: 'display-only',
    allowScripts: false,
    allowedScriptSources: 'same-origin',
  };

  const trustedDefinition: StaticDefinition = {
    id: 'trusted-static',
    source: 'trusted-static/index.html',
    mode: 'trusted',
    allowScripts: true,
    allowedScriptSources: 'same-origin',
  };

  function createEntry(staticId: string, definition: StaticDefinition): DracoStaticEntry {
    return {
      staticId,
      bucket: 'draco-statics',
      basePath: `${staticId}/`,
      html: 'index.html',
      htmlKey: `${staticId}/index.html`,
      mode: definition.mode,
      allowScripts: definition.allowScripts,
      allowedScriptSources: 'same-origin',
      definition,
    };
  }

  beforeEach(() => {
    registry = jasmine.createSpyObj<DracoStaticRegistryService>('DracoStaticRegistryService', ['getById']);

    TestBed.configureTestingModule({
      providers: [StaticDefinitionResolver, { provide: DracoStaticRegistryService, useValue: registry }],
    });

    resolver = TestBed.inject(StaticDefinitionResolver);
  });

  it('resolves a known static id from the registry', () => {
    const entry = createEntry('display-static', displayOnlyDefinition);
    registry.getById.and.returnValue(entry);

    const result = resolver.resolve({ staticId: 'display-static' });

    expect(registry.getById).toHaveBeenCalledOnceWith('display-static');
    expect(result).toEqual({ kind: 'allow', definition: entry.definition });
  });

  it('returns missing/error for unknown static ids', () => {
    registry.getById.and.returnValue(undefined);

    const result = resolver.resolve({ staticId: 'missing-static' });

    expect(registry.getById).toHaveBeenCalledOnceWith('missing-static');
    expect(result.kind).toBe('missing');
    expect(result.error).toContain('missing-static');
    expect(result.definition).toBeUndefined();
  });

  it('rejects requests without a static id', () => {
    registry.getById.and.returnValue(createEntry('display-static', displayOnlyDefinition));

    const result = resolver.resolve({});

    expect(registry.getById).not.toHaveBeenCalled();
    expect(result.kind).toBe('invalid');
    expect(result.definition).toBeUndefined();
  });

  it('returns display-only when config is not trusted', () => {
    const entry = createEntry('display-static', displayOnlyDefinition);
    registry.getById.and.returnValue(entry);

    const result = resolver.resolve({ staticId: 'display-static' });

    expect(result.kind).toBe('allow');
    expect(result.definition).toEqual(displayOnlyDefinition);
  });

  it('returns trusted only when mode trusted and allowScripts true', () => {
    const entry = createEntry('trusted-static', trustedDefinition);
    registry.getById.and.returnValue(entry);

    const result = resolver.resolve({ staticId: 'trusted-static' });

    expect(result.kind).toBe('allow');
    expect(result.definition).toEqual(trustedDefinition);
  });

  it('returns display-only when trusted config is downgraded by the trust boundary gate', () => {
    const downgradedDefinition: StaticDefinition = {
      id: 'trusted-static',
      source: 'trusted-static/index.html',
      mode: 'display-only',
      allowScripts: false,
      allowedScriptSources: 'same-origin',
    };
    const entry = createEntry('trusted-static', downgradedDefinition);
    registry.getById.and.returnValue(entry);

    const result = resolver.resolve({ staticId: 'trusted-static' });

    expect(result.kind).toBe('allow');
    expect(result.definition).toEqual(downgradedDefinition);
  });

  it('rejects invalid static ids before registry lookup', () => {
    const result = resolver.resolve({ staticId: '../demo' });

    expect(registry.getById).not.toHaveBeenCalled();
    expect(result.kind).toBe('invalid');
    expect(result.error).toContain('staticId');
    expect(result.definition).toBeUndefined();
  });
});
