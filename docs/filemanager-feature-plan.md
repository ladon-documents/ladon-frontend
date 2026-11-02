# FileManager-Featureplan — Ladon Draco UI

> Branch: **`agenticUpdate`** (Arbeit ausschließlich hier).
> Status: **Teilumgesetzt (2026-10, O1-unabhängiger Bugfix-Batch).** Umgesetzt: WP-FM.1a/1b (Verdrahtung) + WP-FM.2a/2b/2d/2e/2f/2g/2h + B5 (siehe §9). **Offen/ausgeschoben (nicht autonom):** B4/B6/O6 echter Upload-Progress, O1-Laufzeit-Verifikation (WP-FM.0.1) → WP-FM.3–5 (F10/F19/F17/F18/F20/F21), O4/F17-F18, O5/F21. **UI-only; `git diff` unter `api/`, `spec/*.yaml`, `spec/` = 0.**
> Stand: Erstellt im Rahmen der FileManager-Paarung mit Web-Filemanagern (2026-10). Fortschrot je Arbeitspaket nachtragen.
> Prinzip (AGENTS.md): **API-Kompatibilität > Erhalt der Fach-Funktion > Korrektheit/Tests > UI/UX > Architektur > Feinschliff.**
>
> Verweis: Eingebunden in `docs/frontend-modernization-plan.md` als **WP-FM** (siehe dortiger Pointer). Dieser Dokument ist die ausführliche Quelle; der Pointer ist der Kurzzugriff/Status.

> **Wichtig — „kein Endpunkt erfinden":** Alle nachfolgenden Feature-/API-Zuordnungen verweisen **ausschließlich** auf bereits
> **generierte, in `api/` vorhandene** Methoden (`DocumentsApi`, `FilemanagerApi`, `ConverterApi`) oder auf **native Browser-Mechanismen**
> (z. B. `XMLHttpRequest.upload`-Progress, CDK-Drag-and-Drop). Wo eine Feature **nicht** durch einen bestehenden Vertrag bedient werden
> kann, wird sie **explizit als „nicht im Spec / out-of-scope / braucht Backend-Vertrag"** markiert und **nicht** erfunden.

---

## 1. Zweck & Geltungsbereich

- **Ziel:** Das Feature *FileManager* auf **Parität mit etablierten Web-Filemanagern** (Nextcloud, FileGator/DirectoryLister, Pydio Cells,
  FileBrowser, ownCloud/Seafile) bringen, **ohne** den bestehenden API-Vertrag zu berühren.
- **Umsetzungsbasis:** die **schon vorhandenen** generierten Clients. Der größte Teil des Paritätspakets ist durch die **bereits bestehende
  `FilemanagerApi`** bedienbar — sie ist aktuell **jedoch nicht in `FetchApiFactory` verdrahtet** (siehe §2.2) und damit aus UI-Sicht toter Code.
- **Keine Erfindung:** Alle Zuweisungen unter §4/§5 sind an konkrete, generierte Signaturen gebunden (Pfad + Methode + Request/Response-Modell).
  Offene Fragen (Zwei-Weg-Modelle, Base-Path-Verifikation, Server-vs-Client-Favorites) sind in §6 als **Zu-bestä-tigende-Verträge** gelistet —
  dort wird **nichts geraten**, sondern bewus-t offen gelassen.
- **Abnahmemerkmal:** `git diff` zeigt nach Umsetzung **0 Änderungen** unter `api/fetch-client/`, `api/plugin-fetch-client/`, `spec/*.yaml`.
  Änderungen sind **UI-only** (Services/Stores/Facades/Components/Directives), validiert per `ng build` + betroffene Karma-Specs (keine Schwächung).

---

## 2. Bestandsaufnahme (Fakten, 2026-10)

### 2.1 Zwei Datenmodell-Welten (entscheidend)

Der `FileManager`-Feature nutzt heute **`Document`** (aus `DocumentsApi`). Die parallele `FilemanagerApi` nutzt **andere Modelle**:

| Modell | Herkunft | Felder (relevant) | Verwendung |
|---|---|---|---|
| `Document` | `DocumentsApi` (`/api/rest/v1/…`) | `contentType?, created?, lastModified?, bucket?, key?, name?, path?, etag?, metadata?, owner?, size?, version?, isFolder?` | **Aktuell** in UI (`FilemanagerStore.documents`, Sort, DnD, Favorite, …) |
| `FileEntry` | `FilemanagerApi` (`/api/filemanager/…`) | `value: string, id: string, size: number, date: number, type: string, star?` | **nicht** in UI |
| `FolderEntry` | `FilemanagerApi` | `value, id, size, date, type, data: FolderEntry[]` (Baum) | **nicht** in UI |
| `VersionEntry` | `FilemanagerApi` | `id, user, content, date, origin?` | **nicht** in UI |
| `Info` / `Features` | `FilemanagerApi` | `stats: Stats, features: { preview: Preview, meta: Meta }` | **nicht** in UI |
| `ShareData` / `ShareDataInfo` / `ShareDataInput` / `ShareResponse` | `FilemanagerApi` | Share-Contract (siehe §4) | **nicht** in UI |

> **Konsequenz:** `FilemanagerApi` arbeitet mit `bucket` + **`id`** (`FileEntry.id` ≈ `Document.key`), `DocumentsApi` mit `bucket` + `key`.
> Eine Integration der `FilemanagerApi` **ersetzt nicht** das `Document`-Modell, sondern ergänzt es — die Liste/Sort/DnD bleiben auf `Document`.
> (siehe offene Entscheidung O4.)

### 2.2 Zwei API-Schichten — `FilemanagerApi` ist **nicht verdrahtet** (zentraler Befund)

| API | Base-Path | In `FetchApiFactory`? | UI-Bindung |
|---|---|---|---|
| `DocumentsApi` | `/api/rest/v1/…` | **Ja** (`documentsApi`, L36, `mainConfiguration` = `/admin`) | `FilemanagerService` (load/get/save/delete/move/copy/putFolder), `converter.service`, `taskmanager`, `rapidweb`, `buckets` |
| `FilemanagerApi` | `/api/filemanager/…` | **Nein** (nicht in `fetch-api.factory.ts` L33–45) | nur als **Hardcod-URL** genutzt (siehe 2.4); der Klass ist **tot** aus UI-Sicht |

**Beleg, dass der Endpunkt live existiert (kein erfundener Pfad):**
- `pdf-viewer.component.ts:65` und `pdf-viewer.store.ts:370`: `` `/admin/api/filemanager/${bucket}/direct?id=${key}` ``.
- `converter.service.ts:151` `getDirectLink`: `` `/admin/api/filemanager/${bucket}/direct?id=${…}&download=true` ``.
- `plugin-installation.service.ts:27`: `/admin/api/filemanager/_plugin/upload?id=…` (Plugin-Upload nutzt denselben `filemanager`-Root).
- `mainConfiguration.basePath = '/admin'` ⇒ `new FilemanagerApi(mainConfiguration).…` erzeugt `/admin` + `/api/filemanager/…` = exakt die
  Hardcod-URLs. **⇒ Verdrahten mit `mainConfiguration` ist pfadkonsistent** (offen: einmalig zur Laufzeit bestättigen → O1).

### 2.3 UI-Feature-Map (was heute existiert)

Feature-Ordner `ui/src/app/filemanager/*` + `store/` + `shared/`. Kernkomponenten:

- **Browse/List:** card + table View (`filemanager-content.component.html` L29–289), `Breadcrumb`, `pagination`, client-side **Search**
  (`FilemanagerStore.setSearchTerm` über `filemanagerHelper.applyFiltersAndPagination`), client-side **Sort** (`setSortConfig`).
