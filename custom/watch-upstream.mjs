// Flags changes in the author's theme that touch the Discord classes our own rules and patches use.
// The build already fails if a patch stops matching; this catches the quieter case: the author adds,
// changes or removes styling for an element we also style, which could clash without any error.
//
// Compares the author's commit recorded in custom/upstream.json with his latest, looks at the lines that
// changed in his src/*.css (ignoring pure class renames), and writes a report to $REPORT_FILE if any
// changed line mentions a class used in custom/additions.css or custom/patches.json. Then records the
// latest commit. Run: node custom/watch-upstream.mjs

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const UPSTREAM = 'refact0r/midnight-discord';
const stateFile = join(root, 'custom/upstream.json');
const gitDir = join(root, '.midnight-git');
const git = (...args) => execFileSync('git', ['-C', gitDir, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

// the author's history, without file contents until a diff needs them
if (!existsSync(gitDir)) {
    execFileSync('git', ['clone', '--quiet', '--filter=blob:none', '--no-checkout', `https://github.com/${UPSTREAM}`, gitDir]);
} else git('fetch', '--quiet', 'origin');
const latest = git('rev-parse', 'origin/HEAD').trim();

const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
const save = () => writeFileSync(stateFile, JSON.stringify({ ...state, commit: latest }, null, 2) + '\n');

if (!state.commit) {
    save();
    console.log(`No previous commit recorded; starting from ${latest.slice(0, 7)}.`);
    process.exit(0);
}
if (state.commit === latest) {
    console.log(`No changes in ${UPSTREAM} since ${latest.slice(0, 7)}.`);
    process.exit(0);
}

// classes our customisations depend on (hashed Discord class names, e.g. layer_Fd0FEH)
const classRe = /[A-Za-z][\w-]*_[A-Za-z0-9-]{6}(?![\w-])/g;
const watched = new Set([
    ...readFileSync(join(root, 'custom/additions.css'), 'utf8').match(classRe) ?? [],
    ...readFileSync(join(root, 'custom/patches.json'), 'utf8').match(classRe) ?? [],
]);

// lines the author added or removed, by file; a line whose only change is a class hash is a rename, not a change
// (covers both Discord's current hashes, e.g. panel_8eCwJY, and its older ones, e.g. zoomed__1505a)
const anyHash = /([A-Za-z][\w-]*?)_{1,2}[A-Za-z0-9-]{5,6}(?![\w-])/g;
const normalise = (line) => line.replace(anyHash, '$1_#').trim();
const diff = git('diff', '--unified=0', '--no-color', state.commit, latest, '--', 'src');
const files = {};
let file;
for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) file = line.replace(/^\+\+\+ (b\/)?/, '');
    else if (file && /^[+-](?![+-]{2} )/.test(line)) (files[file] ??= { '+': [], '-': [] })[line[0]].push(line.slice(1));
}

const findings = [];
for (const [name, { '+': added, '-': removed }] of Object.entries(files)) {
    const removedNorm = new Set(removed.map(normalise));
    const addedNorm = new Set(added.map(normalise));
    const changed = [
        ...added.filter((l) => !removedNorm.has(normalise(l))).map((l) => ['+', l]),
        ...removed.filter((l) => !addedNorm.has(normalise(l))).map((l) => ['-', l]),
    ];
    for (const [sign, line] of changed) {
        const hits = (line.match(classRe) ?? []).filter((c) => watched.has(c));
        if (hits.length) findings.push({ file: name, sign, line: line.trim(), hits: [...new Set(hits)] });
    }
}

const range = `${state.commit.slice(0, 7)}...${latest.slice(0, 7)}`;
const compare = `https://github.com/${UPSTREAM}/compare/${state.commit}...${latest}`;
if (findings.length) {
    const classes = [...new Set(findings.flatMap((f) => f.hits))].sort();
    const report = [
        `The author changed styling for ${classes.length} Discord class${classes.length === 1 ? '' : 'es'} that our own rules or patches also use (${range}). The build still succeeded, so nothing failed, but these may now clash with our changes. Check them in Discord and close this issue once done.`,
        '',
        `**Classes:** ${classes.map((c) => '`' + c + '`').join(', ')}`,
        '',
        `**Full comparison:** ${compare}`,
        '',
        '<details><summary>Changed lines</summary>',
        '',
        '```diff',
        ...findings.slice(0, 200).map((f) => `${f.sign} ${f.line}    /* ${f.file} */`),
        findings.length > 200 ? `… and ${findings.length - 200} more` : '',
        '```',
        '',
        '</details>',
    ].join('\n');
    if (process.env.REPORT_FILE) writeFileSync(process.env.REPORT_FILE, report);
    console.log(`${findings.length} changed line(s) in ${range} touch our classes: ${classes.join(', ')}`);
} else console.log(`${UPSTREAM} changed (${range}) but nothing touches our classes.`);

save();
