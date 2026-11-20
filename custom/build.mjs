// Builds the theme files, each one self-contained (no @import), from the author's latest theme, downloaded from
// github.com/refact0r/midnight-discord (build/midnight.css + themes/midnight.theme.css), with your changes applied:
//   custom/patches.json         edits to build/midnight.css (both themes)
//   custom/settings.css         your values for the theme's settings variables (both themes)
//   custom/settings-light.css   light theme only: its palette, applied on top of settings.css
//   custom/additions.css        your own rules, added at the end (both themes)
//   custom/additions-light.css  light theme only: extra rules, if the file exists
// Writes custom/midnight-custom.theme.css (dark) and custom/midnight-custom-light.theme.css (light).
// Run: node custom/build.mjs   (Node 18+; exits 1 and names the problem if a change no longer applies)

import { existsSync } from 'node:fs';

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const problems = [];

// the author's theme, straight from his repository (his own workflow keeps its class names current every day).
// With MIDNIGHT_DIR set, it's read from that folder instead, keeping his paths (build/midnight.css,
// themes/midnight.theme.css): the workflow downloads it there first and renames its classes with the same list
// as custom/, so both sides always match even if the list changed since his own daily update.
const UPSTREAM = 'refact0r/midnight-discord';
const branch = process.env.MIDNIGHT_BRANCH || 'master';
const localDir = process.env.MIDNIGHT_DIR;
const download = async (path) => {
    if (localDir) return readFileSync(join(localDir, path), 'utf8').replace(/\r\n/g, '\n');
    const res = await fetch(`https://raw.githubusercontent.com/${UPSTREAM}/${branch}/${path}`);
    if (!res.ok) throw new Error(`Could not download ${path} from ${UPSTREAM} (HTTP ${res.status})`);
    return (await res.text()).replace(/\r\n/g, '\n');
};
const [upstreamBuild, upstreamTheme] = await Promise.all([download('build/midnight.css'), download('themes/midnight.theme.css')]);

// 1. the author's bundled code, with your patches
let bundle = upstreamBuild;
const { patches } = JSON.parse(read('custom/patches.json'));

for (const p of patches) {
    const label = `${p.type} patch (${p.why})`;
    if (p.type === 'remove-line') {
        const lines = bundle.split('\n');
        const kept = lines.filter((l) => !l.startsWith(p.startsWith));
        if (kept.length === lines.length) problems.push(`${label}: no line starts with ${p.startsWith}`);
        bundle = kept.join('\n');
    } else if (p.type === 'replace') {
        const count = bundle.split(p.find).length - 1;
        if (count !== 1) problems.push(`${label}: text found ${count} times, expected once`);
        else bundle = bundle.replace(p.find, p.replace);
    } else if (p.type === 'var') {
        // every definition of --name inside the bundle (they live in colors.css)
        const re = new RegExp(`(^\\s*--${p.name}:\\s*)[^;]*;`, 'gm');
        const count = (bundle.match(re) || []).length;
        if (count === 0) problems.push(`${label}: --${p.name} is not defined in the author's build/midnight.css`);
        bundle = bundle.replace(re, `$1${p.value}; /* CUSTOMISED */`);
    } else if (p.type === 'rule') {
        // the one rule whose selector line is p.selector and whose body contains p.from
        const lines = bundle.split('\n');
        const hits = [];
        lines.forEach((line, i) => {
            if (line.trim() !== p.selector) return;
            for (let j = i + 1; j < lines.length && !lines[j].includes('}'); j++) {
                if (lines[j].includes(p.from)) {
                    hits.push(j);
                    break;
                }
            }
        });
        if (hits.length !== 1) problems.push(`${label}: rule "${p.selector}" containing "${p.from}" found ${hits.length} times, expected once`);
        else {
            lines[hits[0]] = lines[hits[0]].replace(p.from, p.to) + ' /* CUSTOMISED */';
            bundle = lines.join('\n');
        }
    } else problems.push(`unknown patch type: ${p.type}`);
}

// 2. the author's settings, with your values, and 3. your own rules, for each theme
const theme = upstreamTheme;
const importLine = theme.match(/^@import url\([^)]*\);\s*$/m);
if (!importLine) problems.push(`${UPSTREAM} themes/midnight.theme.css: no @import line found to split header from settings`);
const upstreamSettings = importLine ? theme.slice(importLine.index + importLine[0].length).trim() : '';

const applySettings = (settings, file) => {
    for (const m of read(file).matchAll(/^--([\w-]+):\s*(.*?);\s*(\/\*.*\*\/)?\s*$/gm)) {
        const [, name, value, comment = ''] = m;
        const re = new RegExp(`^(\\s*--${name}:\\s*)[^;]*;`, 'm');
        if (re.test(settings)) {
            settings = settings.replace(re, `$1${value}; /* CUSTOMISED */`);
        } else {
            const after = comment.match(/after: --([\w-]+)/);
            const anchor = after && new RegExp(`^(\\s*)--${after[1]}:[^\\n]*$`, 'm').exec(settings);
            if (!anchor) problems.push(`${file}: --${name} is not in the author's theme and has no usable "after:" note`);
            else {
                const at = anchor.index + anchor[0].length;
                settings = `${settings.slice(0, at)}\n${anchor[1]}--${name}: ${value}; /* CUSTOMISED: added */${settings.slice(at)}`;
            }
        }
    }
    return settings;
};

const themes = [
    { out: 'custom/midnight-custom.theme.css', name: 'midnight (custom)', settings: ['custom/settings.css'], additions: ['custom/additions.css'] },
    {
        out: 'custom/midnight-custom-light.theme.css',
        name: 'midnight (custom, light)',
        settings: ['custom/settings.css', 'custom/settings-light.css'],
        additions: ['custom/additions.css', 'custom/additions-light.css'],
    },
];
const built = themes.map((t) => ({
    ...t,
    settingsText: t.settings.reduce(applySettings, upstreamSettings),
    additions: t.additions.filter((f) => existsSync(join(root, f))),
}));

if (problems.length) {
    console.error(`Build failed: ${problems.length} change(s) no longer apply to the current theme.\n- ${problems.join('\n- ')}`);
    process.exit(1);
}

const version = (theme.match(/@version\s+(\S+)/) || [])[1] || '?';
for (const t of built) {
    const header = `/**
 * @name ${t.name}
 * @description midnight ${version} by refact0r with personal changes, bundled into one file (no imports). Built by custom/build.mjs, do not edit by hand.
 * @author refact0r, customised by Alfie51m
 * @version ${version}
 * @source https://github.com/Alfie51m/midnight-discord
 */`;
    const rules = t.additions.map((f) => `/* ===== your rules (${f}) ===== */\n${read(f).trim()}`).join('\n\n');
    writeFileSync(
        join(root, t.out),
        `${header}\n\n/* ===== midnight theme modules (refact0r's build/midnight.css, with custom/patches.json applied) ===== */\n${bundle.trim()}\n\n/* ===== settings (refact0r's themes/midnight.theme.css, with ${t.settings.join(' + ')} applied) ===== */\n${t.settingsText}\n\n${rules}\n`
    );
    console.log(`Built ${t.out} from midnight ${version}: ${patches.length} patches applied.`);
}
