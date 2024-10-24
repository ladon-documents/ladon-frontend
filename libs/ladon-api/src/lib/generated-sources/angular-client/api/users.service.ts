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
import { User } from "../model/user";

// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS } from "../variables";
import { Configuration } from "../configuration";

@Injectable({
	providedIn: "root",
})
export class UsersService {
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
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public getAllowableActions(
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<{ [key: string]: object }>;
	public getAllowableActions(
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<{ [key: string]: object }>>;
	public getAllowableActions(
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<{ [key: string]: object }>>;
	public getAllowableActions(
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
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

		let localVarPath = `/user/allowableactions`;
		return this.httpClient.request<{ [key: string]: object }>("get", `${this.configuration.basePath}${localVarPath}`, {
			context: localVarHttpContext,
			responseType: <any>responseType_,
			withCredentials: this.configuration.withCredentials,
			headers: localVarHeaders,
			observe: observe,
			transferCache: localVarTransferCache,
			reportProgress: reportProgress,
		});
	}

	/**
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public getCurrentUser(
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<User>;
	public getCurrentUser(
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<User>>;
	public getCurrentUser(
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<User>>;
	public getCurrentUser(
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
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

		let localVarPath = `/user/me`;
		return this.httpClient.request<User>("get", `${this.configuration.basePath}${localVarPath}`, {
			context: localVarHttpContext,
			responseType: <any>responseType_,
			withCredentials: this.configuration.withCredentials,
			headers: localVarHeaders,
			observe: observe,
			transferCache: localVarTransferCache,
			reportProgress: reportProgress,
		});
	}

	/**
	 * @param userId
	 * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
	 * @param reportProgress flag to report request and response progress.
	 */
	public getPicture(
		userId: string,
		observe?: "body",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<Array<string>>;
	public getPicture(
		userId: string,
		observe?: "response",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpResponse<Array<string>>>;
	public getPicture(
		userId: string,
		observe?: "events",
		reportProgress?: boolean,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<HttpEvent<Array<string>>>;
	public getPicture(
		userId: string,
		observe: any = "body",
		reportProgress: boolean = false,
		options?: { httpHeaderAccept?: "*/*"; context?: HttpContext; transferCache?: boolean }
	): Observable<any> {
		if (userId === null || userId === undefined) {
			throw new Error("Required parameter userId was null or undefined when calling getPicture.");
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

		let localVarPath = `/user/${this.configuration.encodeParam({
			name: "userId",
			value: userId,
			in: "path",
			style: "simple",
			explode: false,
			dataType: "string",
			dataFormat: undefined,
		})}/picture`;
		return this.httpClient.request<Array<string>>("get", `${this.configuration.basePath}${localVarPath}`, {
			context: localVarHttpContext,
			responseType: <any>responseType_,
			withCredentials: this.configuration.withCredentials,
			headers: localVarHeaders,
			observe: observe,
			transferCache: localVarTransferCache,
			reportProgress: reportProgress,
		});
	}
}
