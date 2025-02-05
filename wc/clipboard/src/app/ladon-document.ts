export interface DocumentMetadata {
  /**
   *
   * @type {boolean}
   * @memberof DocumentMetadata
   */
  Etag?: string;
  'content-type'?: string;
  txtId?: string;
}

export interface LadonDocument {
  /**
   *
   * @type {string}
   * @memberof Document
   */
  contentType?: string;
  /**
   *
   * @type {string}
   * @memberof Document
   */
  created?: string;
  /**
   *
   * @type {string}
   * @memberof Document
   */
  lastModified?: string;
  /**
   *
   * @type {string}
   * @memberof Document
   */
  bucket?: string;
  /**
   *
   * @type {string}
   * @memberof Document
   */
  key?: string;
  /**
   *
   * @type {string}
   * @memberof Document
   */
  path: string;
  /**
   *
   * @type {string}
   * @memberof Document
   */
  etag?: string;
  /**
   *
   * @type {DocumentMetadata}
   * @memberof Document
   */
  metadata?: DocumentMetadata;
  /**
   *
   * @type {string}
   * @memberof Document
   */
  owner?: string;
  /**
   *
   * @type {number}
   * @memberof Document
   */
  size?: number;
  /**
   *
   * @type {string}
   * @memberof Document
   */
  version?: string;

  name?: string;
}