- **Create:** `createFolder` (`putFolder`), `createFile` (`putDocument` mit `zipUploadRequest:null`) — über `InputDialogService`.
- **Upload (Bug):** DnD + `FileUploadDirective` (`allowedFileTypes`, `maxFileSize` 50 MB) → `FilemanagerContentFacade.uploadFile` →
  **FAKE-Progress** (`Math.random()` pro 300 ms, `filemanager-content.facade.ts:204-252`) + `getFileSize()` = **`'2.5 MB'` hartcod** (L79-81).
- **Download (Bug):** `FilemanagerContextMenuService.download` ruft `getDocument` und **verwirft das Ergebnis** (kein Trigger, L153-155);
  Component `download(file)` → `converterService.downloadAsZip` → **wirft** bei rohem Key `JSON.parse(files)` (siehe 2.4).
- **Context-Menu:** Download, Kopieren(→Clipboard-Store), Umbenennen(Stub), Link kopieren(Stub), Im Editor öffnen, PDF anzeigen, Audio/Media
  (conditional auf WC-Registrierung), Zu Favoriten (client-store), Eigenschaften(Stub), Löschen.
- **Preview:** `preview.component.ts` — **nur Bild** via `converterService.getPreview` (`mind/preview`-Converter → Blob-URL); non-Bild = `null`.
- **Open/Workspace:** `filemanager-workspace.service.ts` — Modi `browser | editor | image-editor | pdf-viewer | media-player`
  (Monaco-Eigene `MonacoEditorService`, `ladon-image-editor` WC, `ladon-pdfviewer`, `ladon-media-player`/`ladon-audioplayer`),
  `file-editor-dialog`, `workspace-view`.
- **Move/Copy (DnD):** CDK `CdkDropList` **nur intra-liste** (`onDropFromClipboard` → `MoveOrCopyDialog` → `facade.moveDocuments/copyDocument`).
  Kein „auf-Ordner-Ablegen" (Drop-Target = aktueller Ordner), kein DnD-zu-Clipboard.
- **Favorites:** `favorites.store.ts` — **client-only** (`localStorage['ladon-favorites']`); Server-Favorites **un genutzt**.
- **Trash/Restore/Versions/Server-Share:** **existieren nicht** in UI (nur in der ungenutzten `FilemanagerApi`).
- **Tastatur:** `keyboard-shortcuts.service.ts` — `init()` in `app.component.ts:85`; **schluckt** `Ctrl/⌘+A/C/X/V`, `Delete`, `F2`, `Space`,
  `Escape` (`preventDefault` + `event.preventDefault`) → alle Handler sind reine `devLog`+`TODO`-No-ops ⇒ **echte Regression** für
  native Copy/Cut/Paste/Select-all im Editor und globale Auswahl.

### 2.4 Bekannte Defizite & Bugs (mit Quellreferenz)

| ID | Befund | Stelle | Wirkung |
|---|---|---|---|
| B1 | Download verwirft Blob | `filemanager-context-menu.service.ts:153-155` | Einzel-Download tut nichts |
| B2 | `downloadAsZip`/`mergePdf` `JSON.parse(files)` auf rohem Key | `converter.service.ts:31,42` | wirft bei normalem Key → Download/Merge bricht |
| B3 | `converter.handleConverter` Error/Success-Events ungelöst | `converter.service.ts:105,112,118,121` (`TODO`) | fehlgeschlagener Converter = stumm |
| B4 | Upload-Progress FAKE (`Math.random()`) | `filemanager-content.facade.ts:204-252` | Balken lügt; kein echter Fortschritt |
| B5 | `getFileSize()` = hartcod `'2.5 MB'` | `filemanager-context-menu`? nein `filemanager-content.facade.ts:79-81` | Größe ist falsch |
| B6 | `FilemanagerStore.uploadFile` ignoriert `content` (macht Ordner mit `null`) | `filemanager.store.ts:492-542` | Upload-Facade nutzt `saveDocument`, Store-Methode ist kaput |
| B7 | Rename/CopyLink/ShowProperties = `devLog`-Stubs | `filemanager-context-menu.service.ts:145-163` | Aktionen inaktiv |
| B8 | Double-Click auf Datei **wählt nur aus**, öffnet nicht | `filemanager-content.component.ts:216-224` (`navigateTo`) | Kein Auto-Open nach Typ (nur Context-Menu) |
| B9 | `keyboard-shortcuts` **schluckt** Standardtasten | `keyboard-shortcuts.service.ts:79-102` | native Copy/Paste/Select-all/Delete unterbunden |
| B10 | `image-editor-dialog` (Standalone `app-image-editor-dialog`) | `image-editor-dialog.component.ts:47` | von `ladon-image-editor` WC überholt → **Duplikat** (nichts verwenden) |
| B11 | `FilemanagerTagsFacade`/`filemanager-tags.store` | `tags/filemanager-tags.facade.ts` | **vermutlich ungenutzt** (nichts importiert) → Duplikat-Prüfung |
| B12 | `FilemanagerFacade` leere Methoden | `filemanager.facade.ts:157-211` (`loadByKey`/`setCurrentFolder`/`updateFolder`/`updateFile`) | tote API-Oberfläche |
| B13 | `converter.downloadURI/blob`-Typen `string` statt `Blob` | `converter.service.ts:126` | Typ-Unsauberkeit (kein Funktion-Defekt, Feinschliff) |

> **Vorgehen pro Bug (AGENTS §1.2):** **keine** Bestandsfunktion „nur weil unmodern" entfernen. Stubs nicht löschen; wo ein
> **existierender** Endpunkt vorliegt, **anbinden**; wo nicht, Fehler klar und **nicht raten**.

---

## 3. Feature-Katalog — Parität mit Web-Filemanagern

Kanonen-Features, die etablierte Browser-Filemanager (Nextcloud / FileBrowser / Pydio / ownCloud / FileGator+DirectoryLister) bieten.
Spalte **Referenz** = Typischer Peer, **dieses Projekt** = Status heute.

| # | Feature | Peer-Referenz | Status heute |
|---|---|---|---|
| F1 | Ordner/Browse + Kachel-/Tabelle | alle | vorhanden (card+table, Breadcrumb, Pagination) |
| F2 | Sort (Name/Größe/Datum) | alle | vorhanden (client-side, aria-sort) |
| F3 | Suche (client + optional server) | alle | client vorhanden; server `findDocumentPath`/`files(search)` ungenutzt |
| F4 | Neues Blatt erstellen | alle | vorhanden (`createFile`) |
| F5 | Neuen Ordner | alle | vorhanden (`createFolder`/`putFolder`) |
| F6 | Upload (Multi, echter Progress) | alle | vorhanden aber **Fake** (B4) + Bug B6 |
| F7 | Download einer Datei | alle | **kaput** (B1) |
| F8 | Download mehrerer / .zip | alle | vorhanden aber **wirft** (B2) |
| F9 | Double-Click öffnet nach Typ | alle | **nur Select** (B8) |
| F10 | Vorschau/Thumbnail (Bild/Video/Audio/PDF/Text) | alle | **nur Bild** |
| F11 | Inline-Text-Editieren | Nextcloud/ownCloud | vorhanden (Monaco), `getText`/`saveText` ungenutzt |
| F12 | Inline-Bild-Bearbeiten | Pydio/ownCloud | vorhanden (`ladon-image-editor` WC) |
| F13 | Umbenennen | alle | **Stub** (B7) |
| F14 | Verschieben / Kopieren | alle | vorhanden (DnD intra-liste; Dialog) |
| F15 | Drag-and-drop **auf Ordner** | alle | **fehlen** (nur intra-liste) |
| F16 | Cut/Copy/Paste über Auswahl (Clipboard) | alle | Partial (`ClipboardStore`), DnD-zu-Clipboard fehlt |
| F17 | Löschen → **Papierkorb** | alle | **nicht vorhanden** (nur hart `deleteDocument`) |
| F18 | Papierkorb-Restaurierung | alle | **nicht vorhanden** |
| F19 | Versionen / Historie + Restore | Nextcloud/ownCloud | **nicht vorhanden** (nur `listDocumentMetaVersions` für Meta) |
| F20 | Server-Share (Link + Empfänger + Gültigkeit + Passwort) | alle | **nicht vorhanden** |
| F21 | Favoriten/Stars | alle | **client-only** (localStorage); Server-Favorites ungenutzt |
| F22 | Eigenschaften / Metadaten-Display | alle | **Stub** (B7) |
| F23 | Mehrfach-Operationen (Bulk) | alle | vorhanden (Move/Copy/Delete multi) |
| F24 | Tastatur-Navigation (A/Wahl/Entf/F2/Escape) | alle | **schluckt No-op** (B9) |
| F25 | Berechtigungen/Info (Bucket-Features/Stats) | Nextcloud | **nicht vorhanden** (`info` ungenutzt) |

