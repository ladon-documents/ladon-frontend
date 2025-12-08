# Ladon Frontend — Color variables & usage

This document explains the CSS variables defined in style/src/styles.css and how to use / override them in the app.

## Core variables

- `--primary-hue`  
  The single source-of-truth hue (0–360). All primary colors are derived from this hue using HSL.

- Derived variables (defined via daisyUI theme plugin in styles.css):
  - `--color-primary`  — hsl(var(--primary-hue) 88% 52%)
  - `--color-secondary` — hsl(var(--primary-hue) 88% 82%)
  - `--color-accent` — hsl(calc(var(--primary-hue) + 60) 88% 52%)

These derived variables are used throughout the UI and by DaisyUI.

## How to override the hue (build-time)

Edit `style/src/styles.css`:
```css
:root {
  --primary-hue: 212; /* change this value (0-360) and rebuild */
}
```
After change run your build/dev server so Tailwind/daisyUI picks up the change.

## How to override at runtime (client-side)

Change the CSS variable on the document root:

```html
<script>
  // set hue to 180
  document.documentElement.style.setProperty('--primary-hue', '180');
  // optionally switch daisyUI theme:
  document.documentElement.setAttribute('data-theme', 'dark'); // or 'light'
</script>
```

This updates all derived HSL colors immediately without rebuild.

## Use the variables in HTML / templates

```html
<button class="btn btn-primary"><h1 class="text-accent">Button</h1></button>
```
 > [!NOTE]
 > Read more about daisyUI [color options](https://daisyui.com/docs/colors/#list-of-all-daisyui-color-names)

> [!TIP]
> For more color variations which work great in darkmode aswell use the [color opacitiy options](https://daisyui.com/docs/colors/#color-opacity-and-muted-colors)

## Use in component SCSS / CSS

Prefer the derived variables for semantic clarity:

```scss
.my-button {
  background-color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 80%, transparent);
}
```

Or compose a variant using the hue:

```scss
.header {
  background: hsl(var(--primary-hue) 90% 45%);
}
```

## DaisyUI themes

The project defines `light` (default) and `dark` themes in `styles.css`. You can switch themes by setting `data-theme` on `<html>`:

```js
document.documentElement.setAttribute('data-theme', 'dark');
```

DaisyUI theme variables are tied to `--primary-hue` — changing the hue affects both themes where HSL is used.

---

## Further reading

* [dasiyUI Colors](https://daisyui.com/docs/colors)
* [daisyUI Theming](https://daisyui.com/docs/themes)
* [daisyUI Utilities & variables](https://daisyui.com/docs/utilities)