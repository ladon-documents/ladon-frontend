import { Inject, Injectable } from '@angular/core';

import { RAPID_SOURCE_CONFIG, RapidSourceConfig } from './rapid-source-config';

const DOCUMENT_ENDPOINT = '/admin/api/rest/v1/content/buckets/draco-rapids/documents';

@Injectable({ providedIn: 'root' })
export class RapidAssetUrlService {
  static readonly documentEndpoint = DOCUMENT_ENDPOINT;

  constructor(@Inject(RAPID_SOURCE_CONFIG) private readonly sourceConfig: RapidSourceConfig) {}

  buildAssetUrl(basePath: string, assetPath: string): string {
    const key = this.buildDocumentKey(basePath, assetPath);

    if (this.sourceConfig.source === 'local') {
      return `${this.localBasePath()}/${this.encodePath(key)}`;
    }

    return `${DOCUMENT_ENDPOINT}?key=${encodeURIComponent(key)}`;
  }

  private buildDocumentKey(basePath: string, assetPath: string): string {
    const normalizedBase = this.normalizeBasePath(basePath);
    const normalizedAsset = this.normalizeAssetPath(assetPath);

    return `${normalizedBase}${normalizedAsset}`;
  }

  private normalizeBasePath(basePath: string): string {
    const decoded = this.decodeSafePath(basePath.trim());
    if (!decoded) throw new Error('Rapid asset path is not allowed');
    if (decoded.startsWith('/')) throw new Error('Rapid asset path is not allowed');
    if (this.containsTraversalSegment(decoded)) throw new Error('Rapid asset path is not allowed');

    const normalized = this.normalizePathParts(decoded.split('/'));
    if (!normalized) throw new Error('Rapid asset path is not allowed');

    return normalized.endsWith('/') ? normalized : `${normalized}/`;
  }

  private normalizeAssetPath(assetPath: string): string {
    const decoded = this.decodeSafePath(assetPath.trim());
    if (!decoded) throw new Error('Rapid asset path is not allowed');
    if (decoded.startsWith('/')) throw new Error('Rapid asset path is not allowed');
    if (this.containsTraversalSegment(decoded)) throw new Error('Rapid asset path is not allowed');

    const normalized = this.normalizePathParts(decoded.split('/'));
    if (!normalized) throw new Error('Rapid asset path is not allowed');

    return normalized;
  }

  private decodeSafePath(path: string): string {
    if (this.hasProtocolSyntax(path)) throw new Error('Rapid asset path is not allowed');
    if (/[\\?#]/.test(path)) throw new Error('Rapid asset path is not allowed');
    if (this.containsEncodedSeparator(path)) throw new Error('Rapid asset path is not allowed');

    let decoded: string;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      throw new Error('Rapid asset path is not allowed');
    }

    if (this.hasProtocolSyntax(decoded)) throw new Error('Rapid asset path is not allowed');
    if (/[\\?#]/.test(decoded)) throw new Error('Rapid asset path is not allowed');
    if (this.containsEncodedSeparator(decoded)) throw new Error('Rapid asset path is not allowed');
    if (/%[0-9a-f]{2}/i.test(decoded)) throw new Error('Rapid asset path is not allowed');

    return decoded;
  }

  private hasProtocolSyntax(value: string): boolean {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
  }

  private containsEncodedSeparator(value: string): boolean {
    return /%2f|%5c/i.test(value);
  }

  private containsTraversalSegment(path: string): boolean {
    return path.split('/').some((part) => part === '..');
  }

  private normalizePathParts(parts: string[]): string {
    const normalized: string[] = [];

    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') {
        if (normalized.length === 0) throw new Error('Rapid asset path is not allowed');
        normalized.pop();
      } else {
        normalized.push(part);
      }
    }

    return normalized.join('/');
  }

  private localBasePath(): string {
    return this.sourceConfig.source === 'local' ? this.sourceConfig.local.basePath.replace(/\/+$/, '') : '';
  }

  private encodePath(path: string): string {
    return path
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
  }
}
