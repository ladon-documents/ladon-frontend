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

  it('removes risky embedding and base elements', () => {
    const output = service.sanitize('<iframe src="/x"></iframe><object></object><embed><base href="/x">');

    expect(output).not.toContain('iframe');
    expect(output).not.toContain('object');
    expect(output).not.toContain('embed');
    expect(output).not.toContain('base');
  });

  it('removes unsafe src, xlink href, and form action values', () => {
    const output = service.sanitize(
      '<img src="javascript:alert(1)"><svg><use xlink:href="javascript:alert(1)"></use></svg><button formaction="javascript:alert(1)">Go</button>',
    );

    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('src=');
    expect(output).not.toContain('xlink:href=');
    expect(output).not.toContain('formaction=');
  });

  it('keeps ordinary markup and classes', () => {
    expect(service.sanitize('<section class="p-4"><h1>Hello</h1></section>')).toContain('class="p-4"');
  });
});
