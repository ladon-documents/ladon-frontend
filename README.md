# Ladon Frontend

## Table of contents

* [Generate APIs](#generate-apis)
* [Starting frontend](#starting-frontend)
* [Trigger a release build](#trigger-a-release-build)
* [Colors and Themes](style/README.md)

### Generate APIs

> [!CAUTION]
> Run following commands in `root`

```bash
npm run build:api
```

### Starting frontend

```bash
cd ui
npm i
npm start
```

### Trigger a release build

> [!CAUTION]
> Run following commands in `root`, otherwise no release get's triggered

```bash
npm version [major, minor, patch]
git push && git push --tags
```


