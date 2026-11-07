// Builds custom/midnight-custom.theme.css: one self-contained theme file (no @import) made from
// the author's current theme (themes/midnight.theme.css + build/midnight.css) with your changes applied:
//   custom/patches.json   edits to build/midnight.css
//   custom/settings.css   your values for the theme's settings variables
//   custom/additions.css  your own rules, added at the end
// Run: node custom/build.mjs   (exits 1 and names the problem if a change no longer applies)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const problems = [];

// 1. the author's bundled code, with your patches
let bundle = read('build/midnight.css');
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
        if (count === 0) problems.push(`${label}: --${p.name} is not defined in build/midnight.css`);
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

// 2. the author's settings, with your values
const theme = read('themes/midnight.theme.css');
const importLine = theme.match(/^@import url\([^)]*\);\s*$/m);
if (!importLine) problems.push('themes/midnight.theme.css: no @import line found to split header from settings');
let settings = importLine ? theme.slice(importLine.index + importLine[0].length).trim() : '';

for (const m of read('custom/settings.css').matchAll(/^--([\w-]+):\s*(.*?);\s*(\/\*.*\*\/)?\s*$/gm)) {
    const [, name, value, comment = ''] = m;
    const re = new RegExp(`^(\\s*--${name}:\\s*)[^;]*;`, 'm');
    if (re.test(settings)) {
        settings = settings.replace(re, `$1${value}; /* CUSTOMISED */`);
    } else {
        const after = comment.match(/after: --([\w-]+)/);
        const anchor = after && new RegExp(`^(\\s*)--${after[1]}:[^\\n]*$`, 'm').exec(settings);
        if (!anchor) problems.push(`settings: --${name} is not in the theme and has no usable "after:" note`);
        else {
            const at = anchor.index + anchor[0].length;
            settings = `${settings.slice(0, at)}\n${anchor[1]}--${name}: ${value}; /* CUSTOMISED: added */${settings.slice(at)}`;
        }
    }
}

// 3. your own rules
const additions = read('custom/additions.css').trim();

if (problems.length) {
    console.error(`Build failed: ${problems.length} change(s) no longer apply to the current theme.\n- ${problems.join('\n- ')}`);
    process.exit(1);
}

const version = (theme.match(/@version\s+(\S+)/) || [])[1] || '?';
const header = `/**
 * @name midnight (custom)
 * @description midnight ${version} with personal changes, bundled into one file (no imports). Built by custom/build.mjs, do not edit by hand.
 * @author refact0r, customised by Alfie51m
 * @version ${version}
 * @source https://github.com/Alfie51m/midnight-discord
 */`;

writeFileSync(
    join(root, 'custom/midnight-custom.theme.css'),
    `${header}\n\n/* ===== midnight theme modules (build/midnight.css, with custom/patches.json applied) ===== */\n${bundle.trim()}\n\n/* ===== settings (themes/midnight.theme.css, with custom/settings.css applied) ===== */\n${settings}\n\n/* ===== your rules (custom/additions.css) ===== */\n${additions}\n`
);
console.log(`Built custom/midnight-custom.theme.css from midnight ${version}: ${patches.length} patches applied.`);
