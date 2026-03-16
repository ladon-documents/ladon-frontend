# Ladon Media Player Web Component

Globale Web Component für die Anzeige von Audio-, Video- und Bilddateien.

## Features

- Video-Vorschau mit Timeline-Preview und Thumbnail-Strip
- Audio-Wiedergabe mit Waveform-Visualisierung
- EXIF/Metadaten-Editor mit Geo-Tags und Kamera-Info
- Einheitliches Custom Element: `ladon-media-player`

## Inputs

- `media-src` (string): URL/Data-URL der Mediendatei
- `media-type` (`auto` | `audio` | `video` | `image`): optionaler Type-Hint
- `file-name` (string): Anzeigename
- `metadata` (JSON string): initiale Metadaten

## Outputs

- `metadata-save`: Event mit dem bearbeiteten Metadaten-Payload

## Beispiel

```html
<ladon-media-player
  media-src="/assets/demo/video.mp4"
  media-type="video"
  file-name="drone.mp4"
  metadata='{"title":"Drohnenflug","tags":["drone","nature"]}'
></ladon-media-player>
```

## Build

```bash
npm run build
```

Bundle-Ausgabe: `dist/wc-ladon-media-player.js`
