# substrate-design-system

Design system for Substrate — icons, with outputs for Phoenix/LiveView and Vite/Node apps.

Icons are sourced from Figma, exported as SVGs, and built into a Phoenix HEEx component and an npm-compatible package via a single build script. Both apps consume this repo as a git dependency — no registry required.

---

## Prerequisites

- [Node.js](https://nodejs.org) (any recent LTS) — needed to run the build script

---

## Using in a Phoenix / LiveView app

### 1. Add the dependency

In your app's `mix.exs`:

```elixir
defp deps do
  [
    {:substrate_design_system, git: "https://github.com/YOUR_ORG/substrate-design-system"},
    # ...
  ]
end
```

Then fetch it:

```sh
mix deps.get
```

### 2. Import the component

In your app's `lib/my_app_web.ex`, add the import to the `html_helpers` or `components` section so it's available across all views:

```elixir
defp html_helpers do
  quote do
    import SubstrateDesignSystem.Icons
    # ...
  end
end
```

Or import it directly in a specific LiveView or component module:

```elixir
import SubstrateDesignSystem.Icons
```

### 3. Use in templates

```heex
<.icon name="download" size={24} />
<.icon name="settings" size={24} class="text-gray-500" />
<.icon name="checkmark-filled" size={24} class="text-green-600" />
```

### Component props

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `name` | `string` | required | Kebab-case icon name (see list below) |
| `size` | `integer` | `24` | Must match an exported size — currently only `24` |
| `class` | `string` | `nil` | Tailwind or CSS classes |
| rest | global attrs | — | Any other HTML attribute (`aria-*`, `data-*`, etc.) |

### Updating the dependency

When new icons are added to this repo:

```sh
mix deps.update substrate_design_system
```

---

## Using in a Vite / Node.js app

### 1. Add the dependency

In your app's `package.json`:

```json
{
  "dependencies": {
    "substrate-design-system": "github:YOUR_ORG/substrate-design-system"
  }
}
```

Then install:

```sh
npm install
```

### 2. TypeScript types

```ts
import { iconNames, type IconName, type IconSize } from 'substrate-design-system';

// iconNames — string[] of all 63 icon names
// IconName  — union type: "archive" | "dashboard" | "download" | ...
// IconSize  — 16 | 20 | 24 | 32
```

### 3. SVG sprite

The sprite bundles every icon as a `<symbol>`. Render it once at the top of your page, then reference icons anywhere:

```ts
// In your entry file (e.g. main.ts):
import spriteUrl from 'substrate-design-system/sprite.svg';

// Inject the sprite into the DOM
fetch(spriteUrl)
  .then(r => r.text())
  .then(svg => {
    const div = document.createElement('div');
    div.style.display = 'none';
    div.innerHTML = svg;
    document.body.prepend(div);
  });
```

Then use icons via `<use>`:

```html
<!-- name-size, e.g. download-24 -->
<svg width="24" height="24" aria-hidden="true">
  <use href="#download-24" />
</svg>
```

Or import raw SVGs directly:

```ts
import downloadIcon from 'substrate-design-system/icons/24/download.svg';
```

### Updating the dependency

```sh
npm update substrate-design-system
```

---

## Updating icons (when Figma changes)

1. Open the [Substrate Figma file](https://www.figma.com/design/FE4Dz4MjP5wSKOh4TyQMWO/Substrate?node-id=216-1220) and export updated icons as SVG (24×24)
2. Drop the `.svg` files into `icons/24/` — filenames must be kebab-case (e.g. `my-icon.svg`)
3. Run the build script:
   ```sh
   node scripts/build.js
   ```
4. Commit and push — `icons/`, `dist/`, and `lib/` all get committed:
   ```sh
   git add icons/ dist/ lib/
   git commit -m "Update icons"
   git push
   ```
5. Each consuming app pulls the update:
   ```sh
   # Phoenix app
   mix deps.update substrate_design_system

   # Vite app
   npm update substrate-design-system
   ```

> **Figma naming:** icon layer names in Figma are already kebab-case and match the filenames. When exporting, Figma uses the layer name as the filename — no renaming needed.

---

## Available icons

```
archive            archive-cabinet    archive-invoice    archive-quote
checkmark-filled   checkmark-outline  close-lg           close-sm
copy-document      copy-item          copy-link          dashboard
delete             design             down               download
edit               edit-pen           file-ai            file-eps
file-gen           file-jpg           file-pdf           file-png
file-svg           file-xls           filter             invoice
invoice-alt        kanban             left               left-arrow
left-arrow-1       link               lock-calc          menu-h
menu-v             new                options            pause-outline
pending            print              print-invoice      print-quote
print-work-order   production         quote              right
right-arrow        right-arrow-1      rush               rush-1
search             settings           suppliers          trash
unlock-calc        up                 update-invoice     upload
user               view               work-order
```

---

## Repo structure

```
icons/
  24/               ← source SVGs exported from Figma (one size, 24×24)
scripts/
  build.js          ← reads icons/, writes dist/ and lib/
dist/
  sprite.svg        ← SVG sprite (all icons as <symbol> elements)
  icons/24/         ← raw SVG copies
  index.js          ← JS exports (iconNames array)
  index.d.ts        ← TypeScript types (IconName union, IconSize)
lib/
  substrate_design_system/
    icons.ex        ← generated Phoenix function component
mix.exs             ← Elixir package config
package.json        ← npm package config
```

`dist/` and `lib/` are committed so consuming apps get pre-built outputs without needing to run the build script themselves.

---

## Renaming the Elixir module

To use a shorter namespace (e.g. `Substrate.Icons` instead of `SubstrateDesignSystem.Icons`), find-and-replace `SubstrateDesignSystem` across `mix.exs`, `lib/`, and `scripts/build.js`, then re-run the build.
