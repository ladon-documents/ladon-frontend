import { TestBed } from '@angular/core/testing';

import { StaticHtmlPolicyService } from './static-html-policy.service';
import { StaticDefinition } from './staticweb.types';

describe('StaticHtmlPolicyService', () => {
  let service: StaticHtmlPolicyService;

  const displayOnlyDefinition: StaticDefinition = {
    source: '/public/html/display.html',
    mode: 'display-only',
    allowScripts: false,
    allowedScriptSources: 'same-origin',
  };

  const trustedDefinition: StaticDefinition = {
    source: '/public/html/trusted.html',
    mode: 'trusted',
    allowScripts: true,
    allowedScriptSources: 'same-origin',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaticHtmlPolicyService);
  });

  it('creates display-only plan with sanitized html and no scripts', () => {
    const plan = service.createRenderPlan('<p onclick="x()">ok</p><script>bad()</script>', displayOnlyDefinition);

    expect(plan.mode).toBe('display-only');
    expect(plan.html).toContain('<p');
    expect(plan.html).not.toContain('onclick');
    expect(plan.html).not.toContain('<script');
    expect(plan.scripts.length).toBe(0);
  });

  it('extracts inline classic scripts in trusted mode', () => {
    const plan = service.createRenderPlan('<div></div><script data-role="boot">window.a=1</script>', trustedDefinition);

    expect(plan.html).toBe('<div></div>');
    expect(plan.scripts.length).toBe(1);
    expect(plan.scripts[0].kind).toBe('inline-classic');
    expect(plan.scripts[0].content).toContain('window.a=1');
    expect(plan.scripts[0].attributes).toEqual({ 'data-role': 'boot' });
  });

  it('extracts inline module scripts in trusted mode', () => {
    const plan = service.createRenderPlan('<script type="module">await Promise.resolve()</script>', trustedDefinition);

    expect(plan.html).toBe('');
    expect(plan.scripts.length).toBe(1);
    expect(plan.scripts[0].kind).toBe('inline-module');
    expect(plan.scripts[0].content).toContain('await Promise.resolve()');
    expect(plan.scripts[0].attributes).toEqual({ type: 'module' });
  });

  it('allows same-origin external scripts in trusted mode', () => {
    const plan = service.createRenderPlan(
      '<script src="/public/html/helper.js" async data-name="helper"></script>',
      trustedDefinition,
    );

    expect(plan.html).toBe('');
    expect(plan.scripts.length).toBe(1);
    expect(plan.scripts[0].kind).toBe('external');
    expect(plan.scripts[0].src).toBe(`${window.location.origin}/public/html/helper.js`);
    expect(plan.scripts[0].attributes).toEqual({ async: '', 'data-name': 'helper' });
  });

  it('collects trusted scripts in document order', () => {
    const plan = service.createRenderPlan(
      '<script>window.first=1</script><div></div><script type="module">window.second=2</script>',
      trustedDefinition,
    );

    expect(plan.html).toBe('<div></div>');
    expect(plan.scripts.map((script) => script.kind)).toEqual(['inline-classic', 'inline-module']);
    expect(plan.scripts[0].content).toContain('window.first=1');
    expect(plan.scripts[1].content).toContain('window.second=2');
  });

  it('blocks external scripts from another origin in trusted mode', () => {
    expect(() => service.createRenderPlan('<script src="https://cdn.example/x.js"></script>', trustedDefinition)).toThrowError(
      /script source/i,
    );
  });

  it('blocks empty external script src values in trusted mode', () => {
    expect(() => service.createRenderPlan('<script src=""></script>', trustedDefinition)).toThrowError(/script source/i);
  });

  it('blocks malformed external script src values in trusted mode', () => {
    expect(() => service.createRenderPlan('<script src="http://[::1"></script>', trustedDefinition)).toThrowError(
      /script source/i,
    );
  });

  it('blocks same-origin blob external script src values in trusted mode', () => {
    expect(() =>
      service.createRenderPlan(`<script src="blob:${window.location.origin}/helper.js"></script>`, trustedDefinition),
    ).toThrowError(/script source/i);
  });
});