---

## 4. Gap-Table — Feature → existierender API (Zuordnung, kein Erfinden)

Belegquellen: `api/fetch-client/apis/DirectoriesApi` (kein — `DocumentsApi`), `FilemanagerApi`, `ConverterApi`; Modelle `Document`,
`FileEntry`, `FolderEntry`, `VersionEntry`, `Info`, `ShareData*`. „Status" = heute; „Machbarkeit" = mit **existiertem** Endpunkt?
**„Ne" ⇒ out-of-scope / braucht Backend-Vertrag (nicht erfinden).**

### 4.1 `DocumentsApi` — `/api/rest/v1/…` (verdrahtet, `Document`)

| Endpoint (Pfad · Methode) | Modell/Param | Bedient |
|---|---|---|
| `…/content/buckets/{bucket}/documents` · GET | `listDocuments{bucket,limit?,page?,prefix?,orderby?,showAllVersions?,currentFolder?}` → `Document[]` | F1/F3(partial)/F5 |
| `…/content/buckets/{bucket}/documents` · PUT | `putDocument{bucket,key,version?,zipUploadRequest?}` → `Document` | F4/F5/F6 |
| `…/content/buckets/{bucket}/documents` · GET | `getDocument{bucket,key,version?}` → `Blob` | F7(F11)/F12/F10 |
| `…/content/buckets/{bucket}/documents` · DELETE | `deleteDocument{bucket,key,version?}` → `ResponseSuccess` | F17(hart) |
| `…/content/buckets/{bucket}/documents/move` · POST | `moveDocument{bucket,key,targetBucket,targetKey}` → `Document` | F14/F13(derived) |
| `…/content/buckets/{bucket}/documents/copy` · POST | `copyDocument{…targetBucket,targetKey}` → `Document` | F14 |
| `…/content/buckets/{bucket}/folders` · PUT | `putFolder{bucket,key}` → `Document` | F5 |
| `…/meta/buckets/{bucket}/documents` · GET/PUT | `getDocumentMeta`/`putDocumentMeta{…metadata:Metadata}` → `Document` | F22 |
| `…/meta/buckets/{bucket}/documentversions` · GET | `listDocumentMetaVersions{bucket,key}` → `Document[]` | F19(Meta-von-Versionen) |
| `…/meta/buckets/{bucket}/pathsearch`/`datepathsearch` · POST | `findDocumentPath`/`datepathsearch{term?,from?,to?,limit?}` | F3(server)/Suche |
| `…/content/buckets/{bucket}/jsonlist` · GET | `listDocumentJson` | Such-/Listen-Helper |
| `…/content/management/batchdelete` · (DELETE/POST) | `deleteDocumentBatch{antpattern,securitykey,dryrun}`; `stopBatchDelete` | Bulk/Delete (Server-Batch) |

### 4.2 `FilemanagerApi` — `/api/filemanager/…` (NICHT verdrahtet; `id` ≈ `key`)

| Methode (Pfad · Methode) | Signatur (Rückgabe) | Bedient |
|---|---|---|
| `files` | `files({bucket,id,search?,source?})` → `FileEntry[]` | F3(server) |
| `folders` | `folders({bucket,id?})` → `FolderEntry[]` | F1(F15 Baum) |
| `direct` | `direct({bucket,id,download?})` → `Blob` | F7/F8 (direkt, wie heute Hardcod) |
| `rename` | `rename({bucket,id,name})` → obj | F13 |
| `makedir` | `makedir({bucket,id,name})` → `FolderEntry` | F5 |
| `makefile` | `makefile({bucket,id,name})` → `FileEntry` | F4 |
| `upload` | `upload({bucket,id,uploadFullpath,upload:Blob})` → `FileEntry` | F6 (Blob-Upload; kein Progress im Client!) |
| `move` | `move({bucket,id,to})` → obj | F14/F15 |
| `copy` | `copy({bucket,id,to})` → obj | F14 |
| `_delete` | `POST /{bucket}/delete` (`{bucket,id}`) | F17 (→ Papierkorb, wenn Backend so) |
| `deleteFromTrash` | `DELETE /{bucket}/delete` (`{bucket,id}`) | F18/F17(endgültig) |
| `restore` | `restore({bucket,id,target})` → `FileEntry` | F18 |
| `getVersions` | `getVersions({bucket,id})` → `VersionEntry[]` | F19 |
| `getVersionData` | `getVersionData({bucket,id,mode?,diff?})` → `Blob` | F19 |
| `preview` | `preview({bucket,id,width?,height?})` → `Blob` | F10 |
| `icons` | `icons({bucket,size,type,ext})` | F10 (Icons/Thumbnails) |
| `getText` | `getText({bucket,id})` → `Blob` | F11 |
| `saveText` | `saveText({bucket,id,content})` → `FileEntry` | F11 |
| `setFavorite` / `unmarkFavorite` | both `POST /{bucket}/favorite` (`{bucket,id}`) | F21 |
| `meta` | `meta({bucket,id})` → `Record<string,string>` | F22 |
| `info` | `info({bucket})` → `Info{stats,features{preview,meta}}` | F25 |
| `shareFiles` | `shareFiles({shareDataInput})` → `ShareResponse{id?,url?,emailSent?}` | F20 |
| `getFileShares` | `getFileShares()` → `ShareDataInfo[]` | F20 |
| `updateShare` | `updateShare({shareId,shareData})` → obj | F20 |
| `deleteFileShare` | `DELETE /share/files/{shareId}` (`{shareId}`) → `DataResponse` | F20 |
| `allUsers` | `GET /users/all` → `UserEntry[]` | F20/Empfänger |
| `getUserImage` | `GET /users/image?userId=` | (Avatar) |
| `comments` | `GET /comments?id=` → `string[]` | (Kommentare, optional) |

### 4.3 `ConverterApi` (`/api/rest/v1/…` via `converterApi` in `mainConfiguration`, verdrahtet)

