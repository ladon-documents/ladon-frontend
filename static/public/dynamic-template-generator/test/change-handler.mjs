import {
	extractKategorien,
	filterBriefeByKategorie,
	filterBriefeByLKZ,
	isKategorieForPrivatanschrift,
	isKategorieForReinitialising,
	sortAscending,
} from "./logic.mjs";

export function createSearchFormChangeHandler(state, deps) {
	return async function onSearchFormChange(event) {
		event.preventDefault();
		const { target } = event;
		const form = target.closest("form");
		const hasChangedVB = target.id === "vbnummer";
		const hasChangedKategorie = target.id === "kategorie";
		const hasChangedBrief = target.id === "brief";
		const hasChangedAnschrift = target.id === "anschrift";

		const currentFormData = new FormData(form);
		state.setFormData(currentFormData);

		if ((currentFormData.has("vbnummer") && hasChangedVB) || (currentFormData.has("anschrift") && hasChangedAnschrift)) {
			deps.spinner.show();
			try {
				const response = await deps.getDocument(
					"db2-rest-api",
					`stammdatenv2_${currentFormData.get("vbnummer")}_${currentFormData.get("anschrift")}.json`,
				);

				if (response.StatusCode === 200) {
					const data = await deps.resolveStammdatenToJson(response["Output Parameters"]);
					state.setDataPayload(data);
					deps.toggleInfoInput(data.info);
				}

				const briefe = await deps.getJsonList("onlinebriefe-ui", "", false);
				const briefeFiltered = filterBriefeByLKZ(briefe, state.getStammdatenPayload()?.UULKZ);

				if (JSON.stringify(state.getBriefePayload()) === JSON.stringify(briefeFiltered)) {
					await deps.retrieveTemplateDataAndSet();
					return;
				}

				state.setBriefePayload(briefeFiltered);
				const kategorien = extractKategorien(briefe);

				if (!isKategorieForReinitialising(currentFormData.get("kategorie"))) {
					await deps.retrieveTemplateDataAndSet();
					return;
				}

				if (briefeFiltered.length > 1) {
					await deps.generateOptionsFromPayload("select#brief", undefined);
				}

				await deps.generateOptionsFromPayload(
					"select#kategorie",
					kategorien.sort((a, b) => sortAscending(a, b)),
				);
				deps.disableAllFormActionButtons();
			} catch (e) {
				deps.handleError(e);
				deps.disableAllFormActionButtons();
			} finally {
				deps.spinner.hide();
			}
		}

		if (currentFormData.has("kategorie") && hasChangedKategorie) {
			if (isKategorieForPrivatanschrift(currentFormData.get("kategorie"))) {
				currentFormData.set("anschrift", "P");
				deps.searchForm.querySelector("select#anschrift").value = currentFormData.get("anschrift");

				deps.spinner.show();
				try {
					const response = await deps.getDocument(
						"db2-rest-api",
						`stammdatenv2_${currentFormData.get("vbnummer")}_${currentFormData.get("anschrift")}.json`,
					);

					if (response.StatusCode === 200) {
						const data = await deps.resolveStammdatenToJson(response["Output Parameters"]);
						state.setDataPayload(data);
						deps.toggleInfoInput(data.info);
					}
				} catch (e) {
					deps.handleError(e);
					deps.disableAllFormActionButtons();
				} finally {
					deps.spinner.hide();
				}
			}

			const filteredBriefe = filterBriefeByKategorie(state.getBriefePayload(), currentFormData.get("kategorie")).sort(
				(a, b) => sortAscending(a.titel, b.titel),
			);

			await deps.generateOptionsFromPayload("select#brief", filteredBriefe);
		}

		if (currentFormData.has("brief") && hasChangedBrief) {
			await deps.retrieveTemplateDataAndSet();
		}
	};
}
