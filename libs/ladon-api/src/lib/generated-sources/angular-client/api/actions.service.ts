/**
 * Ladon Datacenter Edition
 * Ladon Datacenter Edition REST API
 *
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional } from "@angular/core";
import {
	HttpClient,
	HttpHeaders,
	HttpParams,
	HttpResponse,
	HttpEvent,
	HttpParameterCodec,
	HttpContext,
} from "@angular/common/http";
import { CustomHttpParameterCodec } from "../encoder";
import { Observable } from "rxjs";

// @ts-ignore
import { DocumentAction } from "../model/documentAction";
// @ts-ignore
import { ResponseSuccess } from "../model/responseSuccess";

// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS } from "../variables";
import { Configuration } from "../configuration";

@Injectable({
	providedIn: "root",
})
export class ActionsService {
	protected basePath = "/admin";
	public defaultHeaders = new HttpHeaders();
	public configuration = new Configuration();
	public encoder: HttpParameterCodec;

	constructor(
		protected httpClient: HttpClient,
		@Optional() @Inject(BASE_PATH) basePath: string | string[],
		@Optional() configuration: Configuration
	) {
		if (configuration) {
			this.configuration = configuration;
		}
		if (typeof this.configuration.basePath !== "string") {
			const firstBasePath = Array.isArray(basePath) ? basePath[0] : undefined;
			if (firstBasePath != undefined) {
				basePath = firstBasePath;
			}

			if (typeof basePath !== "string") {
				basePath = this.basePath;
			}
			this.configuration.basePath = basePath;
		}
		this.encoder = this.configuration.encoder || new CustomHttpParameterCodec();
	}

	// @ts-ignore
	private addToHttpParams(httpParams: HttpParams, value: any, key?: string): HttpParams {
		if (typeof value === "object" && value instanceof Date === false) {
			httpParams = this.addToHttpParamsRecursive(httpParams, value);
		} else {
			httpParams = this.addToHttpParamsRecursive(httpParams, value, key);
		}
		return httpParams;
	}

	private addToHttpParamsRecursive(httpParams: HttpParams, value?: any, key?: string): HttpParams {
		if (value == null) {
			return httpParams;
		}

		if (typeof value === "object") {
			if (Array.isArray(value)) {
				(value as any[]).forEach((elem) => (httpParams = this.addToHttpParamsRecursive(httpParams, elem, key)));
			} else if (value instanceof Date) {
				if (key != null) {
					httpParams = httpParams.append(key, (value as Date).toISOString().substring(0, 10));
				} else {
					throw Error("key may not be null if value is Date");
				}
			} else {
				Object.keys(value).forEach(
					(k) => (httpParams = this.addToHttpParamsRecursive(httpParams, value[k], key != null ? `${key}.${k}` : k))
				);
			}
		} else if (key != null) {
			httpParams = httpParams.append(key, value);
		} else {
			throw Error("key may not be null if value is not object or array");
		}
		return httpParams;
	}

	/**
	 * @param context
	 * @param documentAction
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public acceptDocumentActions(
		context: string,
		documentAction: DocumentAction,
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<ResponseSuccess>;
	public acceptDocumentActions(
		context: string,
		documentAction: DocumentAction,
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<ResponseSuccess>>;
	public acceptDocumentActions(
		context: string,
		documentAction: DocumentAction,
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<ResponseSuccess>>;
	public acceptDocumentActions(
		context: string,
		documentAction: DocumentAction,
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
		if (context === null || context === undefined) {
			throw new Error("Required parameter context was null or undefined when calling acceptDocumentActions.");
		}
		if (documentAction === null || documentAction === undefined) {
			throw new Error("Required parameter documentAction was null or undefined when calling acceptDocumentActions.");
		}

		let localVarQueryParameters = new HttpParams({ encoder: this.encoder });
		if (context !== undefined && context !== null) {
			localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>context, "context");
		}

		let localVarHeaders = this.defaultHeaders;

		let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
		if (localVarHttpHeaderAcceptSelected === undefined) {
			// to determine the Accept header
			const httpHeaderAccepts: string[] = ["application/json"];
			localVarHttpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts);
		}
		if (localVarHttpHeaderAcceptSelected !== undefined) {
			localVarHeaders = localVarHeaders.set("Accept", localVarHttpHeaderAcceptSelected);
		}

		let localVarHttpContext: HttpContext | undefined = options && options.context;
		if (localVarHttpContext === undefined) {
			localVarHttpContext = new HttpContext();
		}

		let localVarTransferCache: boolean | undefined = options && options.transferCache;
		if (localVarTransferCache === undefined) {
			localVarTransferCache = true;
		}

		// to determine the Content-Type header
		const consumes: string[] = ["application/json"];
		const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
		if (httpContentTypeSelected !== undefined) {
			localVarHeaders = localVarHeaders.set("Content-Type", httpContentTypeSelected);
		}

		let responseType_: "text" | "json" | "blob" = "json";
		if (localVarHttpHeaderAcceptSelected) {
			if (localVarHttpHeaderAcceptSelected.startsWith("text")) {
				responseType_ = "text";
			} else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
				responseType_ = "json";
			} else {
				responseType_ = "blob";
			}
		}

		let localVarPath = `/api/rest/v1/meta/actions`;
		return this.httpClient.request<ResponseSuccess>("post", `${this.configuration.basePath}${localVarPath}`, {
			context: localVarHttpContext,
			body: documentAction,
			params: localVarQueryParameters,
			responseType: <any>responseType_,
			withCredentials: this.configuration.withCredentials,
			headers: localVarHeaders,
			observe: observe,
			transferCache: localVarTransferCache,
			reportProgress: reportProgress,
		});
	}

	/**
	 * @param context
	 * @param paths
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public getDocumentActions(
		context: string,
		paths: Array<string>,
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<Array<DocumentAction>>;
	public getDocumentActions(
		context: string,
		paths: Array<string>,
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<Array<DocumentAction>>>;
	public getDocumentActions(
		context: string,
		paths: Array<string>,
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<Array<DocumentAction>>>;
	public getDocumentActions(
		context: string,
		paths: Array<string>,
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
		if (context === null || context === undefined) {
			throw new Error("Required parameter context was null or undefined when calling getDocumentActions.");
		}
		if (paths === null || paths === undefined) {
			throw new Error("Required parameter paths was null or undefined when calling getDocumentActions.");
		}

		let localVarQueryParameters = new HttpParams({ encoder: this.encoder });
		if (context !== undefined && context !== null) {
			localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>context, "context");
		}
		if (paths) {
			paths.forEach((element) => {
				localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>element, "paths");
			});
		}

		let localVarHeaders = this.defaultHeaders;

		let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
		if (localVarHttpHeaderAcceptSelected === undefined) {
			// to determine the Accept header
			const httpHeaderAccepts: string[] = ["application/json"];
			localVarHttpHeaderAcceptSelected = this.configuration.selectHeaderAccept(httpHeaderAccepts);
		}
		if (localVarHttpHeaderAcceptSelected !== undefined) {
			localVarHeaders = localVarHeaders.set("Accept", localVarHttpHeaderAcceptSelected);
		}

		let localVarHttpContext: HttpContext | undefined = options && options.context;
		if (localVarHttpContext === undefined) {
			localVarHttpContext = new HttpContext();
		}

		let localVarTransferCache: boolean | undefined = options && options.transferCache;
		if (localVarTransferCache === undefined) {
			localVarTransferCache = true;
		}

		let responseType_: "text" | "json" | "blob" = "json";
		if (localVarHttpHeaderAcceptSelected) {
			if (localVarHttpHeaderAcceptSelected.startsWith("text")) {
				responseType_ = "text";
			} else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
				responseType_ = "json";
			} else {
				responseType_ = "blob";
			}
		}

		let localVarPath = `/api/rest/v1/meta/actions`;
		return this.httpClient.request<Array<DocumentAction>>("get", `${this.configuration.basePath}${localVarPath}`, {
			context: localVarHttpContext,
			params: localVarQueryParameters,
			responseType: <any>responseType_,
			withCredentials: this.configuration.withCredentials,
			headers: localVarHeaders,
			observe: observe,
			transferCache: localVarTransferCache,
			reportProgress: reportProgress,
		});
	}
}