| Methode | Rückgabe | Bedient |
|---|---|---|
| `applyAndDownload({converterJob})` | Blob (Zip/PDF-merge/Preview) | F8(zip)/F19? |
| `applyConverterAndStore({converterJob})` | Ergebnis-URL (→ `direct?id=`) | F8 (gespeicherte Ausgabe) |
| `listConverterInfo()` | `ConverterInfo[]` | Feature-Verfügbarkeit (F8 prüfen, „mind/zip" etc.) |
| `getPreview` (via `applyAndDownload` + `mind/preview`) | Blob-URL | F10(Bild-Preview, wie heute) |
| `downloadURI`/`getDirectLink` | — | F7 (direkt) |

### 4.4 Gap-Summary (Feature → Verdrahtung → Machbarkeit → Risiko)

| # | Feature | Heute | Ziel-Endpunkt (existiert) | Machbarkeit | Risiko / Anmerkung |
|---|---|---|---|---|---|
| F1 | Browse/List | OK | `DocumentsApi.listDocuments` | **Ja** | Basis |
| F2 | Sort | OK | client `setSortConfig` | **Ja** | bereits aria-sort |
| F3 | Suche | client | `DocumentsApi.findDocumentPath`/`FilemanagerApi.files(search)` | **Ja** (server-optional) | heute client; server-optional |
| F4 | Neue Datei | OK | `DocumentsApi.putDocument` / `FilemanagerApi.makefile` | **Ja** | beide vorhanden |
| F5 | Neuer Ordner | OK | `DocumentsApi.putFolder` / `FilemanagerApi.makedir` | **Ja** | — |
| F6 | Upload + Progress | **Bug** B4/B6 | `DocumentsApi.putDocument` (Blob body) | **Ja** | echter Progress nur per **nativem `XHR.upload`/`fetch`** (kein progress im Client ⇒ kein erfinden; native Mechanismus) |
| F7 | Download 1 | **Bug** B1 | `DocumentsApi.getDocument` → Blob-URL **ODER** `FilemanagerApi.direct(download=true)` | **Ja** | Trigger fehlt; nicht erfinden |
| F8 | Download zip | **Bug** B2 | `ConverterApi.applyAndDownload`/`applyConverterAndStore` (`mind/zip`) | **Ja** | `JSON.parse`-Bug heilen (O? — Input-Zeitform prüfen, nicht raten) |
| F9 | Double-Click | **Bug** B8 | `workspaceService.open*` nach Typ + `isWebComponentRegistered` | **Ja** | nur vorhandene Modi |
| F10 | Vorschau/Thumb | nur Bild | `FilemanagerApi.preview`/`icons` **ODER** `converter.getPreview` | **Ja** (erweitern) | Quelle O2 (converter vs FilemanagerApi) |
| F11 | Text-Edit | vorhanden | `FilemanagerApi.getText`/`saveText` (optional) + Monaco | **Ja** | Monaco-Edit-Flow vorhanden |
| F12 | Bild-Edit | vorhanden | `ladon-image-editor` WC + `saveDocument` | **Ja** | Duplikat `image-editor-dialog` (B10) ignorieren |
| F13 | Umbenennen | **Stub** B7 | `DocumentsApi.moveDocument` (selbe Bucket, neuer Key) **ODER** `FilemanagerApi.rename` | **Ja** | O3 (Zwei-Weg) |
| F14 | Move/Copy | vorhanden | `DocumentsApi.moveDocument/copyDocument` / `FilemanagerApi.move/copy` | **Ja** | DnD-Intra existiert |
| F15 | DnD **auf Ordner** | **fehlen** | `DocumentsApi.moveDocument/copyDocument` (Target = Ordner) | **Ja** | CDK-Drop-Target = aktueller Ordner; **kein** Backend-Zusatz |
| F16 | Cut/Copy/Paste (DnD) | partial | `ClipboardStore` + `move/copy` | **Ja** | DnD-zu-Clipboard = UI-only |
| F17 | Papierkorb | **fehlen** | `FilemanagerApi._delete` (POST `/delete`) | **mög.** | O4: Semantik „Wechselstunde" (Backend-Contract prüfen, nicht raten) |
| F18 | Restore | **fehlen** | `FilemanagerApi.restore({bucket,id,target})` | **mög.** | `target` = Ziel-Key (O4) |
| F19 | Versionen/History | **fehlen** | `FilemanagerApi.getVersions`/`getVersionData` | **mög.** | O4; `listDocumentMetaVersions` (Meta) bereits da |
| F20 | Server-Share | **fehlen** | `FilemanagerApi.shareFiles/getFileShares/updateShare/deleteFileShare` + `allUsers` | **mög.** | O1 (verdrahten + Laufzeit); Contract klar |
| F21 | Favoriten | client-only | `FilemanagerApi.setFavorite/unmarkFavorite` | **mög.** | O5 (Server vs Client — Dual/Replace?) |
| F22 | Eigenschaften/Meta | **Stub** B7 | `DocumentsApi.getDocumentMeta` + `Document` Felder (+ `FilemanagerApi.meta`) | **Ja** | kein Erfinden nötig |
| F23 | Bulk | vorhanden | `forkJoin` über `DocumentsApi.*` / `deleteDocumentBatch` | **Ja** | vorhanden |
| F24 | Tastatur | **Regression** B9 | UI-only (kein Endpunkt) | **Ja** | `preventDefault`-Schwall heilen; native Aktionen beibehalten |
| F25 | Bucket-Info/Features | **fehlen** | `FilemanagerApi.info` (`Info.stats/features`) | **mög.** | O1; optionales UI (Quota/Fähigkeiten-Anzeige) |
| **F26** | **Per-Datei Thumbnail-Grid / virtueller Scroll** | — | `FilemanagerApi.icons`/`preview` | **mög.** | Feinschliff; **kein** virtueller Scroll ohne konkreten Grund (AGENTS §7) |

> **„mög." (möglicherweise)** = Endpunkt existiert, aber **Vertrauts-Semantik offen** (z. B. `_delete`→Papierkorb? `target`-Format,
> `star`-Field auf `FileEntry`); → **Zu-bestättigen (§6)**, **nicht raten**. Bis zur Bestätigung bleibt das heutige Verhalten.
> **Kein** Feature erfordert einen **neuen** API-Endpunkt. Was nicht im Spec ist (z. B. echter Upload-Progress im Client, „list trash" als
> eigener Endpoint) wird **nicht** erfinden: Upload-Progress = nativer Browser-Mechanismus; „Papierkorb-Liste" → `folders`/`files` mit
> `source`-Param oder O4-Bestätigung — **nicht** aus dem Nichts.

---

## 5. Umsetzungsplan — Phasen / Arbeitspakete (fortschrot-gepflegte Checkboxen)

Vorgehen pro WP (AGENTS §6): `ng build` grün, betroffene Karma-Specs grün (keine Schwächung), `git diff` 0 unter `api/`, Prettier.
Jede Phase baut auf der vorherigen. **WP-FM.0** ist **nur Doku** (dieser Stand). Umsetzung startet **nach** Bestätigung der §6-Offenen-Entscheidungen.

