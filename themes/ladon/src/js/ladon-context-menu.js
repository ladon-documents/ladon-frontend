export class LadonContextMenu {
	node = undefined;
	configMap = new Map();

	#render() {
		this.node = document.createElement("div");
		this.node.setAttribute("id", "ladon-context-wrapper");
		this.node.innerHTML = this.#getHtml();
		document.body.appendChild(this.node);
	}

	#remove() {
		this.node.remove();
		this.node = undefined;
		this.#dispatchContextEvent(undefined, "remove");
	}

	/**
	 * private @function #updatePosition
	 * Updates context menu position by css variable change
	 */
	#updatePosition(positionConfig) {
		const div = document.getElementById("ladon-context-wrapper");
		if (positionConfig instanceof Object) {
			div.style.setProperty("--ladon-context-position-x", `${positionConfig.pageX + 10}px`);
			div.style.setProperty("--ladon-context-position-y", `${positionConfig.pageY + 10}px`);
		}
	}

	/**
	 * private @function #getHtml
	 * Returns the available dom including template
	 */
	#getHtml() {
		return `
      <ul id='ladon-context-content'></ul>
      <template id='ladon-context-template'>
        <li class='ladon-context-item'>
          <div>
            <img class="ladon-context-item__icon" />
            <span class="ladon-context-item__text"></span>
          </div>
          <span class="ladon-context-item__shortcut"></span>
        </li>
      </template>
    `;
	}

	#isContextMenuHidden() {
		return this.node ? this.node.hidden : true;
	}

	#dispatchContextEvent(detail, type) {
		const ce = new CustomEvent(`ladon-context-${type}`, { detail });
		document.dispatchEvent(ce);
	}

	#contextMenuCallback(event) {
		event.preventDefault();
		const { pageX, pageY, currentTarget } = event;
		if (!this.#isContextMenuHidden()) {
			this.#remove();
		}
		this.#render();
		this.#updatePosition({ pageX, pageY });
		this.#dispatchContextEvent(currentTarget, "menu");
	}

	#contextItemCallback(itemConfig, bucket) {
		this.#dispatchContextEvent({ itemConfig, bucket }, "item");
	}

	init(element) {
		if (element instanceof HTMLCollection || element instanceof NodeList || element instanceof Element) {
			const root = document.documentElement;
			root.addEventListener(
				"click",
				(event) => {
					const { target } = event;
					if (!this.#isContextMenuHidden()) {
						if (target.className === "ladon-context-item") {
							const label = target.querySelector(".ladon-context-item__text").innerText;
							const config = this.configMap.get(label);
							this.#contextItemCallback(config, this.configMap.get("bucket"));
						}

						this.#remove();
					}
				},
				false
			);

			root.addEventListener(
				"keyup",
				(event) => {
					const { target, keyCode } = event;
					if (!this.#isContextMenuHidden() && keyCode === 27) {
						this.#remove();
					}
				},
				false
			);
		}

		if (element instanceof HTMLCollection || element instanceof NodeList) {
			Array.from(element).forEach((el) => {
				el.addEventListener("contextmenu", this.#contextMenuCallback.bind(this), false);
			});
			return;
		}

		if (element instanceof Element) {
			element.addEventListener("contextmenu", this.#contextMenuCallback.bind(this), false);
			return;
		}

		throw new TypeError(`
      Please pass a HTMLCollection || NodeList || Element into init.
      Invalid parameter: ${element}
      `);
	}

	addItem(itemConfig, bucket) {
		const content = document.getElementById("ladon-context-content");
		const template = document.getElementById("ladon-context-template");
		const clone = template.content.cloneNode(true);

		if (itemConfig instanceof Object) {
			this.configMap.set("bucket", bucket);
			this.configMap.set(itemConfig.label, itemConfig);
			clone.querySelector(".ladon-context-item__text").innerText = itemConfig.label;
			clone.querySelector(".ladon-context-item").dataset.actionId = itemConfig.actionId;

			if (itemConfig.icon) {
				clone.querySelector(".ladon-context-item__icon").src = itemConfig.icon;
			}
		} else {
			throw new TypeError(`
        Your passt parameter:${itemConfig} should be a Object with following interface:
        {
          label: string;
          actionId: string;
          icon?: string;
        }
      `);
		}
		content.appendChild(clone);
	}
}
