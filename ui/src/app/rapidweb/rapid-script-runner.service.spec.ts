import { TestBed } from '@angular/core/testing';

import { RapidScriptRunnerService } from './rapid-script-runner.service';

describe('RapidScriptRunnerService', () => {
  let service: RapidScriptRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RapidScriptRunnerService);
  });

  afterEach(() => {
    service.cleanup();
    delete (window as any).__rapidTest;
    delete (window as any).__rapidModule;
    delete (window as any).__rapidSequence;
    delete (window as any).__rapidCleanup;
  });

  it('executes inline classic scripts', async () => {
    await service.run([{ kind: 'inline-classic', content: 'window.__rapidTest = 1', attributes: {} }]);

    expect((window as any).__rapidTest).toBe(1);
  });

  it('creates module scripts with type module', async () => {
    await service.run([{ kind: 'inline-module', content: 'window.__rapidModule = 1', attributes: { type: 'module' } }]);

    const script = document.head.querySelector('script[data-ladon-rapid-script="true"][type="module"]');
    expect(script).toBeTruthy();
  });

  it('creates external scripts with src', async () => {
    const runPromise = service.run([
      { kind: 'external', src: '/rapid-test/helper.js', attributes: { src: '/rapid-test/helper.js' } },
    ]);

    const script = document.head.querySelector('script[data-ladon-rapid-script="true"][src="/rapid-test/helper.js"]');
    expect(script).toBeTruthy();
    script?.dispatchEvent(new Event('load'));

    await runPromise;
  });

  it('waits for an external script before running the next inline script', async () => {
    const runPromise = service.run([
      { kind: 'external', src: '/rapid-test/helper.js', attributes: { src: '/rapid-test/helper.js' } },
      { kind: 'inline-classic', content: 'window.__rapidSequence = "inline"', attributes: {} },
    ]);

    expect((window as any).__rapidSequence).toBeUndefined();
    document.head
      .querySelector('script[data-ladon-rapid-script="true"][src="/rapid-test/helper.js"]')
      ?.dispatchEvent(new Event('load'));

    await runPromise;

    expect((window as any).__rapidSequence).toBe('inline');
  });

  it('rejects when an external script fails to load', async () => {
    const runPromise = service.run([
      { kind: 'external', src: '/rapid-test/missing.js', attributes: { src: '/rapid-test/missing.js' } },
    ]);

    document.head
      .querySelector('script[data-ladon-rapid-script="true"][src="/rapid-test/missing.js"]')
      ?.dispatchEvent(new Event('error'));

    await expectAsync(runPromise).toBeRejected();
  });

  it('removes injected scripts on cleanup', async () => {
    await service.run([{ kind: 'inline-classic', content: 'window.__rapidCleanup = 1', attributes: {} }]);

    service.cleanup();

    expect(document.head.querySelector('script[data-ladon-rapid-script="true"]')).toBeNull();
  });
});