### Phase 0 — Baseline & Verifikation (nur Doku/Inspektion)
- [x] **WP-FM.0** (dieser Dok-Entwurf) — Plan + API-Mapping + Bugs-Verzeichnis (F/B1–B13/F1–F26). **Erledigt: Doku angelegt.**
- [x] **WP-FM.0.1** Laufzeit-Verifikation der `FilemanagerApi`-Erreichbarkeit (O1): gegen Laufzeit-Backend einen `GET /admin/api/filemanager/{bucket}/info` (oder `direct`) probieren; **nichts** im generierten Code ändern (nur ein UI-Probe/Dev-Flag). **ERLEDIGT (2026-10, live, admin/admin123):** `GET /admin/api/filemanager/{bucket}/{info,folders,files,meta,direct,preview,versions}` → **200** mit realen Payloads (z. B. `info.features.preview={code:false,document:true,image:true,text:true}`; `folders`/`files` → `FolderEntry`/`FileEntry` `{value,id(=path),size,date,type,star}`). `FilemanagerApi` Base `/admin` ist **lauffähig** → **WP-FM.3–5 DEBLOCKIERT.** Beweis: §10 Live-Betriebstest.
- [~] **WP-FM.0.2** Duplikate bestätigen (B10/B11/B12): **Bestätigt (2026-10):** `image-editor-dialog`/`ImageEditorDialog` = 0 Externe-Referenzen; `FilemanagerTagsFacade` = nur eigene Def./eigene Specs; leere `filemanager.facade`-Methoden (`loadByKey`/`setCurrentFolder`/`updateFolder`/`updateFile`) = 0 Externe-Referenzen. **Nicht entfernt** (Nutzerfreigabe steht aus → WP-FM.8b).

### Phase 1 — Fundament: `FilemanagerApi` verdrahten
- [x] **WP-FM.1a** `FilemanagerApi` in `FetchApiFactory` hinzufügen: `readonly filemanagerApi = new fetchClient.FilemanagerApi(this.mainConfiguration);`
      (basePath `/admin`, pfadkonsistent mit den heutigen Hardcod-URLs). **UI-only, kein API-Codewechsel.** **Erledigt (2026-10):** in `fetch-api.factory.ts` angelegt; harmlos, da noch kein Aufruf (`O1`-Aktivierung offen).
