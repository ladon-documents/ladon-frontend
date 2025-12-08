# Ladon Frontend

## Table of contents

* [Starting frontend](#starting-frontend)
* [Trigger a release build](#trigger-a-release-build)
* [Colors and Themes](style/README.md)

### <a id="starting-frontend"></a>Starting frontend

```bash
cd ui
npm i
npm start
```

### <a id="trigger-a-release-build"></a>Trigger a release build

> [!CAUTION]
> Run following commands in `root`, otherwise no release get's triggered

```bash
npm version [major, minor, patch]
git push && git push --tags
```


