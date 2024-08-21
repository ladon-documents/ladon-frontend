/*
 * DEPRECATED: Since dialog support is native now
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog#browser_compatibility
 */

import dialogPolyfill from "dialog-polyfill";

export const LadonDialog = {
	create: async (dialogProps) => {
		if (!dialogProps) return;

		const defaultPropsInput = {
			input: {
				placeholder: " ",
				type: "text",
				name: " ",
			},
		};

		const html = `<dialog class="ladon-dialog">
    <div class="ladon-dialog__header">
      <div class="ladon-dialog__title"></div>
      <div class="ladon-dialog__close"><span></span></div>
  </div>
    <div class="ladon-dialog__content">
      <p></p>
    </div>
     <input class="ladon-dialog__input">
    <div class="ladon-dialog__actions">
      <button type="submit" class="save">Speichern</button>
    </div>
  </dialog>`;
		try {
			document.getElementsByTagName("body")[0].insertAdjacentHTML("beforeend", html);

			const dialog = document.querySelector("dialog");
			const title = dialog.querySelector(".ladon-dialog__title");
			const content = dialog.querySelector(".ladon-dialog__content");
			const input = dialog.querySelector(".ladon-dialog__input");
			const close = dialog.querySelector(".ladon-dialog__close");
			const save = dialog.querySelector(".save");
			title.textContent = dialogProps.title;
			content.textContent = dialogProps.content ? dialogProps.content : content.remove();
			save.textContent = dialogProps.save;
			const inp = dialogProps.input;
			inp.placeholder = inp.placeholder ? inp.placeholder : "";
			inp.type = inp.type ? inp.type : "text";
			inp.name = inp.name ? inp.name : "default";
			if (inp) {
				input.setAttribute("name", inp.name);
				input.setAttribute("placeholder", inp.placeholder);
				input.setAttribute("type", inp.type);
			} else {
				input.remove();
			}

			dialogPolyfill.registerDialog(dialog);

			dialog.showModal();

			input.addEventListener("keypress", function (e) {
				if (e.key === "Enter" && input.value !== 0) {
					dialog.close(input.value);
				}
			});

			close.addEventListener("click", function () {
				dialog.close();
			});

			save.addEventListener("click", function () {
				dialog.close(input.value);
			});

			return new Promise(function (resolve, reject) {
				dialog.addEventListener("close", (event) => {
					const elem = document.querySelector(".ladon-dialog");
					elem.parentNode.removeChild(elem);
					return resolve(dialog.returnValue);
				});
			});
		} catch (e) {
			const elem = document.querySelector(".ladon-dialog");
			if (elem) {
				elem.parentNode.removeChild(elem);
			}
		}
	},
};
