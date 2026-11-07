# Changes from stock midnight

General rule: wherever stock Discord dark mode uses white text or icons on its own colours, so does this theme. On the theme's blue (accent) backgrounds, text and icons are dark (`--text-on-accent`). Colours that Discord uses for meaning (status, red and green buttons, warnings) are Discord's own.

## Settings (`settings.css`)

| Area | Change |
| --- | --- |
| Font | Discord's own font (gg sans), and no Google Fonts download. |
| Window buttons | Discord's normal minimise, maximise and close buttons. |
| DM button | Discord logo instead of the moon, coloured like the add server and discovery icons. |
| User panel | Full width under the server list, like stock (`--small-user-panel: off`). |
| Animations | No slide-out when hovering channels, DMs and members. |
| Backgrounds | Onyx-style: pure black panels, #101013 message box and gaps, neutral greys. |
| Text | Neutral Onyx-matched greys instead of blue-tinted ones. |
| Hover | Neutral and strong enough to show on black, for channels, buttons and messages. |
| Mentions and replies | Solid backgrounds instead of fading to the right (blue for mentions, grey for replying-to and jump highlights). |
| Red, green, yellow | Discord's own colours (do not disturb, online, idle, red and green buttons, warnings) instead of pastels. |
| Text on colours | `--text-0` is white; new `--text-on-accent` is dark for the theme's blue. |

## Patches to the author's code (`patches.json`)

- No Google Fonts `@import`.
- Stock thin unread divider (the thick "improve unread divider" block is removed).
- Add server icon turns white on hover; switch knobs are dark on the blue.
- Server settings menu hover and selected highlights use `--hover` and `--active`, so they show against the sidebar.
- `--text-overlay-light` is light, so text over images and overlays (quest promoter names, Nitro tags) is readable.
- Badge, checkbox, primary and connect button, and info and warning notice text use `--text-on-accent`, as do the forum OP tag, add friend button, VC new badge, radio centres, screen picker and text selection.

## My rules (`additions.css`)

| Rule | What it does |
| --- | --- |
| Better Folders merge | An open folder joins onto the server list as one panel with a slimmer column (`--bf-column-padding`, `--bf-scrollbar-space`). |
| Game Activity Toggle icon | Over a nameplate, all user panel icons are the same near-white. |
| Square nameplate top | The nameplate's top corners are square when the game activity or voice panel sits above the user row. |
| Floating server settings | Server and channel settings float like the user settings popup: 64px/80px insets with the app dimmed behind, a 316px black sidebar with a divider, a centred content column (max 900px) and the close button in the top-right corner. |
| Dark text on the theme's blue | Blue-backed elements that use Discord's `--white` (unread badges, mention pills, unread bars, the NEW tag, bot tags) get dark text. |

## If something breaks

If a Discord update leaves something unstyled, sync the fork and let the rebuild run first. If the rebuild fails, its log names the change that no longer applies: inspect the element in Discord, then update the class or text in `patches.json` or `additions.css`.
