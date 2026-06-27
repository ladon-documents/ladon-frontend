import { Injectable } from '@angular/core';
import { auth, fetchClient } from '@ladon/api';
import { utility } from '@ladon/utility';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { LadonStaticFacade } from './staticweb.types';

interface StaticRuntimeWindow extends Window {
  ladonStatic?: LadonStaticFacade;
  ladonStaticReady?: Promise<LadonStaticFacade>;
}

@Injectable({ providedIn: 'root' })
export class StaticRuntimeFacadeService {
  constructor(private readonly apiFactory: FetchApiFactory) {}

  install(): LadonStaticFacade {
    const facade = this.createFacade();
    const windowRef = window as StaticRuntimeWindow;
    windowRef.ladonStatic = facade;
    windowRef.ladonStaticReady = Promise.resolve(facade);

    return facade;
  }

  clear(): void {
    const windowRef = window as StaticRuntimeWindow;
    delete windowRef.ladonStatic;
    delete windowRef.ladonStaticReady;
  }

  private createFacade(): LadonStaticFacade {
    const facade: LadonStaticFacade = {
      api: {
        fetchClient,
        utility,
        auth,
        apiFactory: this.apiFactory,
      },
      fetchClient,
      utility,
      auth,
      init: async () => facade,
    };

    return facade;
  }
}
