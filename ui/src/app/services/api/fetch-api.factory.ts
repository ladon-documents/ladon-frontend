import { Injectable } from '@angular/core';
import { auth, fetchClient, pluginFetchClient } from '@ladon/api';
import { catchError, defer, from, mergeMap, Observable, throwError } from 'rxjs';

const ADMIN_BASE_PATH = '/admin';
const PLUGIN_BASE_PATH = 'https://plugins.mind-consulting.de';

export interface FetchApiError {
  status: number;
  error: {
    reason: string;
    [key: string]: unknown;
  };
  message: string;
  body: unknown;
  response: Response;
  cause: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class FetchApiFactory {
  private readonly mainConfiguration = auth.createAuthenticatedConfiguration({
    basePath: ADMIN_BASE_PATH,
  });

  private readonly pluginConfiguration = new pluginFetchClient.Configuration({
    basePath: PLUGIN_BASE_PATH,
    middleware: [auth.createAuthMiddleware({ skipUrls: ['/auth/login'] })],
  });

  readonly authControllerApi = new fetchClient.AuthControllerApi(this.mainConfiguration);
  readonly userControllerApi = new fetchClient.UserControllerApi(this.mainConfiguration);
  readonly documentsApi = new fetchClient.DocumentsApi(this.mainConfiguration);
  readonly converterApi = new fetchClient.ConverterApi(this.mainConfiguration);
  readonly tasksApi = new fetchClient.TasksApi(this.mainConfiguration);
  readonly uiApi = new fetchClient.UIApi(this.mainConfiguration);
  readonly bucketsApi = new fetchClient.BucketsApi(this.mainConfiguration);
  readonly usermanagerApi = new fetchClient.UsermanagerApi(this.mainConfiguration);
  readonly tagmanagerApi = new fetchClient.TagmanagerApi(this.mainConfiguration);
  readonly transactionApi = new fetchClient.TransactionApi(this.mainConfiguration);
  readonly pluginmanagerApi = new fetchClient.PluginmanagerApi(this.mainConfiguration);
  readonly pluginV1Api = new pluginFetchClient.V1Api(this.pluginConfiguration);

  fromApi<T>(request: () => Promise<T>): Observable<T> {
    return defer(request).pipe(
      catchError((error) =>
        from(this.normalizeApiError(error)).pipe(mergeMap((normalizedError) => throwError(() => normalizedError))),
      ),
    );
  }

  private async normalizeApiError(error: unknown): Promise<unknown> {
    const response = this.getResponse(error);

    if (!response) {
      return error;
    }

    const bodyText = await this.readResponseBody(response);
    const body = this.parseResponseBody(bodyText);
    const message = this.getErrorMessage(error);
    const reason = this.getErrorReason(body, message);

    return {
      status: response.status,
      error: typeof body === 'object' && body !== null ? { reason, ...body } : { reason },
      message: reason,
      body,
      response,
      cause: error,
    } satisfies FetchApiError;
  }

  private getResponse(error: unknown): Response | null {
    if (typeof error !== 'object' || error === null || !('response' in error)) {
      return null;
    }

    const response = (error as { response?: unknown }).response;
    return response instanceof Response ? response : null;
  }

  private async readResponseBody(response: Response): Promise<string> {
    try {
      return await response.clone().text();
    } catch {
      try {
        return await response.text();
      } catch {
        return '';
      }
    }
  }

  private parseResponseBody(bodyText: string): unknown {
    if (!bodyText) {
      return null;
    }

    try {
      return JSON.parse(bodyText);
    } catch {
      return bodyText;
    }
  }

  private getErrorMessage(error: unknown): string {
    return typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : 'Response returned an error code';
  }

  private getErrorReason(body: unknown, fallback: string): string {
    if (typeof body === 'object' && body !== null) {
      const reason = (body as { reason?: unknown }).reason;
      if (typeof reason === 'string' && reason) {
        return reason;
      }

      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message) {
        return message;
      }

      const error = (body as { error?: unknown }).error;
      if (typeof error === 'string' && error) {
        return error;
      }
    }

    return typeof body === 'string' && body ? body : fallback;
  }
}