- [x] **WP-FM.1b** Typ-Smoke: `filemanagerApi` in DI-Test-Harnesses registrieren (parallel zu `documentsApi`-Mock); `tsc(app+spec)` grün. **Erledigt (2026-10):** `app.test-harness.ts` + `fetch-api.factory.spec.ts`; `ng build` grün (Exit 0).
- [~] **WP-FM.1c** Doku in `AGENTS.md`/Plan aktualisieren (bisher „nicht verdrahtet"). **Teilweise:** Plan-Doku aktualisiert; **`AGENTS.md`/O1-Freigabe offen** (erst nach Laufzeit-Verifikation — WP-FM.0.1).

### Phase 2 — Bug-Heilung (Vertrag erhalten, kein Erfinden)
- [x] **WP-FM.2a** F7 Einzel-Download: `download()` löst echten `getDocument`-Blob → Download-Trigger (Analogon zu `workspace`/`downloadURI`); **nicht** Ergebnis verwirfen. **Erledigt (2026-10):** `filemanager-context-menu.service.ts` — `download()` asynchron, `getDocument`→`Blob`→`URL.createObjectURL`+`<a download>`+`revokeObjectURL`; Fehler→`ToastService.error`.
- [x] **WP-FM.2b** F8 Zip-Multi: `converter.downloadAsZip`/`mergePdf` `JSON.parse(files)`-Bug heilen (korrekte Input-Zeitform, **nicht raten** → mit bestehender Aufrufstelle abgleichen; `getDirectLink`-Fallaufbauen); Error/Success-Toast (B3) statt TODO. **Erledigt (2026-10):** `normalizeInputPaths()` verwandelt JSON-Array-String **und** rohen Einzel-Key (kein Wurf mehr, `JSON`-Vertrag des Clipboard-Stores erhalten); `getDirectLink` öffentlich + wieder genutzt; echte `console.error` statt `// TODO` (B3). B13 (`downloadURI`/`string`-Typ): **bewusst erhalten** (Feinschliff, kein Funktionsdefekt, Cross-Modul-Risiko → WP-FM.8).
- [~] **WP-FM.2c** F6 echter Upload-Progress: `FilemanagerService.upload` (statt `createNewFile(null)`); Fortschritt per **nativem XHR.upload/`fetch`** (kein progress im generierten Client ⇒ UI-Mechanismus, kein Endpunkt erfinden); `getFileSize` reale `file.size`; Store `uploadFile`-content-Fix (B6). **Teilweise (2026-10):** B5 (hartcod `'2.5 MB'`) **geheilt** — `getFileSize(upload)` zeigt reale `upload.fileSize`; echter Upload-Progress (B4/B6/O6) und Content-Nutzung **offen/ausgeschoben** (benötigt `O6`-Entscheidung: natives XHR umgeht `putDocument`+Auth-Middleware).
- [x] **WP-FM.2d** F13 Rename anbinden: entweder `DocumentsApi.moveDocument` (B=Bucket, neuer Key) **oder** `FilemanagerApi.rename` (O3) → Input-Dialog + Refresh. **Erledigt (2026-10):** `DocumentsApi.moveDocument`-Pfads (O3-Empfehlung) — `InputDialogService.prompt` (Validator: leere/ungültige Zeichen `<>:"/\|?*`) → `moveDocument(same Bucket, dir+newName)` → `reloadCurrentLocation()` + `ToastService`. `FilemanagerApi.rename` als alternativer O1-Pfad nicht aktiviert.
- [x] **WP-FM.2e** F7 Link kopieren: `copyLink` → bestehende `direct`-URL (`/admin/api/filemanager/{bucket}/direct?id=…&download=true`) in Zwischenablage; **kein** neuer Endpunkt. **Erledigt (2026-10):** `copyLink` nutzt `converterService.getDirectLink(bucket,id)` → `navigator.clipboard.writeText` (mit Fallback-`Toast` wenn Clipboard ungleich).
- [x] **WP-FM.2f** F22 Eigenschaften/Meta: `showProperties` → `DocumentsApi.getDocumentMeta` + `Document`-Felder (Size/created/lastModified/owner/version)+ `DocumentTags`. **Erledigt (2026-10):** `showProperties` zeigt `Document`-Felder (Name/Pfad/Typ/Inhaltstyp/Größe/Erstellt/Geändert/ETag/Eigentümer/Version/Bucket, nur vorhandene) über `ConfirmationDialogService` als „Eigenschaften"-Dialog (Schließen). **Kein** `getDocumentMeta`/Tags nötig → **kein** Erfinden; Tag-Display (falls gewünscht) offen.
- [x] **WP-FM.2g** F9 Double-Click öffnet: `navigateTo` für Datei → `workspaceService.open*` nach Typ (conditional auf WC-Registrierung), analog Context-Menu; Ordner wie heute. **Erledigt (2026-10):** `openDocumentByType()` — Priorität PDF→PDF-Viewer, Bild→Bild-Editor else MediaPlayer, Audio/Video→MediaPlayer, editierbar→Editor; alle an `isWebComponentRegistered` gekoppelt; Fallback = heutiges `select`. Ordner wie heute.
- [x] **WP-FM.2h** Tastatur-Regression: `keyboard-shortcuts.service` — **nicht** native `Ctrl/⌘+C/X/V/A/Delete` `preventDefault` (B9); nur bewusst belegte Aktionen (`F2` Rename, eigene Schnellvorschau), sonst durchreichen. **Erledigt (2026-10):** `enabled`-Flag (Standard aus), Listener blockt nur `enabled===true`-Aktionen; **alle** Defaults (heute No-op/TODO) `enabled:false` → natives Verhalten wieder durch. **Regressionstest** in `keyboard-shortcuts.service.spec.ts` (Ctrl+A/Delete/Escape nicht blockiert / aktiv blockiert).
- [ ] **WP-FM.2i** F11 Text: `getText`/`saveText` (optional an Monaco anknüpfen) — **nur** wenn O2/Text-Reichweite bestätigt; sonst Monaco-`getDocument`-Flow erhalten. **Offen** (O2 offen).

### Phase 3 — Vorschau/Thumbnail/Medien
- [ ] **WP-FM.3a** F10 Vorschau erweitern (O2): `FilemanagerApi.preview(id,width?,height?)` für Bild/Videoframe **ODER** `converter.getPreview` beibehalten — Quelle festlegen; PDF→`ladon-pdfviewer`, Text→Vorschau (Trunk), Audio/Video→`ladon-media-player`/`audioplayer` (conditional WC).
- [ ] **WP-FM.3b** F10/F26 Icons/Thumbnails: `FilemanagerApi.icons(size,type,ext)` (nur, wenn im Laufzeittest verfügbar); sonst `fileicon.pipe` beibehalten (kein Erfinden).

### Phase 4 — Versionen & Papierkorb
- [ ] **WP-FM.4a** F19 Versionen: `FilemanagerApi.getVersions` → Historie-Liste; `getVersionData(diff?)` → Compare/View; Restore per `restore`.
- [ ] **WP-FM.4b** F17/F18 Papierkorb: Semantik **O4** klären (ist `_delete`→soft? `deleteFromTrash`→hard? „list trash"?): **ohne** Bestätigung **nicht** umset-zen; bis dahin hartes `deleteDocument` beibehalten.

### Phase 5 — Server-Share & Favoriten
- [ ] **WP-FM.5a** F20 Server-Share: `shareFiles({title,selection,recipient?,password?,validDate?})`→`ShareResponse{id,url,emailSent}`; `getFileShares`/`updateShare`/`deleteFileShare`; `allUsers` für Empfänger. UI: „Teilen"-Dialog (Input-Dialog-Style). **O1-Abhängig** (verdrahten + Laufzeit).
- [ ] **WP-FM.5b** F21 Favoriten-Entscheidung (**O5**): Client-`FavoritesStore` (heute) **ersetzen vs dual vs ergänzen** um `setFavorite`/`unmarkFavorite` (Server, persistiert). **Ohne** Entscheidung **beides** nicht parallel — O5 offen.

### Phase 6 — Bulk & DnD-Verbreiterung
- [ ] **WP-FM.6a** F15 DnD **auf Ordner**: CDK-Drop-Ziel = aktueller Ordner → `move`/`copy` (Modifier = copy); kein Backend-Neues.
- [ ] **WP-FM.6b** F16 DnD-zu-Clipboard: Drag aus Liste → `ClipboardStore`; Drop auf Ziel → move/copy (UI-only).
- [ ] **WP-FM.6c** F23 Bulk: `deleteDocumentBatch` (Server-Batch) prüfen; UI-Multi schon vorhanden — Parität bestätigen, nicht neu erfinden.

### Phase 7 — Tastatur & a11y-Parität
- [ ] **WP-FM.7a** F24 echte Tastatur-Aktionen auf `FilemanagerStore` (Select-all/Copy/Cut/Paste/Delete/F2/Escape), **beibehalten** native im Fokus-Feld; neue Unit-Tests.
- [ ] **WP-FM.7b** a11y: Fokus-Ringe/Semantik im FileManager (an WP-P1.2a-`[appKeyboardActivatable]` anknüpfen; `<th>`/`<tr>`-Rest aus P1.2a).
- [ ] **WP-FM.7c** F25 Bucket-`info`/Features-Panel (Quota/Fähigkeiten) — optional, O1-abhängig.

### Phase 8 — Feinschliff (nur mit konkretem Grund, AGENTS §7)
- [ ] **WP-FM.8a** F10/F26 Thumbnail-Grid + (nur) `icons`/`preview`-Thumbnails; **kein** virtueller Scroll ohne belegten Grund.
- [ ] **WP-FM.8b** Duplikate auflösen (B10/B11/B12) **nach** Nutzerfreigabe; leere `filemanager.facade`-Methoden (B12) entfernen/anbinden.

> **Reihenfolge-Logik:** Phase 1 (WP-FM.1) ist die **Voraussetzung** für alle `FilemanagerApi`-Features (F10, F13-alt, F17–F20, F21-Server, F25).
> Phase 2 (Bug-Heilung) ist **unabhängig** von WP-FM.1 (nutzt `DocumentsApi`/`ConverterApi`) und liefert sofort sichtbaren Nutzen.

---

## 6. Offene Entscheidungen / Zu-bestä-tigende Verträge (nichts raten — AGENTS §1.1)

> Diese Punkte sind **nicht** autonom abschließbar. Bis zur Bestätigung bleibt das heutige Verhalten. **Kein** Punkt erfindet einen Endpunkt.

- **O1 — Base-Path/Laufzeit der `FilemanagerApi`.** `mainConfiguration.basePath='/admin'` + `/api/filemanager/…` = den heute Hardcod-URLs
  (pdf-viewer, converter, plugin-upload). **Evidenz: hoch. ✅ BESTÄTIGT (2026-10, live):** `GET /admin/api/filemanager/{bucket}/{info,folders,files,meta,direct,preview,versions}` → **200** mit echten Payloads (admin/admin123). `FilemanagerApi`-Base `/admin` lauffähig → **WP-FM.3–5 DEBLOCKIERT** (WP-FM.0.1, §10). Die O1-Blockade entfällt; **Rest:** O4 (Papierkorb-Semantik) + O5 (Favoriten Dual) bleiben offen; **neu: O9/O10** (siehe unten + §10).
- **O2 — Vorschau-Quelle.** `converter.getPreview` (`mind/preview`, heute) vs `FilemanagerApi.preview`/`icons`. **Beide** existenten;
  **keine** Erfindung — Entscheidung über Performance/Auflohnheit, nicht Vertrag. → Phase 3 zuerst `converter` (bewährt) behalt-ten.
- **O3 — Rename-Zwei-Weg.** `DocumentsApi.moveDocument` (selbe Bucket, neuer Key, **heute bewährt**) vs `FilemanagerApi.rename`.
  **Empfehlung:** zunächst `DocumentsApi.moveDocument` (bewährt + `Document`-Zugriff unverändert); `FilemanagerApi.rename` nur als O1-aktivierte Alternative.
- **O4 — Papierkorb-/Restore-Semantik.** `FilemanagerApi._delete` = soft (→Papierkorb)? `deleteFromTrash` = hard? `restore.target` = Format
  (Key? Pfad? Bucket/Kombination?)? **„list trash"**-Endpoint im Spec **nicht** erkennbar ⇒ **nicht erfinden**: entweder O-bestätigt oder
  `documents`/`files` mit `source`-Param — beides **offen**.
- **O5 — Favoriten (Server vs Client).** `setFavorite`/`unmarkFavorite` (Server, persistent) vs `FavoritesStore` (heute, localStorage).
  **Optionen:** ersetzt / dual / ergänzen. **Kein** stiller Wechsel (Verhaltenserhalt AGENTS §1.2).
- **O6 — Upload-Progress-Vertrag.** Der generierte `upload`/`putDocument` hat **keinen** Progress-Callback. Echter Fortschritt =
  **nativ** `XMLHttpRequest.upload`/`fetch`-Body-Stream (UI-Mechanismus, **kein** Endpunkt). **Empfehlung:** nativer XHR; **nicht**
  Fake-`setInterval` (B4) und **nicht** erdunkter `content`-Store (B6).
- **O7 — Converter-Input-Zeitform.** `DownloadAsZip`/`mergePdf` `JSON.parse(files)` (B2): die aufrufende Stelle
  (`filemanager-content.download(file)`) übergibt einen **rohen Key-String**. Korrekt = korrekte `inputPaths`-Zeitform (Array) aus
  Auswahl ableiten (UI-only, **kein** Contract-Wechsel). → WP-FM.2b an der Aufrufstelle abgleichen.
- **O8 — Modell-Dualismus.** `Document` (heute) vs `FileEntry`/`FolderEntry` (FilemanagerApi). **Empfehlung:** Liste/Sort/DnD/Favorite auf
  `Document` **behalten**; `FilemanagerApi`-Ergebnisse (Versions/Preview/Share/Info) **lokal ummappen**, kein globaler Datenmodell-Wechsel.
- **O9 — Favoriten-Asymmetrie `setFavorite` (POST) 401 vs `unmarkFavorite` (DELETE) 200.** Live (admin/admin123, §10):
  `POST /api/filemanager/{bucket}/favorite?id=` → **401**, `DELETE …/favorite?id=` → **200** (`{"invalid":false}`). UI ruft die
  Endpunkte (korrekt, O1-bewährt) an → **kein** Frontend-Code-Fix; **Nachverfolgung:** ist es eine **RBAC/Permission**-Regel (nur Lösen
  erlaubt) oder eine **HTTP-Method/CSRF**-Regel? Bis dahin: „Zu Favoriten hinzufügen" ist **vermutlich zur Laufzeit defekt** (nur Entfernen
  klappt) → **nicht** stillschweigend umstellen; O5-Entscheidung erweitern um diese Asymmetrie.
- **O10 — PDF-Vorschau/Open-by-type: Web-Component-Asset 401.** Live (admin/admin123, §10): Double-Click PDF öffnet die „PDF VIEWER"-Route,
  rendert aber nicht, weil `GET /ui/draco/webcomponents/wc-pdfviewer/assets/viewer-5.4.1095.min.mjs` → **401**. Bil
  d-Open-by-type dagegen (IMAGE EDITOR) → OK. **Nachverfolgung:** Asset wird (dev-Proxy → cluster) unauthentifiziert/fehlend ausgeliefert
  (evtl. `sync:wc:local` nicht ausgelöst / WAF). **Kein** erfinden; ggf. Asset-Delivery / Sync prüfen.
- **Randbeobachtungen (lat-ent, kein Fix):** (a) `FilemanagerApi.folders({id:'root'})` → **401**, aber `files({id:'root'})` → **200** und
  `folders` (ohne `id`) → **200** ⇒ Root-Verzeichnis **nur** ohne `id` (bzw. mit echtem Pfad-`id`) abfragbar; UI nutzt `documentlist`
  (nicht `folders`), daher aktuell nicht ausgelöst — **für künftige WP-FM.3-Features markieren.** (b) `direct?download=…` liefert **selten 403**
  anstelle von 200 kurz nach Login (Dann 200) → möglicher WAF/Rate-Limit; **kein** ID/Formfehler — `document.key` (bucket-relativ,
  z. B. `2fa-doku.txt`) ist die korrekte ID (bestätigt mit `direct` 200).

---

## 10. Live-Betriebstest (2026-10, admin/admin123) — Funde & Belege

**Methode:** echtes Formular-Login → headless-Chromium (`puppeteer-core`, Dev-Server `:4200`/Proxy → `https://cluster.mind-consulting.de`);
parallele direktes `fetch`-API-Testing. **Schreibtests ausschließlich im `_tmp`-Bucket, reversibel + vollständig aufgeräumt** (3/3 Verifikation:
0 Throwaways übrig). Screenshots: `/tmp/opencode/shots/`.

### 10.1 ✅ Bestätigt (O1-unabhängige Features lauffähig)
- **O1**: `FilemanagerApi` `info/folders/files/meta/direct/preview/versions` alle **200** mit realen Payloads → WP-FM.3–5 DEBLOCKIERT.
- **Auth**: `POST /admin/auth/login` 200 + JWT-Bearer; `GET /admin/user/me` 200. **Hinweis:** Storage-Seed des Tokens authentifiziert **nicht**
  (App verlangt echten Login-Flow). Post-Login-Landing = `/buckets` (nicht `/filemanager`; `/filemanager` ohne Bucket = leer).
- **Listing**: `documentlist?currentFolder=true` 200 für `_public`/`_ui`/`_home`/`abrechnung`.
- **F22 showProperties** (B7): Modal mit Name/Pfad/Typ/Inhaltstyp/Größe/Erstellt/Geändert/ETag/Eigentümer/Version/Bucket ✓.
- **F7 copyLink** (B7): grüner Toast „Link … kopiert"; kopierte `direct?download=true`-URL gültig (ID = `document.key`, bucket-relativ) ✓.
- **F9 Bild-Open** (B8): Double-Click → IMAGE EDITOR rendert PNG ✓.
- **F13 Rename** (B7): **eig. UI-Pfad** `DocumentsApi.moveDocument` (`POST /content/buckets/{bucket}/documents/move`), same-bucket, neuer Key →
  **HTTP 200** ✓ (O3-Empfehlung bestätigt). `makefile`/`delete`→Papierkorb ebenfalls 200.

### 10.2 ⚠️ Gefundene Probleme (kein eindeutiger Frontend-Codefehler in O1-Bereich → **kein** Fix ohne Freigabe, AGENTS §1.2/§7)
| ID | Befund | Beleg | Kategorie / Empfehlung |
|---|---|---|---|
| L1 | **PDF Open-by-type rendert nicht**: Route öffnet, Asset `viewer-5.4.1095.min.mjs` → **401** | `12-pdf-open.png` | Env/Asset+Auth (→ **O10**); Bild-Open OK. Kein Frontend-Codefix |
| L2 | **Favoriten „hinzufügen" 401** (`setFavorite` POST), „entfernen" 200 (`unmarkFavorite` DELETE) | API-Run | Permission/Methoden-Asymmetrie → **O9** |
| L3 | **Intermittenter 403** auf `direct?download=` kurz nach Login (Dann 200) | API-Run | WAF/Rate-Limit (kein ID-Form fehler) |
| L4 | **`@ngrx/signals`: „SignalStore members cannot be overridden"** (`isLoading,error`/`hasError`/`fitToWidth`) in `clipboard`/`bucket`/`pdf-viewer` stores | Console (754–948 msgs/Session) | Pre-existing Anti-Pattern/Noise (nicht meine Dateien) |
| L5 | **§4.2 Logging-Noise live** (754–948 Console/Session; `[array Array]`= `devLog` der `app.routes`; `NavigationStart`; Bucket/Subfolder-Logs) | Console | Bestätigt (AGENTS §4.2) — Feinschliff |
| L6 | **UX-Minor:** „Eigenschaften"-Modal hat **zwei** Schließ-Buttons („Abbrechen"+"Schließen") | `10--properties.png` | Cosmetic |
| L7 | **Flakes im Listing**: `documentlist` mal 19/21/0 Einträge, teils Nicht-Array | API-Run | Backend-/Proxy-Stabilität |

