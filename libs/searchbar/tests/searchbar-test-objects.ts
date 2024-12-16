import { default as SearchGroupSchema } from "./schema/search-group.json";
import { default as SearchGroupMock } from "./search-item-group.json";
import Ajv, { JSONSchemaType } from "ajv";

export class SearchbarTestObject {
	private ajv = new Ajv();

	compileAndValidateSchema() {
		const validate = this.ajv.compile(SearchGroupSchema);

		if (validate(this.retrieveSearchGroupMock())) {
			return this.retrieveSearchGroupMock();
		} else {
			throw TypeError(`JSON file is not valid: ${validate.errors}`);
		}
	}

	retrieveSearchGroupMock() {
		return SearchGroupMock;
	}
}
