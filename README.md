# midnight (custom)

A personal version of [midnight](https://github.com/refact0r/midnight-discord), refact0r's dark Discord theme, with Discord's own look restored where it matters and Onyx-black colours. It's built into one self-contained file that updates itself every day.

![Preview of the midnight theme](./assets/preview.png)

*Preview of the original midnight theme. This version keeps its layout but uses pure black backgrounds, Discord's own icons, window buttons, font and status colours, and a floating server settings popup. See [what's changed](#whats-changed).*

## Install

**Vencord (recommended, updates itself):** open **Settings → Themes → Online Themes** and add:

```
https://raw.githubusercontent.com/Alfie51m/midnight-discord/master/custom/midnight-custom.theme.css
```

Vencord loads online themes when Discord starts, or when you press Ctrl+R. Turn off any other copy of midnight so it doesn't load twice.

**BetterDiscord or offline use:** download [`custom/midnight-custom.theme.css`](./custom/midnight-custom.theme.css) and put it in your themes folder. A downloaded copy doesn't update itself, so download it again when you want the latest version.

## What's changed

Compared with stock midnight:

- **Discord's look:** its own font, window buttons, DM button logo, user panel layout and thin unread divider.
- **Onyx colours:** pure black panels, neutral greys instead of blue-tinted ones, and hover highlights that show up on black.
- **Discord's colours for meaning:** status colours (online, idle, do not disturb) and red and green buttons. White text and icons wherever stock Discord uses them, and dark text on the theme's blue.
- **Solid highlights:** mentions and replies get solid backgrounds instead of fading out to the right.
- **Server settings as a floating popup** like user settings, with a pinned server name, pages that use the full width, and click outside to close.
- **Plugin and detail fixes:** an open Better Folders folder joins onto the server list, the Game Activity Toggle icon matches the other panel icons, nameplates have square corners under the activity panel, and connection logos and quest labels are readable.

The full list, with every changed setting, is in [`custom/CHANGELOG.md`](./custom/CHANGELOG.md).

## How it stays up to date

A daily GitHub Actions workflow ([`customBuild.yml`](./.github/workflows/customBuild.yml)) rebuilds the theme at about 02:17 UTC:

1. It downloads the author's latest midnight from [refact0r/midnight-discord](https://github.com/refact0r/midnight-discord), including any fixes he has made.
2. It renames Discord classes in both his theme and the custom rules, using the same bot ([`refact0r/class-update`](https://github.com/refact0r/class-update), pinned to an exact version) and rename list that the author uses. Renaming both sides together keeps them matched, even if the list changed after his own daily update.
3. It applies the changes in `custom/` and commits the new `custom/midnight-custom.theme.css`. The online theme link serves that file, so Vencord picks it up the next time Discord starts.

If one of the custom changes stops applying (for example after Discord restructures a screen), the build fails and GitHub emails you, naming the change. The previous theme file stays in place until it's fixed.

Some clashes don't make anything fail, for example if the author restyles an element that the custom rules also style. So each build also compares the author's latest version with the last one it saw ([`watch-upstream.mjs`](./custom/watch-upstream.mjs)). If a changed line uses a Discord class that the custom rules or patches also use, it opens an issue listing them, so you know what to check in Discord.

Three smaller safeguards:

- **Pull requests are checked:** the theme is built for every pull request, so a broken change shows as a failed check before merging. Nothing is committed from a pull request.
- **Actions stay up to date:** Dependabot ([`dependabot.yml`](./.github/dependabot.yml)) opens a pull request when an action the workflow uses has a new release.
- **The daily build stays on:** GitHub pauses scheduled workflows after 60 days without activity. If nothing has been committed for 50 days, the build adds an empty commit to keep it running.

To rebuild straight away, open **Actions → Build custom theme → Run workflow**.

## Making changes

Edit the files in `custom/`, never `midnight-custom.theme.css` itself. Pushing a change to `custom/` rebuilds the theme.

| File | What it holds |
| --- | --- |
| [`settings.css`](./custom/settings.css) | Your values for midnight's settings: colours, sizes and on/off options, one variable per line. |
| [`additions.css`](./custom/additions.css) | Your own CSS rules, added after the theme. |
| [`patches.json`](./custom/patches.json) | Small edits to the author's code, each with a note on why. |
| [`build.mjs`](./custom/build.mjs) | The build script that combines the author's theme with the three files above. |
| [`watch-upstream.mjs`](./custom/watch-upstream.mjs) | Flags the author's changes that touch classes the custom files use. It records his last seen version in `upstream.json`. |
| [`CHANGELOG.md`](./custom/CHANGELOG.md) | What each change does and why. |

To build locally, run `node custom/build.mjs` with Node 18 or newer. It downloads the author's theme itself, so there's nothing else to set up. (The workflow sets `MIDNIGHT_DIR` to build from its renamed copy instead.)

## If something looks wrong

- **Unstyled or broken after a Discord update:** wait for the next daily build, since the class renames and the author's fixes usually arrive then. Or run the workflow by hand.
- **The build failed:** its log names the change that no longer applies. Inspect the element in Discord (Ctrl+Shift+I), then update the class name or text in `additions.css` or `patches.json`.
- **A jarring pure blue, lime, magenta, yellow or red:** that's one of midnight's unmapped colour placeholders. Find the variable with Inspect, then map it in `patches.json`, as was done for `--card-secondary-bg`.

## Credits

midnight is made by [refact0r](https://github.com/refact0r) and released under the MIT licence, kept in [`LICENSE`](./LICENSE). This repository only adds personal changes on top. If you like midnight, consider [supporting the author](https://github.com/refact0r/midnight-discord).