### 10.3 Guardrail-Status
`git diff` unter `api/`, `plugin-fetch-client/`, `spec/*.yaml`/`spec/` = **0** (nur `ui/src/**` + `ui/tests/**`). **Kein** Commit/Push/Deploy.
Throwaways in `_tmp` **vollständig entfernt**.

> **Fazit**: O1 (WP-FM.0.1) ist **bestätigt** → WP-FM.3–5 DEBLOCKIERT. Die O1-unabhängigen Features (B1/B5/B7/F7/F9-Image/F13/F22) laufen
> korrekt live. Neue **Folgefragen** O9/O10 (Favoriten-401, PDF-Asset-401) + Latentbeobachtungen (folders?id=root, 403) —
> **keine** Frontend-Code-Änderung ohne Nutzerfreigabe (AGENTS §1.2/§7). Nächste sinnvolle Schritte: O9/O10 an Backend/Infra (Asset-Sync,
> RBAC) weitergeben; dann WP-FM.3/5 (F10/F19/F17/F18/F20/F21) aktivieren.



## 7. API-Kompatibilitäts-Schutz (AGENTS §1.1) — unbeirrbar

- **Ni-em** `api/fetch-client/`, `api/plugin-fetch-client/`, `spec/*.yaml`, `spec/*.json` (generiert) ändern. `git diff` = **0** dort.
- **Kein** Endpunkt/HTTP-Method/Query-Param/Request-Response-Schema/Upload-Download-Zeitform/Fehlerkonvention/Auth-Handling verändern.
- `FilemanagerApi` verdrahten (WP-FM.1) = **nur** UI-Seite in `FetchApiFactory` (klass ist schon da, generiert). **Kein** Regenerieren,
  **kein** Handedit der generierten Klasse.
