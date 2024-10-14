import { ladonApi } from "./ladon-api";

describe("ladonApi", () => {
	it("should work", () => {
		expect(ladonApi()).toEqual("ladon-api");
	});
});
