# Ladon global librarys

Following librarys are installed as a plugin and should be availablie in `window` scope of your ladon instance

- [`lodash`](https://github.com/lodash/lodash)
- [`moment`](https://github.com/moment/momentjs.com)
- [`petite-vue]`(https://github.com/vuejs/petite-vue)
- [`rxjs`](https://github.com/ReactiveX/rxjs)

## Build

```bash
npm run build
```

## Importmap

You can use the generated [importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap#import_map_json_representation) with `src`

```javascript
<script type="importmap" src="path/to/importmap.json">
```

---

## Publish from local maschine with `npm`

```bash
npm login --registry=https://nexus.mind-consulting.de/repository/npm-private/
```

Type in `username` and `password` and after you successfully logged in run `npm publish`