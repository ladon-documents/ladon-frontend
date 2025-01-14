import {
  DocumentsApi,
  Document,
  FindDocumentPathRequest,
  GetDocumentMetaRequest,
  GetDocumentRequest,
  ListDocumentJsonRequest,
  ListDocumentMetaVersionsRequest,
  ListDocumentsRequest,
  PutDocumentMetaRequest,
  PutDocumentRequest,
  PutFolderRequest,
  ResponseSuccess,
  DeleteDocumentRequest,
} from '../ladon-api/fetch-client';

/** Document Api */
class MfLadonDocumentApiClass {
  public static getInstance() {
    if (!this.instance) {
      this.instance = new MfLadonDocumentApiClass();
      this.instance.documentApi = new DocumentsApi();
    }
    return this.instance;
  }

  private static instance?: MfLadonDocumentApiClass;
  private documentApi!: DocumentsApi;

  private constructor() {}

  deleteDocument(payload: DeleteDocumentRequest): Promise<ResponseSuccess> {
    const version = payload.version || undefined;
    return MfLadonDocumentApiClass.getInstance().documentApi.deleteDocument(payload);
  }

  getDocument(payload: GetDocumentRequest): Promise<Blob> {
    const version = payload.version || undefined;
    return MfLadonDocumentApiClass.getInstance().documentApi.getDocument(payload);
  }

  getDocumentMeta(payload: GetDocumentMetaRequest): Promise<Document> {
    return MfLadonDocumentApiClass.getInstance().documentApi.getDocumentMeta(payload);
  }

  findDocumentPath(payload: FindDocumentPathRequest): Promise<Array<string>> {
    return MfLadonDocumentApiClass.getInstance().documentApi.findDocumentPath(payload);
  }

  listDocumentJson(payload: ListDocumentJsonRequest): Promise<string> {
    return MfLadonDocumentApiClass.getInstance().documentApi.listDocumentJson(payload);
  }

  listDocumentMetaVersions(payload: ListDocumentMetaVersionsRequest): Promise<Document[]> {
    return MfLadonDocumentApiClass.getInstance().documentApi.listDocumentMetaVersions(payload);
  }

  listDocuments(payload: ListDocumentsRequest): Promise<Array<Document>> {
    return MfLadonDocumentApiClass.getInstance().documentApi.listDocuments(payload);
  }

  putDocument(payload: PutDocumentRequest): Promise<Document> {
    return MfLadonDocumentApiClass.getInstance().documentApi.putDocument(payload);
  }

  putDocumentMeta(payload: PutDocumentMetaRequest): Promise<Document> {
    return MfLadonDocumentApiClass.getInstance().documentApi.putDocumentMeta(payload);
  }

  putFolder(payload: PutFolderRequest): Promise<Document> {
    return MfLadonDocumentApiClass.getInstance().documentApi.putFolder(payload);
  }
}

export const MFLadonDocumentApi = MfLadonDocumentApiClass.getInstance();
