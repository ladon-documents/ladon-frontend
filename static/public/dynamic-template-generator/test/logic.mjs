export function sortAscending(a, b) {
	if (a > b) return 1;
	if (a < b) return -1;
	return 0;
}

export function isKategorieForPrivatanschrift(kategorie) {
	return ["Sonstige", "Strukturänderung", "VB-Kündigungsbriefe", "VM-Kündigungsbriefe"].includes(kategorie);
}

export function isKategorieForReinitialising(kategorie) {
	return ["", "Antrag"].includes(kategorie);
}

export function filterBriefeByLKZ(briefe, lkz) {
	if (!(briefe instanceof Array)) {
		return [];
	}

	return briefe.filter((brief) => {
		if (brief.lkz instanceof Array) {
			return brief.lkz.includes(lkz);
		}

		return true;
	});
}

export function extractKategorien(briefe) {
	if (!(briefe instanceof Array)) {
		return [];
	}

	return [
		...new Set(
			briefe.map((brief) => {
				if ("kategorie" in brief) {
					return brief.kategorie;
				}

				return "Sonstige";
			}),
		),
	];
}

export function filterBriefeByKategorie(briefePayload, kategorie) {
	if (!(briefePayload instanceof Array)) {
		return [];
	}

	return briefePayload.filter(
		(brief) => (kategorie === "Sonstige" && !("kategorie" in brief)) || brief.kategorie === kategorie,
	);
}
