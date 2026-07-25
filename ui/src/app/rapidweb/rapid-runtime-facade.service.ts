import { Injectable } from '@angular/core';
import { auth, fetchClient } from '@ladon/api';
import { utility } from '@ladon/utility';

import { FetchApiFactory } from '../services/api/fetch-api.factory';
import { LadonRapidFacade } from './rapidweb.types';

interface RapidRuntimeWindow extends Window {
  ladonRapid?: LadonRapidFacade;
  ladonRapidReady?: Promise<LadonRapidFacade>;
}

@Injectable({ providedIn: 'root' })
export class RapidRuntimeFacadeService {
  constructor(private readonly apiFactory: FetchApiFactory) {}

  install(): LadonRapidFacade {
    const facade = this.createFacade();
    const windowRef = window as RapidRuntimeWindow;
    windowRef.ladonRapid = facade;
    windowRef.ladonRapidReady = Promise.resolve(facade);

    return facade;
  }

  clear(): void {
    const windowRef = window as RapidRuntimeWindow;
    delete windowRef.ladonRapid;
    delete windowRef.ladonRapidReady;
  }

  private createFacade(): LadonRapidFacade {
    const facade: LadonRapidFacade = {
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
