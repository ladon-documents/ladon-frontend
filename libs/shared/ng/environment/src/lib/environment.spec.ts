import { environment } from "./environment";

describe("environment", () => {
	it("should work", () => {
		expect(environment()).toEqual("environment");
	});
});
