import { TestBed } from '@angular/core/testing';

import { RapidAssetUrlService } from './rapid-asset-url.service';
import { RAPID_SOURCE_CONFIG } from './rapid-source-config';

describe('RapidAssetUrlService', () => {
  let service: RapidAssetUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RapidAssetUrlService);
  });

  it('builds document content urls for same-folder assets', () => {
    expect(service.buildAssetUrl('demo/', './style.css')).toBe(
      '/admin/api/rest/v1/content/buckets/draco-rapids/documents?key=demo%2Fstyle.css',
    );
  });

  it('builds local dev rapid asset urls when the rapid source is local', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        RapidAssetUrlService,
        {
          provide: RAPID_SOURCE_CONFIG,
          useValue: {
            source: 'local',
            local: {
              basePath: '/ui/draco/ladon-core/public/dev-rapids',
              manifestPath: '/ui/draco/ladon-core/public/dev-rapids/rapid-pages.json',
            },
          },
        },
      ],
    });
    const localService = TestBed.inject(RapidAssetUrlService);

    expect(localService.buildAssetUrl('demo/', './style.css')).toBe(
      '/ui/draco/ladon-core/public/dev-rapids/demo/style.css',
    );
    expect(RapidAssetUrlService.documentEndpoint).toBe('/admin/api/rest/v1/content/buckets/draco-rapids/documents');
  });

  it('encodes keys as query parameter values', () => {
    expect(service.buildAssetUrl('demo/', './assets/main file.css')).toBe(
      '/admin/api/rest/v1/content/buckets/draco-rapids/documents?key=demo%2Fassets%2Fmain%20file.css',
    );
  });

  it('rejects traversal paths', () => {
    expect(() => service.buildAssetUrl('demo/', '../other/style.css')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo/', './assets/../style.css')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo/nested/', './../../style.css')).toThrowError(/not allowed/i);
  });

  it('rejects encoded traversal and encoded separators', () => {
    expect(() => service.buildAssetUrl('demo/', './%2e%2e/style.css')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo/', './assets%2fstyle.css')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo/', './assets%5cstyle.css')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo/', './%252e%252e/style.css')).toThrowError(/not allowed/i);
  });

  it('rejects protocol and protocol-relative paths', () => {
    expect(() => service.buildAssetUrl('demo/', 'https://example.test/style.css')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo/', 'javascript:alert(1)')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo/', '//example.test/style.css')).toThrowError(/not allowed/i);
  });

  it('rejects encoded protocol values', () => {
    expect(() => service.buildAssetUrl('demo/', 'javascript%3Aalert(1)')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo/', 'https%3A%2F%2Fexample.test%2Fstyle.css')).toThrowError(/not allowed/i);
  });

  it('rejects invalid base paths', () => {
    expect(() => service.buildAssetUrl('/demo/', './style.css')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('../demo/', './style.css')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo%2Fnested/', './style.css')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('javascript:demo/', './style.css')).toThrowError(/not allowed/i);
  });

  it('rejects raw backslashes in asset paths', () => {
    expect(() => service.buildAssetUrl('demo/', '.\\style.css')).toThrowError(/not allowed/i);
  });

  it('rejects query strings and fragments in relative asset paths', () => {
    expect(() => service.buildAssetUrl('demo/', './style.css?v=1')).toThrowError(/not allowed/i);
    expect(() => service.buildAssetUrl('demo/', './style.css#theme')).toThrowError(/not allowed/i);
  });

  it('documents the browser asset endpoint that must be verified before enabling tag rewriting', () => {
    expect(RapidAssetUrlService.documentEndpoint).toBe('/admin/api/rest/v1/content/buckets/draco-rapids/documents');
    expect(service.buildAssetUrl('demo/', './style.css')).toBe(
      `${RapidAssetUrlService.documentEndpoint}?key=demo%2Fstyle.css`,
    );
  });
});
