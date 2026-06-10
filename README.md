# substrate-design-system

Design system for Substrate — icons, with outputs for Phoenix/LiveView and Vite/Node apps.

Icons are sourced from Figma, exported as SVGs, and processed by a build script that optimises them via SVGO and normalises all colours to `currentColor`. The Elixir side reads the processed SVGs at compile time and generates one Phoenix function component per icon. The Vite side consumes the pre-built sprite and individual SVG files directly from the repo.

Both apps consume this repo as a git dependency — no registry required.

---

## Prerequisites

- [Node.js](https://nodejs.org) (any recent LTS) — needed by contributors to run the build script. **Consuming apps do not need Node.js.**

---

## Using in the Substrate app (Phoenix / LiveView)

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

### 2. Alias the module

In `lib/my_app_web.ex`, add the alias to `html_helpers` so every LiveView and component has access:

```elixir
defp html_helpers do
  quote do
    alias SubstrateDesignSystem.Icons
    # ...
  end
end
```

### 3. Use in templates

Each icon is its own function. The function name is the kebab-case filename with dashes replaced by underscores:

```heex
<Icons.check class="size-5 text-green-600" />
<Icons.trash class="size-5 text-red-500" />
<Icons.settings class="size-6 text-gray-400" />
<Icons.arrow_path class="size-4 text-blue-500 animate-spin" />
```

Size and colour are controlled entirely via CSS — use Tailwind `size-*` or `w-* h-*` for dimensions, and `text-*` for colour (icons use `currentColor`).

For the 32px and 48px design-system icons, the size is part of the name:

```heex
<Icons.design_32x32 class="text-gray-700" />
<Icons.production_48x48 class="text-gray-700" />
```

### Component attrs

| Attr | Type | Default | Notes |
|------|------|---------|-------|
| `class` | `string` | `nil` | Tailwind or CSS classes for size and colour |
| rest | global attrs | — | Any HTML attribute (`aria-*`, `data-*`, `id`, etc.) |

### Updating the dependency

When new icons are added to this repo:

```sh
mix deps.update substrate_design_system
```

---

## Using in the Marketing site (Vite)

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

### 2. SVG sprite

The sprite bundles every icon as a `<symbol>`. Load it once in your entry file, then reference icons anywhere with `<use>`.

```ts
// main.ts — inject the sprite into the DOM once
import spriteUrl from 'substrate-design-system/sprite.svg';

fetch(spriteUrl)
  .then(r => r.text())
  .then(svg => {
    const div = document.createElement('div');
    div.style.display = 'none';
    div.innerHTML = svg;
    document.body.prepend(div);
  });
```

```html
<!-- symbol IDs are kebab-name + size: check-24, settings-24, design-32x32-32, etc. -->
<svg width="24" height="24" aria-hidden="true">
  <use href="#check-24" />
</svg>
```

Colour is controlled via the CSS `color` property — icons use `currentColor`:

```html
<svg width="20" height="20" style="color: #16a34a" aria-hidden="true">
  <use href="#check-24" />
</svg>
```

Or with Tailwind:

```html
<svg class="size-5 text-green-600" aria-hidden="true">
  <use href="#check-24" />
</svg>
```

### 3. Individual SVG imports

For component-based frameworks (React, Vue, Svelte):

```ts
import CheckIcon from 'substrate-design-system/icons/24/check.svg';
```

### 4. TypeScript types

```ts
import { iconNames } from 'substrate-design-system';
import type { IconName, IconSize } from 'substrate-design-system';

// iconNames — string[] of all icon names
// IconName  — union type: "archive" | "check" | "settings" | ...
// IconSize  — 16 | 20 | 24 | 32 | 48
```

### Updating the dependency

```sh
npm update substrate-design-system
```

---

## Updating icons (contributors)

1. Open the [Substrate Figma file](https://www.figma.com/design/FE4Dz4MjP5wSKOh4TyQMWO/Substrate?node-id=216-1220) and export updated or new icons as SVG
2. Drop the `.svg` files into the matching size folder — `icons/24/`, `icons/32/`, `icons/48/`, etc. Filenames must be kebab-case (e.g. `my-icon.svg`)
3. Run the build script:
   ```sh
   node scripts/build.js
   ```
   This runs SVGO optimisation, normalises all fill/stroke colours to `currentColor`, writes processed SVGs to `priv/icons/` (consumed by the Elixir package) and rebuilds `dist/` (consumed by Vite).

4. Commit and push — `icons/`, `priv/`, and `dist/` all get committed:
   ```sh
   git add icons/ priv/ dist/
   git commit -m "Update icons"
   git push
   ```

5. Each consuming app pulls the update:
   ```sh
   # Substrate app (Phoenix)
   mix deps.update substrate_design_system

   # Marketing site (Vite)
   npm update substrate-design-system
   ```

> **Figma naming:** icon layer names in Figma are already kebab-case and match the filenames. When exporting, Figma uses the layer name as the filename — no renaming needed.

> **Elixir function names:** dashes in filenames become underscores in function names. `arrow-path.svg` → `Icons.arrow_path`.

---

## Available icons

All icons are 24px unless the name includes a size suffix (`-32x32`, `-48x48`).

```
archive              archive_cabinet      archive_invoice      archive_quote
arrow_path           arrow_top_right_on_square               arrow_uturn_left     bell
bell_slash           building_office_2    chart_bar            check
checkmark_filled     checkmark_outline    close_lg             close_sm
copy_document        copy_item            copy_link            currency_dollar
dashboard            delete               design_24x24         design_32x32
design_48x48         down                 download             due_soon
edit                 edit_pen             exclamation_circle   file_ai
file_eps             file_gen             file_jpg             file_pdf
file_png             file_svg             file_xls             filter
has_comments         history_order        invoice              invoice_alt
kanban               left                 left_arrow           left_arrow_1
link                 list                 lock                 lock_calc
menu_h               menu_v               new                  options
palette              pause_outline        pending              print
print_invoice        print_quote          print_work_order     production
production_24x24     production_32x32     production_48x48     production_complete
quote_24x24          quote_32x32          quote_48x48          quote_sent
right                right_arrow          right_arrow_1        rush
rush_1               search               send_production      settings
shield_check         suppliers            trash                unlock_calc
up                   update_invoice       upload               user
view                 work_order           wrench_screwdriver
```

For Vite/sprite usage, replace underscores with dashes and append the size: `arrow_path` → `#arrow-path-24`.

---

## Repo structure

```
icons/
  24/               ← source SVGs at 24×24 (export from Figma here)
  32/               ← source SVGs at 32×32
  48/               ← source SVGs at 48×48
priv/
  icons/
    24/             ← optimised + currentColor SVGs (generated by build script, committed)
    32/
    48/
dist/
  sprite.svg        ← SVG sprite (all icons as <symbol> elements)
  icons/            ← optimised SVG copies organised by size
  index.js          ← JS exports (iconNames array)
  index.d.ts        ← TypeScript types (IconName union, IconSize)
scripts/
  build.js          ← runs SVGO, normalises colours, writes priv/ and dist/
lib/
  substrate_design_system/
    icons.ex        ← compile-time macro — reads priv/icons/ and generates one function per icon
mix.exs             ← Elixir package config
package.json        ← npm package config
```

`priv/` and `dist/` are committed so consuming apps get pre-built outputs without needing to run the build script themselves.
