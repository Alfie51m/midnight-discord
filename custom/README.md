# midnight (custom)

My personal version of [midnight](https://github.com/refact0r/midnight-discord), as one self-contained theme file with no imports.

**The theme file:** [`midnight-custom.theme.css`](./midnight-custom.theme.css). Download it and put it in your Vencord or BetterDiscord themes folder. Do not edit it by hand: it is rebuilt automatically.

## How it stays up to date

| What | How |
| --- | --- |
| Discord renames its classes | The author's workflow (`classUpdate.yml`) renames them in `build/` every day. `customBuild.yml` does the same for the files in this folder, then rebuilds the theme. |
| The author fixes or changes the theme | Click **Sync fork** on GitHub. The rebuild runs on its own after the sync. |
| One of my changes stops applying | The rebuild fails and GitHub emails you. The theme file keeps its last good version until it is fixed. |

To rebuild by hand: **Actions → Build custom theme → Run workflow**, or `node custom/build.mjs` locally.

GitHub turns off scheduled workflows after 60 days without activity in the repository. If that happens, open the Actions tab and turn them back on.

## Files

| File | What it holds |
| --- | --- |
| `settings.css` | My values for the theme's settings (colours, toggles). |
| `patches.json` | Small edits to the author's code in `build/midnight.css`. |
| `additions.css` | My own rules, added at the end of the theme. |
| `build.mjs` | Combines the author's latest theme with the three files above. |
| `CHANGELOG.md` | What each change does and why. |

The author's files are never edited, so syncing with the author never conflicts.
