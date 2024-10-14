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
import { BASE_PATH, COLLECTION_FORMATS } from "../variables";
import { Configuration } from "../configuration";

@Injectable({
	providedIn: "root",
})
export class DownloadsService {
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

	/**
	 * @param consumes string[] mime-types
	 * @return true: consumes contains 'multipart/form-data', false: otherwise
	 */
	private canConsumeForm(consumes: string[]): boolean {
		const form = "multipart/form-data";
		for (const consume of consumes) {
			if (form === consume) {
				return true;
			}
		}
		return false;
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
	 * @param pdfPath
	 * @param text
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public addTextAsWatermarkGet(
		pdfPath: string,
		text: string,
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/pdf"; context?: HttpContext; transferCache?: boolean }
	): Observable<Array<string>>;
	public addTextAsWatermarkGet(
		pdfPath: string,
		text: string,
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/pdf"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<Array<string>>>;
	public addTextAsWatermarkGet(
		pdfPath: string,
		text: string,
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/pdf"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<Array<string>>>;
	public addTextAsWatermarkGet(
		pdfPath: string,
		text: string,
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "application/pdf"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
		if (pdfPath === null || pdfPath === undefined) {
			throw new Error("Required parameter pdfPath was null or undefined when calling addTextAsWatermarkGet.");
		}
		if (text === null || text === undefined) {
			throw new Error("Required parameter text was null or undefined when calling addTextAsWatermarkGet.");
		}

		let localVarQueryParameters = new HttpParams({ encoder: this.encoder });
		if (pdfPath !== undefined && pdfPath !== null) {
			localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>pdfPath, "pdfPath");
		}
		if (text !== undefined && text !== null) {
			localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>text, "text");
		}

		let localVarHeaders = this.defaultHeaders;

		let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
		if (localVarHttpHeaderAcceptSelected === undefined) {
			// to determine the Accept header
			const httpHeaderAccepts: string[] = ["application/pdf"];
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

		let localVarPath = `/api/rest/v1/content/addTextAsWatermark`;
		return this.httpClient.request<Array<string>>("get", `${this.configuration.basePath}${localVarPath}`, {
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

	/**
	 * @param paths
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public mergePdfDocumentsGet(
		paths: Array<string>,
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/pdf"; context?: HttpContext; transferCache?: boolean }
	): Observable<Array<string>>;
	public mergePdfDocumentsGet(
		paths: Array<string>,
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/pdf"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<Array<string>>>;
	public mergePdfDocumentsGet(
		paths: Array<string>,
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/pdf"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<Array<string>>>;
	public mergePdfDocumentsGet(
		paths: Array<string>,
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "application/pdf"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
		if (paths === null || paths === undefined) {
			throw new Error("Required parameter paths was null or undefined when calling mergePdfDocumentsGet.");
		}

		let localVarQueryParameters = new HttpParams({ encoder: this.encoder });
		if (paths) {
			paths.forEach((element) => {
				localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>element, "paths");
			});
		}

		let localVarHeaders = this.defaultHeaders;

		let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
		if (localVarHttpHeaderAcceptSelected === undefined) {
			// to determine the Accept header
			const httpHeaderAccepts: string[] = ["application/pdf"];
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

		let localVarPath = `/api/rest/v1/content/mergepdfdocuments`;
		return this.httpClient.request<Array<string>>("get", `${this.configuration.basePath}${localVarPath}`, {
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

	/**
	 * @param requestBody
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public mergePdfDocumentsPost(
		requestBody: Array<string>,
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<{ [key: string]: string }>;
	public mergePdfDocumentsPost(
		requestBody: Array<string>,
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<{ [key: string]: string }>>;
	public mergePdfDocumentsPost(
		requestBody: Array<string>,
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<{ [key: string]: string }>>;
	public mergePdfDocumentsPost(
		requestBody: Array<string>,
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
		if (requestBody === null || requestBody === undefined) {
			throw new Error("Required parameter requestBody was null or undefined when calling mergePdfDocumentsPost.");
		}

		let localVarHeaders = this.defaultHeaders;

		let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
		if (localVarHttpHeaderAcceptSelected === undefined) {
			// to determine the Accept header
			const httpHeaderAccepts: string[] = ["*/*"];
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

		let localVarPath = `/api/rest/v1/content/mergepdfdocuments`;
		return this.httpClient.request<{ [key: string]: string }>("post", `${this.configuration.basePath}${localVarPath}`, {
			context: localVarHttpContext,
			body: requestBody,
			responseType: <any>responseType_,
			withCredentials: this.configuration.withCredentials,
			headers: localVarHeaders,
			observe: observe,
			transferCache: localVarTransferCache,
			reportProgress: reportProgress,
		});
	}

	/**
	 * @param paths
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public zipDownload(
		paths: Array<string>,
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/octet-stream"; context?: HttpContext; transferCache?: boolean }
	): Observable<Array<string>>;
	public zipDownload(
		paths: Array<string>,
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/octet-stream"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<Array<string>>>;
	public zipDownload(
		paths: Array<string>,
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/octet-stream"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<Array<string>>>;
	public zipDownload(
		paths: Array<string>,
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "application/octet-stream"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
		if (paths === null || paths === undefined) {
			throw new Error("Required parameter paths was null or undefined when calling zipDownload.");
		}

		let localVarQueryParameters = new HttpParams({ encoder: this.encoder });
		if (paths) {
			paths.forEach((element) => {
				localVarQueryParameters = this.addToHttpParams(localVarQueryParameters, <any>element, "paths");
			});
		}

		let localVarHeaders = this.defaultHeaders;

		let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
		if (localVarHttpHeaderAcceptSelected === undefined) {
			// to determine the Accept header
			const httpHeaderAccepts: string[] = ["application/octet-stream"];
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

		let localVarPath = `/api/rest/v1/content/zipdownload`;
		return this.httpClient.request<Array<string>>("get", `${this.configuration.basePath}${localVarPath}`, {
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

	/**
	 * @param requestBody
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public zipDownloadPost(
		requestBody: Array<string>,
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<{ [key: string]: string }>;
	public zipDownloadPost(
		requestBody: Array<string>,
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<{ [key: string]: string }>>;
	public zipDownloadPost(
		requestBody: Array<string>,
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<{ [key: string]: string }>>;
	public zipDownloadPost(
		requestBody: Array<string>,
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
		if (requestBody === null || requestBody === undefined) {
			throw new Error("Required parameter requestBody was null or undefined when calling zipDownloadPost.");
		}

		let localVarHeaders = this.defaultHeaders;

		let localVarHttpHeaderAcceptSelected: string | undefined = options && options.httpHeaderAccept;
		if (localVarHttpHeaderAcceptSelected === undefined) {
			// to determine the Accept header
			const httpHeaderAccepts: string[] = ["*/*"];
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

		let localVarPath = `/api/rest/v1/content/zipdownload`;
		return this.httpClient.request<{ [key: string]: string }>("post", `${this.configuration.basePath}${localVarPath}`, {
			context: localVarHttpContext,
			body: requestBody,
			responseType: <any>responseType_,
			withCredentials: this.configuration.withCredentials,
			headers: localVarHeaders,
			observe: observe,
			transferCache: localVarTransferCache,
			reportProgress: reportProgress,
		});
	}

	/**
	 * @param bucket
	 * @param content
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public zipUpload(
		bucket: string,
		content?: Blob,
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<{ [key: string]: number }>;
	public zipUpload(
		bucket: string,
		content?: Blob,
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<{ [key: string]: number }>>;
	public zipUpload(
		bucket: string,
		content?: Blob,
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<{ [key: string]: number }>>;
	public zipUpload(
		bucket: string,
		content?: Blob,
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "application/json"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
		if (bucket === null || bucket === undefined) {
			throw new Error("Required parameter bucket was null or undefined when calling zipUpload.");
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
		const consumes: string[] = ["multipart/form-data"];

		const canConsumeForm = this.canConsumeForm(consumes);

		let localVarFormParams: { append(param: string, value: any): any };
		let localVarUseForm = false;
		let localVarConvertFormParamsToString = false;
		// use FormData to transmit files using content-type "multipart/form-data"
		// see https://stackoverflow.com/questions/4007969/application-x-www-form-urlencoded-or-multipart-form-data
		localVarUseForm = canConsumeForm;
		if (localVarUseForm) {
			localVarFormParams = new FormData();
		} else {
			localVarFormParams = new HttpParams({ encoder: this.encoder });
		}

		if (content !== undefined) {
			localVarFormParams = (localVarFormParams.append("content", <any>content) as any) || localVarFormParams;
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

		let localVarPath = `/api/rest/v1/content/zipupload/${this.configuration.encodeParam({
			name: "bucket",
			value: bucket,
			in: "path",
			style: "simple",
			explode: false,
			dataType: "string",
			dataFormat: undefined,
		})}`;
		return this.httpClient.request<{ [key: string]: number }>("put", `${this.configuration.basePath}${localVarPath}`, {
			context: localVarHttpContext,
			body: localVarConvertFormParamsToString ? localVarFormParams.toString() : localVarFormParams,
			responseType: <any>responseType_,
			withCredentials: this.configuration.withCredentials,
			headers: localVarHeaders,
			observe: observe,
			transferCache: localVarTransferCache,
			reportProgress: reportProgress,
		});
	}
}
