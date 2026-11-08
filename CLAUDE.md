# midnight (custom)

A personal build of refact0r's [midnight](https://github.com/refact0r/midnight-discord) Discord theme. The theme is one generated file, `custom/midnight-custom.theme.css`, loaded by the owner's Vencord as an online theme from this repository's raw GitHub URL. Changes go live on the next Discord start after the file is committed to `master`.

## How the build works

- `custom/build.mjs` downloads the author's `build/midnight.css` and `themes/midnight.theme.css` (or reads them from `MIDNIGHT_DIR`), applies the three files below, and writes the theme. It exits 1 and names any change that no longer applies.
- `custom/settings.css`: values for midnight's settings variables, replaced by name. A new variable needs an `after: --name.` note in its comment.
- `custom/patches.json`: edits to the author's bundle. `var` sets a variable everywhere, `rule` replaces text inside the one rule with that exact selector line, `replace` and `remove-line` match exact text. Each patch must match, or the build fails.
- `custom/additions.css`: our own rules, appended last.
- `.github/workflows/customBuild.yml` runs daily: it downloads midnight into `.midnight/`, renames classes in it and in `custom/` with the pinned `refact0r/class-update`, builds, and commits.
- `custom/CHANGELOG.md` lists every change and why. Keep it in step with any change you make.

## Rules

- Never edit `custom/midnight-custom.theme.css`; edit the source files and run `node custom/build.mjs`.
- Check a refactor didn't change behaviour by comparing old and new output rule by rule (parse both with `css-tree` and diff the declarations), not by eye.
- Work on a branch and open a pull request into `master`; the owner reviews and merges.
- Comment each rule with what it does and why, especially workarounds; the comments are the documentation.

## Colour rules

- On Discord's own colours, text and icons are white as in stock Discord dark mode (`--text-0` is white). On the theme's blue accent backgrounds they are dark: `--text-on-accent`, or `--white: var(--text-on-accent)` scoped to the element.
- Status, danger and success colours are Discord's own (red, green and yellow in `settings.css`). Backgrounds follow Discord's Onyx theme: black `--bg-4`, `#101013` `--bg-3`, neutral greys.
- midnight maps Discord's `--white` to `--text-0`, and some Discord surfaces use `--white`. Text or icons that turn up black usually trace back to that.
- Pure `blue`, `lime`, `magenta`, `yellow` or `red` on screen is one of midnight's unmapped placeholder variables. Map it with a `var` patch, as done for `--card-secondary-bg`.

## Discord quirks we learned the hard way

- Discord's screen-specific CSS (for example settings) loads after the theme, so equal or single-class selectors lose. Prefix with a parent class (we use `.layer_Fd0FEH`). Use `!important` only against inline styles or rules that keep winning.
- Discord animates layers with inline `transform` and `opacity`. A transform on any ancestor turns it into the frame for `position: fixed` children, which then stay inside that ancestor.
- The full-screen layer extends past the window by an amount that varies with window size, so place the server settings popup with `position: fixed`, not against the layer.
- Elements inside a scroller scroll with it. To pin something, give the scroller `position: static` and place it against the region outside.
- The desktop window buttons always draw above page content; nothing can be layered over them.
- Discord's own scripts set some sizes (server icons, list rows), so CSS can't resize those directly. Restyle within the row, or use `zoom` or `transform: scale`.
- The opening scroll position of server settings is Discord's own behaviour; a theme can't change it.
- Hashed class names (`name_hash`) change on Discord updates; the daily rename step handles them. Selectors like `[class*='content_']` survive renames but can match unrelated elements, so scope them.

## Investigating a visual bug

Don't guess at Discord's structure. Ask the owner to run a one-line console command (Ctrl+Shift+I, Console) that prints what's needed: an element's ancestors with classes, computed `position`, `transform` and `max-width`, `document.elementsFromPoint`, or the style rules that set a property. Write the rule from that, then ask the owner to check it in Discord, since agents can't see the client.
