import { TestBed } from '@angular/core/testing';

import { StaticUrlPolicyService } from './static-url-policy.service';

describe('StaticUrlPolicyService', () => {
  let service: StaticUrlPolicyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaticUrlPolicyService);
  });

  it('resolves bare legacy names under /public/html/', () => {
    expect(service.normalizeLegacySource('test.html')).toBe('/public/html/test.html');
  });

  it('resolves existing navigation paths under /public/html/', () => {
    expect(service.normalizeLegacySource('./public/html/test.html')).toBe('/public/html/test.html');
  });

  it('accepts approved absolute ui public html paths', () => {
    expect(service.normalizeLegacySource('/public/html/test.html')).toBe('/public/html/test.html');
  });

  it('accepts approved static public paths', () => {
    expect(service.normalizeLegacySource('/static/public/demo/module.html')).toBe('/static/public/demo/module.html');
  });

  it('rejects external urls', () => {
    expect(() => service.normalizeLegacySource('https://example.test/x.html')).toThrowError(/not allowed/i);
  });

  it('rejects protocol-relative urls', () => {
    expect(() => service.normalizeLegacySource('//example.test/x.html')).toThrowError(/not allowed/i);
  });

  it('rejects javascript urls', () => {
    expect(() => service.normalizeLegacySource('javascript:alert(1)')).toThrowError(/not allowed/i);
  });

  it('rejects traversal outside approved roots', () => {
    expect(() => service.normalizeLegacySource('/public/html/../../index.html')).toThrowError(/not allowed/i);
  });

  it('rejects encoded traversal outside approved roots', () => {
    expect(() => service.normalizeLegacySource('/public/html/%2e%2e/%2e%2e/index.html')).toThrowError(/not allowed/i);
  });

  it('rejects double-encoded dot traversal outside approved roots', () => {
    expect(() => service.normalizeLegacySource('/public/html/%252e%252e/%252e%252e/index.html')).toThrowError(/not allowed/i);
  });

  it('rejects encoded slashes that could change the normalized path', () => {
    expect(() => service.normalizeLegacySource('/public/html/%2f..%2findex.html')).toThrowError(/not allowed/i);
  });

  it('rejects double-encoded slashes that could be decoded downstream', () => {
    expect(() => service.normalizeLegacySource('/public/html/%252f..%252findex.html')).toThrowError(/not allowed/i);
  });

  it('rejects double-encoded backslashes that could be decoded downstream', () => {
    expect(() => service.normalizeLegacySource('/public/html/%255c..%255cindex.html')).toThrowError(/not allowed/i);
  });

  it('rejects malformed percent encoding', () => {
    expect(() => service.normalizeLegacySource('/public/html/%E0%A4%A.html')).toThrowError(/not allowed/i);
  });

  it('rejects encoded query delimiters after decoding', () => {
    expect(() => service.normalizeLegacySource('/public/html/test%3Fignored.html')).toThrowError(/not allowed/i);
  });

  it('rejects encoded hash delimiters after decoding', () => {
    expect(() => service.normalizeLegacySource('/public/html/test%23ignored.html')).toThrowError(/not allowed/i);
  });

  it('strips query and hash before validation', () => {
    expect(service.normalizeLegacySource('/public/html/test.html?x=1#top')).toBe('/public/html/test.html');
  });
});
