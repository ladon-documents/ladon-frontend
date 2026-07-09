import { TestBed } from '@angular/core/testing';

import { StaticHtmlPolicyService } from './static-html-policy.service';
import { StaticAssetRewriterService } from './static-asset-rewriter.service';
import { StaticDefinition } from './staticweb.types';

describe('StaticAssetRewriterService', () => {
  let service: StaticAssetRewriterService;
  let htmlPolicy: StaticHtmlPolicyService;

  const trustedDefinition: StaticDefinition = {
    source: 'trusted-static/index.html',
    mode: 'trusted',
    allowScripts: true,
    allowedScriptSources: 'same-origin',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaticAssetRewriterService);
    htmlPolicy = TestBed.inject(StaticHtmlPolicyService);
  });

  it('rewrites script src before policy validation', () => {
    const html = service.rewrite('<script src="./app.js" defer></script>', 'demo/');

    expect(html).toBe(
      '<script src="/admin/api/rest/v1/content/buckets/draco-statics/documents?key=demo%2Fapp.js" defer=""></script>',
    );
  });

  it('rewrites stylesheet link href', () => {
    const html = service.rewrite('<link rel="preload stylesheet" href="./style.css">', 'demo/');

    expect(html).toBe(
      '<link rel="preload stylesheet" href="/admin/api/rest/v1/content/buckets/draco-statics/documents?key=demo%2Fstyle.css">',
    );
  });

  it('rewrites image and media src attributes', () => {
    const html = service.rewrite(
      '<img src="./img/logo.png"><video src="media/clip.mp4"></video><audio src="./media/sound.mp3"></audio><source src="./media/clip.webm">',
      'demo/',
    );

    expect(html).toContain(
      '<img src="/admin/api/rest/v1/content/buckets/draco-statics/documents?key=demo%2Fimg%2Flogo.png">',
    );
    expect(html).toContain(
      '<video src="/admin/api/rest/v1/content/buckets/draco-statics/documents?key=demo%2Fmedia%2Fclip.mp4"></video>',
    );
    expect(html).toContain(
      '<audio src="/admin/api/rest/v1/content/buckets/draco-statics/documents?key=demo%2Fmedia%2Fsound.mp3"></audio>',
    );
    expect(html).toContain(
      '<source src="/admin/api/rest/v1/content/buckets/draco-statics/documents?key=demo%2Fmedia%2Fclip.webm">',
    );
  });

  it('leaves hash-only and empty values alone where appropriate', () => {
    const html = service.rewrite('<a href="#top"></a><img src=""><link rel="stylesheet" href="#theme">', 'demo/');

    expect(html).toBe('<a href="#top"></a><img src=""><link rel="stylesheet" href="#theme">');
  });

  it('throws when a relative asset escapes the static folder', () => {
    expect(() => service.rewrite('<img src="../other/logo.png">', 'demo/')).toThrowError(/not allowed/i);
  });

  it('leaves external non-script urls for sanitizer/policy to decide', () => {
    const html = service.rewrite(
      '<img src="https://cdn.example.test/logo.png"><link rel="stylesheet" href="//cdn.example.test/style.css">',
      'demo/',
    );

    expect(html).toBe(
      '<img src="https://cdn.example.test/logo.png"><link rel="stylesheet" href="//cdn.example.test/style.css">',
    );
  });

  it('does not rewrite external script src values into executable document urls', () => {
    expect(() => service.rewrite('<script src="https://cdn.example.test/app.js"></script>', 'demo/')).toThrowError(
      /not allowed/i,
    );
  });

  it('rejects absolute and protocol script src values', () => {
    expect(() => service.rewrite('<script src="/same-origin.js"></script>', 'demo/')).toThrowError(/not allowed/i);
    expect(() => service.rewrite('<script src="https://cdn.example.test/app.js"></script>', 'demo/')).toThrowError(
      /not allowed/i,
    );
    expect(() => service.rewrite('<script src="//cdn.example.test/app.js"></script>', 'demo/')).toThrowError(
      /not allowed/i,
    );
    expect(() => service.rewrite('<script src="javascript:alert(1)"></script>', 'demo/')).toThrowError(/not allowed/i);
  });

  it('rejects script src values with backslashes, queries, or fragments', () => {
    expect(() => service.rewrite('<script src=".\\app.js"></script>', 'demo/')).toThrowError(/not allowed/i);
    expect(() =>
      service.rewrite('<script src="https://cdn.example.test/app.js?version=1"></script>', 'demo/'),
    ).toThrowError(/not allowed/i);
    expect(() => service.rewrite('<script src="#boot"></script>', 'demo/')).toThrowError(/not allowed/i);
    expect(() => service.rewrite('<script src="./app.js?v=1"></script>', 'demo/')).toThrowError(/not allowed/i);
    expect(() => service.rewrite('<script src="./app.js#boot"></script>', 'demo/')).toThrowError(/not allowed/i);
  });

  it('parses inertly without executing inline scripts or event handlers', () => {
    (window as unknown as { staticAssetRewriteExecuted?: boolean }).staticAssetRewriteExecuted = false;

    const html = service.rewrite(
      '<img src="./logo.png" onerror="window.staticAssetRewriteExecuted = true"><script>window.staticAssetRewriteExecuted = true</script>',
      'demo/',
    );

    expect((window as unknown as { staticAssetRewriteExecuted?: boolean }).staticAssetRewriteExecuted).toBeFalse();
    expect(html).toContain('onerror="window.staticAssetRewriteExecuted = true"');
    expect(html).toContain('<script>window.staticAssetRewriteExecuted = true</script>');

    delete (window as unknown as { staticAssetRewriteExecuted?: boolean }).staticAssetRewriteExecuted;
  });

  it('rewrites relative script src values into same-origin external policy descriptors', () => {
    const html = service.rewrite('<script src="./app.js" defer></script>', 'demo/');
    const plan = htmlPolicy.createRenderPlan(html, trustedDefinition);

    expect(plan.html).toBe('');
    expect(plan.scripts.length).toBe(1);
    expect(plan.scripts[0].kind).toBe('external');
    expect(plan.scripts[0].src).toBe(
      `${window.location.origin}/admin/api/rest/v1/content/buckets/draco-statics/documents?key=demo%2Fapp.js`,
    );
    expect(plan.scripts[0].attributes).toEqual({ defer: '' });
  });
});
