const test = require("node:test");
const assert = require("node:assert/strict");

let cachedModules;

async function loadModules() {
	if (!cachedModules) {
		const logic = await import("./test/logic.mjs");
		const changeHandler = await import("./test/change-handler.mjs");
		cachedModules = { ...logic, ...changeHandler };
	}

	return cachedModules;
}

function createTestContext(overrides = {}) {
	let briefePayload = overrides.briefePayload || [];
	let formData;
	let dataPayload;
	let stammdatenPayload = overrides.stammdatenPayload || { UULKZ: 49 };

	const calls = {
		getDocument: [],
		getJsonList: [],
		generateOptionsFromPayload: [],
		retrieveTemplateDataAndSet: 0,
		handleError: [],
		disableAllFormActionButtons: 0,
		toggleInfoInput: [],
		spinnerShow: 0,
		spinnerHide: 0,
	};

	const searchForm = {
		anschriftSelect: { value: "Z" },
		querySelector(selector) {
			if (selector === "select#anschrift") {
				return this.anschriftSelect;
			}
			throw new Error(`Unknown selector: ${selector}`);
		},
	};

	const state = {
		getBriefePayload: () => briefePayload,
		setBriefePayload: (payload) => {
			briefePayload = payload;
		},
		setFormData: (payload) => {
			formData = payload;
		},
		getStammdatenPayload: () => stammdatenPayload,
		setDataPayload: (payload) => {
			dataPayload = payload;
		},
	};

	const deps = {
		searchForm,
		spinner: {
			show: () => {
				calls.spinnerShow += 1;
			},
			hide: () => {
				calls.spinnerHide += 1;
			},
		},
		getDocument: async (bucket, key) => {
			calls.getDocument.push([bucket, key]);
			if (overrides.getDocumentError) {
				throw overrides.getDocumentError;
			}
			return (
				overrides.getDocumentResponse || {
					StatusCode: 200,
					"Output Parameters": {
						INFO: "Hinweis",
					},
				}
			);
		},
		getJsonList: async (bucket, prefix, asMap) => {
			calls.getJsonList.push([bucket, prefix, asMap]);
			if (overrides.getJsonListError) {
				throw overrides.getJsonListError;
			}
			return overrides.briefe || [];
		},
		resolveStammdatenToJson: async (payload) => {
			stammdatenPayload = {
				UULKZ: overrides.lkz || 49,
				...payload,
			};
			return overrides.resolvedData || { info: "Info" };
		},
		toggleInfoInput: (info) => {
			calls.toggleInfoInput.push(info);
		},
		disableAllFormActionButtons: () => {
			calls.disableAllFormActionButtons += 1;
		},
		retrieveTemplateDataAndSet: async () => {
			calls.retrieveTemplateDataAndSet += 1;
		},
		generateOptionsFromPayload: async (selector, payload) => {
			calls.generateOptionsFromPayload.push([selector, payload]);
		},
		handleError: (error) => {
			calls.handleError.push(error);
		},
	};

	return {
		state,
		deps,
		calls,
		searchForm,
		getDataPayload: () => dataPayload,
		getFormData: () => formData,
	};
}

function createChangeEvent(fields, targetId) {
	const form = { __fields: { ...fields } };
	const target = {
		id: targetId,
		closest: () => form,
	};

	return {
		target,
		preventDefault() {},
	};
}

const OriginalFormData = global.FormData;

class MockFormData {
	constructor(form) {
		this.form = form;
		this.map = new Map(Object.entries(form.__fields || {}));
	}

	has(name) {
		return this.map.has(name);
	}

	get(name) {
		return this.map.get(name);
	}

	set(name, value) {
		this.map.set(name, value);
		this.form.__fields[name] = value;
	}
}

test.before(() => {
	global.FormData = MockFormData;
});

test.after(() => {
	global.FormData = OriginalFormData;
});

test("sortAscending sortiert aufsteigend", async () => {
	const { sortAscending } = await loadModules();
	assert.equal(sortAscending(1, 2), -1);
	assert.equal(sortAscending(2, 1), 1);
	assert.equal(sortAscending(2, 2), 0);
});

