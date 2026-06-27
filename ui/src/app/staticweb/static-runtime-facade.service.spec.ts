import { TestBed } from '@angular/core/testing';
import { auth, fetchClient } from '@ladon/api';
import { utility } from '@ladon/utility';

import { StaticRuntimeFacadeService } from './static-runtime-facade.service';

describe('StaticRuntimeFacadeService', () => {
  let service: StaticRuntimeFacadeService;

  afterEach(() => {
    service.clear();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaticRuntimeFacadeService);
  });

  it('sets window.ladonStatic and window.ladonStaticReady', async () => {
    const facade = service.install();

    expect((window as any).ladonStatic).toBe(facade);
    await expectAsync((window as any).ladonStaticReady).toBeResolvedTo(facade);
  });

  it('clears installed globals', () => {
    service.install();

    service.clear();

    expect((window as any).ladonStatic).toBeUndefined();
    expect((window as any).ladonStaticReady).toBeUndefined();
  });

  it('init resolves to the same facade', async () => {
    const facade = service.install();

    await expectAsync(facade.init()).toBeResolvedTo(facade);
  });

  it('exposes concrete @ladon/api fetchClient and auth exports', () => {
    const facade = service.install();

    expect(facade.fetchClient).toBe(fetchClient);
    expect(facade.auth).toBe(auth);
  });

  it('exposes concrete @ladon/utility utility exports', () => {
    const facade = service.install();

    expect(facade.utility).toBe(utility);
  });
});
