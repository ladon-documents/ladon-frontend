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

export interface User {
	userId: string;
	fullName: string;
	email: string;
	roles: Array<string>;
	imageUrl?: string;
	provider?: string;
	emailVerified: string;
	homeBucket: string;
}