test("Kategorie-Helfer erkennen korrekte Werte", async () => {
	const { isKategorieForPrivatanschrift, isKategorieForReinitialising } = await loadModules();
	assert.equal(isKategorieForPrivatanschrift("Sonstige"), true);
	assert.equal(isKategorieForPrivatanschrift("Antrag"), false);
	assert.equal(isKategorieForReinitialising(""), true);
	assert.equal(isKategorieForReinitialising("Antrag"), true);
	assert.equal(isKategorieForReinitialising("Sonstige"), false);
});

test("filterBriefeByLKZ filtert nur passende LKZ", async () => {
	const { filterBriefeByLKZ } = await loadModules();
	const result = filterBriefeByLKZ([{ brief: "a", lkz: [49] }, { brief: "b", lkz: [43] }, { brief: "c" }], 49);
	assert.deepEqual(
		result.map((item) => item.brief),
		["a", "c"],
	);
	assert.equal(result.length, 2);
});

test("extractKategorien dedupliziert und setzt Sonstige als Fallback", async () => {
	const { extractKategorien } = await loadModules();
	const result = extractKategorien([{ kategorie: "Antrag" }, { brief: "ohne" }, { kategorie: "Antrag" }]);
	assert.deepEqual(result.sort(), ["Antrag", "Sonstige"]);
});

test("filterBriefeByKategorie behandelt Sonstige korrekt", async () => {
	const { filterBriefeByKategorie } = await loadModules();
	const result = filterBriefeByKategorie([{ brief: "a" }, { brief: "b", kategorie: "Antrag" }], "Sonstige");
	assert.deepEqual(result, [{ brief: "a" }]);
});

test("Change auf vbnummer triggert Stammdaten- und Briefe-Flow", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const ctx = createTestContext({
		briefe: [
			{ brief: "A", titel: "Zeta", kategorie: "Antrag", lkz: [49] },
			{ brief: "B", titel: "Alpha", lkz: [49] },
		],
		lkz: 49,
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "" }, "vbnummer"));

	assert.equal(ctx.calls.getDocument.length, 1);
	assert.equal(ctx.calls.getJsonList.length, 1);
	assert.equal(ctx.calls.generateOptionsFromPayload.length, 2);
	assert.deepEqual(ctx.calls.generateOptionsFromPayload[0], ["select#brief", undefined]);
	assert.equal(ctx.calls.generateOptionsFromPayload[1][0], "select#kategorie");
	assert.equal(ctx.calls.disableAllFormActionButtons, 1);
	assert.equal(ctx.calls.spinnerShow, 1);
	assert.equal(ctx.calls.spinnerHide, 1);
});

test("Change auf anschrift triggert denselben Hauptflow", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const ctx = createTestContext({
		briefe: [{ brief: "A", titel: "A", kategorie: "Antrag", lkz: [49] }],
		lkz: 49,
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "P", kategorie: "" }, "anschrift"));

	assert.equal(ctx.calls.getDocument.length, 1);
	assert.match(ctx.calls.getDocument[0][1], /stammdatenv2_8053560_P\.json/);
});

test("Bei identischem Briefe-Payload wird nur Template neu gesetzt", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const existing = [{ brief: "A", titel: "A", kategorie: "Antrag", lkz: [49] }];
	const ctx = createTestContext({
		briefe: existing,
		briefePayload: existing,
		lkz: 49,
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "" }, "vbnummer"));

	assert.equal(ctx.calls.retrieveTemplateDataAndSet, 1);
	assert.equal(ctx.calls.generateOptionsFromPayload.length, 0);
});

test("Bei nicht reinitialisierender Kategorie wird nur Template geladen", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const ctx = createTestContext({
		briefe: [{ brief: "A", titel: "A", kategorie: "Antrag", lkz: [49] }],
		lkz: 49,
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "Sonstige" }, "vbnummer"));

	assert.equal(ctx.calls.retrieveTemplateDataAndSet, 1);
	assert.equal(ctx.calls.generateOptionsFromPayload.length, 0);
});

test("Fehler im VB-Flow ruft Error-Handler und Disable auf", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const boom = new Error("Boom");
	const ctx = createTestContext({
		getDocumentError: boom,
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "" }, "vbnummer"));

	assert.equal(ctx.calls.handleError.length, 1);
	assert.equal(ctx.calls.handleError[0], boom);
	assert.equal(ctx.calls.disableAllFormActionButtons, 1);
	assert.equal(ctx.calls.spinnerHide, 1);
});

