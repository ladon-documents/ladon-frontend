const create = () => {
	const spinnerEl = document.createElement("div");
	spinnerEl.setAttribute("id", "ladon-spinner");
	return spinnerEl;
};

export const LadonSpinner = {
	show() {
		const spinner = create();
		const wrapper = document.createElement("div");
		wrapper.setAttribute("id", "ladon-spinner-backdrop");
		wrapper.appendChild(spinner);
		document.body.insertAdjacentElement("afterbegin", wrapper);
	},

	getSpinnerElement() {
		return create();
	},

	hide() {
		const elem = document.querySelector("#ladon-spinner-backdrop");
		if (elem) {
			elem.parentNode.removeChild(elem);
		}
	},
};