- Bei unklarem Vertrag (`_delete`/`restore`/Progress/`icons`): **bestand-beib-eten** und **dokumentieren** — **nicht** raten.
- **Kein** Commit/Push/Deploy (AGENTS §1.3), nur auf `agenticUpdate`.

## 8. Teststrategie

- **Vor** jedem kritischen Umbruch: betroffene Unit-Test ergänzen (AGENTS §1.2). Neue Specs, **keine** Schwächung/Entfernung.
- **Di-Harness:** `filemanagerApi`-Mock in betroffenen Spec-Testbeds (parallel `documentsApi`), wo `FilemanagerApi`-Abhangigkeit kommt.
- **Fokus** pro WP: `converter.service`, `filemanager-context-menu.service`, `filemanager.service`, `filemanager.store`,
  `filemanager-content`/`facade`, `filemanager-workspace.service`, `keyboard-shortcuts.service`, `pdf-viewer`/`converter`-Direct-Link-Specs.
- **Validierung je WP (AGENTS §6):** `tsc(app+spec)` grün · `ng build` grün · betroffene Karma-Specs grün · Prettier · `git diff` 0 unter `api/`.
- **Regressionsschutz für B9:** Test, dass native `Ctrl/⌘+C/X/V/A`/`Delete` **nicht** blockiert werden (heute ist der Fall).

## 9. Status-Log / Changelog (Fortschrott — fortsetzen)

- **2026-10 (WP-FM.0):** Plan + API-Mapping + Defizite (B1–B13) + Feature-Katalog (F1–F26) angelegt. **Nur Doku.** Keine Code-/API/Deploy-Änderung.
  Baseline: `ng build` grün; Karma-Suite ~367/370 SUCCESS (3 intentional xit; umfeldbedingter Chromium-Disconnect nicht blockierend).
- **Offen für Nutzerbestätigung:** O1–O8 (insb. O1/Phase-1-Blockade, O3/O5/O6). Umsetzung **steht** bis zu Bestätigung.
- **Nächster Schritt:** Nutzerfreigabe zu O1–O8 → dann WP-FM.1 (Verdrahtung) + WP-FM.2x (Bugfixes, unabhängig von O1).

---

- **2026-10 (Umsetzungs-Batch, WP-FM.1a/1b + Phase-2-O1-unabhängig):** Auf Nutzer-Anweisung „Plan umsetzen" — O1-unabhängige, verhaltenserhaltende, nicht-erfindende Teilmenge umgesetzt (UI-only, **kein** API-/Backend-/Deploy-Wechsel; `git diff` unter `api/`, `spec/*.yaml`, `spec/` = 0).
  - **Erledigt:** WP-FM.1a/1b (`FilemanagerApi` in `FetchApiFactory` + DI-Harness/Spec, harmlos — noch kein Aufruf); B1/F7 (**WP-FM.2a**) echter Download-Trigger; B2·B3 (**WP-FM.2b**) `normalizeInputPaths` (JSON-Vertrag erhalten, roher Key wirft nicht), `getDirectLink` öffentlich, echte `console.error` statt `// TODO`; **B5** reale `getFileSize` (statt hartcod `'2.5 MB'`); B7/F13 (**WP-FM.2d**) Rename via `DocumentsApi.moveDocument` (O3-Empfehlung) + `reloadCurrentLocation()`; B7/F7 (**WP-FM.2e**) `copyLink` über `getDirectLink`+Clipboard; B7/F22 (**WP-FM.2f**) `showProperties` über `Document`-Felder + `ConfirmationDialog` (ohne `getDocumentMeta`/Tags/erfundenes Endpunkt); B8/F9 (**WP-FM.2g**) Double-Click öffnet nach Typ (WC-konditional, Fallback=Select); B9/F24 (**WP-FM.2h**) Tastatur-`enabled`-Flag → native Tasten durch + Regressionstest.
  - **Bestätigt, nicht entfernt (WP-FM.0.2):** B10 (`image-editor-dialog`), B11 (`FilemanagerTagsFacade`), B12 (leere `filemanager.facade`-Methoden) — je 0 Externe-Referenzen → Löschung erst nach Nutzerfreigabe (WP-FM.8b).
  - **Offen / ausgeschoben (nicht autonom abschließbar):** B4/B6/O6 echter Upload-Progress (natives XHR umgeht `putDocument`+Auth-Middleware); B13 Feinschliff-Typen (bewusst erhalten); WP-FM.2i (F11 Text, O2); Phasen 3–5 (O1-aktivierung von `FilemanagerApi`-Features: F10/F19/F17/F18/F20/F21) + F15/F16/F23/F24-voll + a11y/WP-FM.7b — warten auf O1-Lauffzeit-Verifikation (WP-FM.0.1) bzw. O4/O5-Entscheidungen.
  - **Validierung:** `cd ui && npm run build` → **Exit 0**, „Application bundle generation complete", 0 `error TS`; nur vorgelagerte „Empty sub-selector"-CSS-Warnungen. `git diff` unter `api/`/`spec/*.yaml`/`spec/` = 0 (nur UI + `/docs`).
  - **Wichtig für die nächsten Schritte:** `FilemanagerApi` ist jetzt **verdrahtet**, aber **kein** Feature aktiviert, das sie ruft — die O1-Klausel (WP-FM.0.1) gilt weiterhin für WP-FM.3–5 (F10/F19/F17/F18/F20/F21).
- **2026-10 (Live-Betriebstest, admin/admin123):** Auf Nutzer-Anweisung „im Test mit Screenshots anschauen + API testen + Fehler finden" —
  headless-Chromium (echtes Login-Formular) + direktes `fetch`-API-Testing. **Ergebnis:** O1 **bestätigt** (WP-FM.0.1 → WP-FM.3–5 DEBLOCKIERT);
  O1-unabhängige Features (B1/B5/B7/F7/ **F9-Bild**-Open/F13/F22) **live korrekt**; **Favoriten-401** + **PDF-Asset-401** + **möglicher 403**
  + **@ngrx-Store-Override-Warning** + **§4.2 Noise (754–948 Console/Session)** als Funde (→ **O9/O10** + §10). **Kein** Front-End-Code-Fix
  (keines eindeutig im O1-Bereich; AGENTS §1.2/§7). Schreibtests **reversibel im `_tmp`**, danach **vollständig aufgeräumt**. Funde in
  **§10** + Offene **O9/O10**. **Kein** Commit/Push/Deploy.