test("Kategorie-Change auf Privatanschrift setzt anschrift auf P und lädt Stammdaten neu", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const ctx = createTestContext({
		briefePayload: [
			{ brief: "b", titel: "B", kategorie: "Strukturänderung" },
			{ brief: "a", titel: "A", kategorie: "Strukturänderung" },
		],
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "Strukturänderung" }, "kategorie"));

	assert.equal(ctx.searchForm.anschriftSelect.value, "P");
	assert.equal(ctx.calls.getDocument.length, 1);
	assert.match(ctx.calls.getDocument[0][1], /stammdatenv2_8053560_P\.json/);
	assert.equal(ctx.calls.generateOptionsFromPayload.length, 1);
	assert.equal(ctx.calls.generateOptionsFromPayload[0][0], "select#brief");
	assert.deepEqual(
		ctx.calls.generateOptionsFromPayload[0][1].map((brief) => brief.titel),
		["A", "B"],
	);
});

test("Kategorie Sonstige enthält nur Briefe ohne kategorie", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const ctx = createTestContext({
		briefePayload: [
			{ brief: "a", titel: "A" },
			{ brief: "b", titel: "B", kategorie: "Antrag" },
		],
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "Sonstige" }, "kategorie"));

	assert.deepEqual(ctx.calls.generateOptionsFromPayload[0], ["select#brief", [{ brief: "a", titel: "A" }]]);
});

test("Brief-Change lädt Template", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const ctx = createTestContext();
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ brief: "A" }, "brief"));

	assert.equal(ctx.calls.retrieveTemplateDataAndSet, 1);
	assert.equal(ctx.calls.getDocument.length, 0);
});

test("Fehler bei Kategorie-Privatanschrift-Refetch ruft Error-Handler auf", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const boom = new Error("Stammdaten nicht gefunden");
	const ctx = createTestContext({
		briefePayload: [{ brief: "a", titel: "A", kategorie: "Strukturänderung" }],
		getDocumentError: boom,
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "Strukturänderung" }, "kategorie"));

	assert.equal(ctx.calls.handleError.length, 1);
	assert.equal(ctx.calls.handleError[0], boom);
	assert.equal(ctx.calls.disableAllFormActionButtons, 1);
	assert.equal(ctx.calls.spinnerHide, 1);
});

test("Kategorie-Change ohne Privatanschrift triggert nur Brief-Filter", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const ctx = createTestContext({
		briefePayload: [
			{ brief: "a", titel: "A", kategorie: "Antrag" },
			{ brief: "b", titel: "B", kategorie: "Antrag" },
		],
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "Antrag" }, "kategorie"));

	assert.equal(ctx.calls.getDocument.length, 0);
	assert.equal(ctx.calls.generateOptionsFromPayload.length, 1);
	assert.equal(ctx.calls.generateOptionsFromPayload[0][0], "select#brief");
});

test("Spinner wird bei jedem Flow gezeigt und versteckt", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const ctx = createTestContext({
		briefe: [{ brief: "A", titel: "A", lkz: [49] }],
		lkz: 49,
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "" }, "vbnummer"));

	assert.ok(ctx.calls.spinnerShow > 0);
	assert.ok(ctx.calls.spinnerHide > 0);
});

test("Multiple Change-Events kombinieren Stammdaten- und Kategorie-Updates", async () => {
	const { createSearchFormChangeHandler } = await loadModules();
	const ctx = createTestContext({
		briefe: [
			{ brief: "a", titel: "A", kategorie: "Antrag", lkz: [49] },
			{ brief: "b", titel: "B", kategorie: "Sonstige", lkz: [49] },
		],
		lkz: 49,
	});
	const handler = createSearchFormChangeHandler(ctx.state, ctx.deps);

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "Antrag" }, "vbnummer"));
	const initialGenerateOptionsCalls = ctx.calls.generateOptionsFromPayload.length;

	await handler(createChangeEvent({ vbnummer: "8053560", anschrift: "Z", kategorie: "Sonstige" }, "kategorie"));

	assert.ok(ctx.calls.generateOptionsFromPayload.length > initialGenerateOptionsCalls);
});
