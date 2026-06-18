import { TestBed } from '@angular/core/testing';

import { StaticHtmlSanitizer } from './static-html-sanitizer.service';

describe('StaticHtmlSanitizer', () => {
  let service: StaticHtmlSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaticHtmlSanitizer);
  });

  it('removes script elements', () => {
    expect(service.sanitize('<p>ok</p><script>window.x=1</script>')).toBe('<p>ok</p>');
  });

  it('removes inline event handlers', () => {
    expect(service.sanitize('<button onclick="alert(1)">Run</button>')).not.toContain('onclick');
  });

  it('removes javascript href values', () => {
    expect(service.sanitize('<a href="javascript:alert(1)">bad</a>')).not.toContain('javascript:');
  });

  it('removes protocol-relative external urls', () => {
    expect(service.sanitize('<a href="//example.test/x">bad</a>')).not.toContain('//example.test/x');
  });

  it('removes risky embedding elements', () => {
    const output = service.sanitize('<iframe src="/x"></iframe><object></object><embed>');

    expect(output).not.toContain('iframe');
    expect(output).not.toContain('object');
    expect(output).not.toContain('embed');
  });

  it('keeps ordinary markup and classes', () => {
    expect(service.sanitize('<section class="p-4"><h1>Hello</h1></section>')).toContain('class="p-4"');
  });
});
