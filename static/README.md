# Ladon Static Views

HTML files in this folder are standalone Ladon views. They are copied to the
release package under `static/` and can be opened directly in the browser.

Use the shared runtime in each view:

```html
<script type="module" src="./ladon-static.mjs"></script>
<script type="module">
  const ladon = await window.ladonStaticReady;
  const documentsApi = new ladon.fetchClient.DocumentsApi();
</script>
```

The runtime loads Ladon CSS and exposes the bundled API through
`window.ladonStatic`. It resolves release paths first and falls back to local
development paths, so the same HTML can run from `release/static/` and from the
repository `static/` folder after the API and styles have been built.

## Authentication

Static views can reuse the Ladon auth token written by the Angular UI. The auth
utility checks `sessionStorage` first and then `localStorage`.

```html
<script type="module" src="./ladon-static.mjs"></script>
<script type="module">
  const ladon = await window.ladonStaticReady;

  if (ladon.auth.ensureAuthenticated({ redirectTo: '/ui/draco/ladon-core/login' })) {
    const userApi = ladon.auth.createAuthenticatedApi(ladon.fetchClient.UserControllerApi);
    const user = await userApi.getCurrentUser();
  }
</script>
```

See `authenticated.html` for a complete example.

In local development, the Angular UI usually runs on `localhost:4200`, while
static pages run on `127.0.0.1:4173`. Browser storage is origin-scoped, so the
static server proxies `/ui/draco/ladon-core/*` to the Angular dev server. Open
the proxied login URL from the static origin:

```text
http://127.0.0.1:4173/ui/draco/ladon-core/login
```

After login, static pages on `127.0.0.1:4173` can read the same auth storage.
Use `UI_DEV_SERVER` if Angular runs on another URL:

```bash
UI_DEV_SERVER=http://127.0.0.1:4300 npm run serve:static
```

## Local Development

Build the assets used by standalone views:

```bash
npm run build:static
```

Start the local static server from the repository root:

```bash
npm run serve:static
```

Open:

```text
http://127.0.0.1:4173/static/test.html
```

On local hosts, WebComponents are not loaded automatically. Enable them per page
before loading the runtime when a view needs them:

```html
<script>
  window.ladonStaticConfig = {
    webComponents: true,
    webComponentOptions: {
      source: 'local',
      local: {
        manifestPath: '/public/dev-wc/manifest.json'
      }
    }
  };
</script>
<script type="module" src="./ladon-static.mjs"></script>
```

Pass a different port as the first argument if needed:

```bash
npm run serve:static -- 4300
```
