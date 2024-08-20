# Ladon Default Theme Styles

## Development

```bash
npm i && npm run start
```

Make sure to open up your browsers where [symstem.js](https://github.com/systemjs/systemjs) is mounted (for example [LADON](https://ladon.mind-consulting.de/ui/root/login))
Open your browser devtools and setup the following key value pairs into your local storage

| key                                       | value                                          |
| ----------------------------------------- | ---------------------------------------------- |
| devtools                                  | true                                           |
| import-map-override:@mind/mf-ladon-styles | https://localhost:8500/mind-mf-ladon-styles.js |

Accept loading from unsecure source, refresh browser and start to develop

## JS modules

All js modules are located in `src/js` and are injected in [`mind-mf-ladon-styles.js`](src/mind-mf-ladon-styles.js)

### Ladon Spinner

#### Usage

```javascript
import { LadonSpinner } from "@mind/mf-ladon-styles";
LadonSpinner.show();
LadonSpinner.hide();
```

#### Retrieve spinner element for usage

```javascript
import { LadonSpinner } from "@mind/mf-ladon-styles";
const spinner: HTMLDivElement = LadonSpinner.getSpinnerElement();
```

From here you can use the standard [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element#properties) prototype to modify your spinner

#### Update spinner

##### Size

```css
--ladon-spinner-dimension: 64px;
```

##### Color

```css
--ladon-spinner-fill-color: #ff0000;
```

### Ladon context menu

#### Usage

```javascript
import { LadonContextMenu } from "@mind/mf-ladon-styles";

// initiate with desired element for the context
LadonContextMenu.init(document.querySelector("div#test"));

// initiate with desired elements for the context
LadonContextMenu.init(document.querySelectorAll("ul > li"));
```

#### Register events and handle callback

To add an item to context menu pass in a proper [`object`](src/js/ladon-context-menu.js#161) and a bucket as string

```javascript
function onContextMenu(event) {
	event.stopImmediatePropagation();
	LadonContextMenu.addItem(itemConfig, bucket);
}

function onContextItemClick(event) {
	event.stopImmediatePropagation();
	// performe request here for example
}

document.addEventListener("ladon-context-menu", this.onContextMenu, false);
document.addEventListener("ladon-context-item", this.onContextItemClick, false);
```

---

### Furhter reading

- [Publish your npm package from local machine](docs/local-npm-publish.md)
- [Fork styles](docs/fork-styles.md)
