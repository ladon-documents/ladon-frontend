import { TestBed } from '@angular/core/testing';
import { auth, fetchClient } from '@ladon/api';
import { utility } from '@ladon/utility';

import { RapidRuntimeFacadeService } from './rapid-runtime-facade.service';

describe('RapidRuntimeFacadeService', () => {
  let service: RapidRuntimeFacadeService;

  afterEach(() => {
    service.clear();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RapidRuntimeFacadeService);
  });

  it('sets window.ladonRapid and window.ladonRapidReady', async () => {
    const facade = service.install();

    expect((window as any).ladonRapid).toBe(facade);
    await expectAsync((window as any).ladonRapidReady).toBeResolvedTo(facade);
  });

  it('clears installed globals', () => {
    service.install();

    service.clear();

    expect((window as any).ladonRapid).toBeUndefined();
    expect((window as any).ladonRapidReady).toBeUndefined();
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
