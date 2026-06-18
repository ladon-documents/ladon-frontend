import { Injectable } from '@angular/core';

const APPROVED_ROOTS = ['/public/html/', '/static/public/'];
const DEFAULT_RELATIVE_ROOT = '/public/html/';

@Injectable({ providedIn: 'root' })
export class StaticUrlPolicyService {
  normalizeLegacySource(source: string): string {
    const trimmed = source.trim();
    if (!trimmed) throw new Error('Static source is required');
    if (this.hasBlockedProtocol(trimmed)) throw new Error('Static source is not allowed');

    const pathOnly = trimmed.split(/[?#]/, 1)[0];
    if (this.containsEncodedSeparator(pathOnly)) throw new Error('Static source is not allowed');

    const decodedPath = this.decodePath(pathOnly);
    if (this.containsUrlDelimiter(decodedPath)) throw new Error('Static source is not allowed');
    if (/[\\]/.test(decodedPath)) throw new Error('Static source is not allowed');
    if (this.containsEncodedSeparator(decodedPath)) throw new Error('Static source is not allowed');
    if (this.containsRemainingPercentEncoding(decodedPath)) throw new Error('Static source is not allowed');

    const absolutePath = this.toAbsoluteLegacyPath(decodedPath);
    if (this.containsTraversalSegment(absolutePath)) throw new Error('Static source is not allowed');

    const normalized = this.normalizePath(absolutePath);

    if (!APPROVED_ROOTS.some((root) => normalized.startsWith(root))) {
      throw new Error('Static source is not allowed');
    }

    return normalized;
  }

  private hasBlockedProtocol(value: string): boolean {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
  }

  private containsEncodedSeparator(value: string): boolean {
    return /%2f|%5c/i.test(value);
  }

  private containsUrlDelimiter(value: string): boolean {
    return /[?#]/.test(value);
  }

  private containsRemainingPercentEncoding(value: string): boolean {
    return /%[0-9a-f]{2}/i.test(value);
  }

  private containsTraversalSegment(path: string): boolean {
    return path.split('/').some((part) => part === '..');
  }

  private decodePath(path: string): string {
    try {
      return decodeURIComponent(path);
    } catch {
      throw new Error('Static source is not allowed');
    }
  }

  private toAbsoluteLegacyPath(path: string): string {
    if (path.startsWith('/')) return path;
    if (path.startsWith('./public/html/')) return path.slice(1);
    if (path.startsWith('public/html/')) return `/${path}`;
    if (path.startsWith('./static/public/')) return path.slice(1);
    if (path.startsWith('static/public/')) return `/${path}`;
    return `${DEFAULT_RELATIVE_ROOT}${path}`;
  }

  private normalizePath(path: string): string {
    const parts: string[] = [];

    for (const part of path.split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }

    return `/${parts.join('/')}`;
  }
}
