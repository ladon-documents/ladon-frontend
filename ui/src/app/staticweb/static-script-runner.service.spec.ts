import { TestBed } from '@angular/core/testing';

import { StaticScriptRunnerService } from './static-script-runner.service';

describe('StaticScriptRunnerService', () => {
  let service: StaticScriptRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaticScriptRunnerService);
  });

  afterEach(() => {
    service.cleanup();
    delete (window as any).__staticTest;
    delete (window as any).__staticModule;
    delete (window as any).__staticSequence;
    delete (window as any).__staticCleanup;
  });

  it('executes inline classic scripts', async () => {
    await service.run([{ kind: 'inline-classic', content: 'window.__staticTest = 1', attributes: {} }]);

    expect((window as any).__staticTest).toBe(1);
  });

  it('creates module scripts with type module', async () => {
    await service.run([{ kind: 'inline-module', content: 'window.__staticModule = 1', attributes: { type: 'module' } }]);

    const script = document.head.querySelector('script[data-ladon-static-script="true"][type="module"]');
    expect(script).toBeTruthy();
  });

  it('creates external scripts with src', async () => {
    const runPromise = service.run([
      { kind: 'external', src: '/static-test/helper.js', attributes: { src: '/static-test/helper.js' } },
    ]);

    const script = document.head.querySelector('script[data-ladon-static-script="true"][src="/static-test/helper.js"]');
    expect(script).toBeTruthy();
    script?.dispatchEvent(new Event('load'));

    await runPromise;
  });

  it('waits for an external script before running the next inline script', async () => {
    const runPromise = service.run([
      { kind: 'external', src: '/static-test/helper.js', attributes: { src: '/static-test/helper.js' } },
      { kind: 'inline-classic', content: 'window.__staticSequence = "inline"', attributes: {} },
    ]);

    expect((window as any).__staticSequence).toBeUndefined();
    document.head
      .querySelector('script[data-ladon-static-script="true"][src="/static-test/helper.js"]')
      ?.dispatchEvent(new Event('load'));

    await runPromise;

    expect((window as any).__staticSequence).toBe('inline');
  });

  it('rejects when an external script fails to load', async () => {
    const runPromise = service.run([
      { kind: 'external', src: '/static-test/missing.js', attributes: { src: '/static-test/missing.js' } },
    ]);

    document.head
      .querySelector('script[data-ladon-static-script="true"][src="/static-test/missing.js"]')
      ?.dispatchEvent(new Event('error'));

    await expectAsync(runPromise).toBeRejected();
  });

  it('removes injected scripts on cleanup', async () => {
    await service.run([{ kind: 'inline-classic', content: 'window.__staticCleanup = 1', attributes: {} }]);

    service.cleanup();

    expect(document.head.querySelector('script[data-ladon-static-script="true"]')).toBeNull();
  });
});
