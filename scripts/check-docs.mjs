#!/usr/bin/env node
/**
 * Enforces the rules from CONTRIBUTING.md on the `content/` tree:
 *   1. Each documentation folder has its own `assets/` folder.
 *   2. Each documentation folder has an `index.md` entry point.
 *   3. When a `.md` with a sibling `.pdf` changes, the `.pdf` must change too.
 *   4. Assets live in the doc's `assets/` folder and are referenced through
 *      the raw.githubusercontent.com CDN URL of this repository.
 *
 * A "documentation folder" is any directory under `content/` (outside of
 * `assets/`) that directly contains at least one `.md` file.
 *
 * Usage:
 *   node scripts/check-docs.mjs                 # PDF check against uncommitted changes
 *   node scripts/check-docs.mjs --staged        # PDF check against staged changes (pre-commit)
 *   node scripts/check-docs.mjs --base <ref>    # PDF check against <ref>...HEAD (CI)
 *   node scripts/check-docs.mjs --no-git        # skip the PDF check
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONTENT_DIR = 'content';
export const ASSETS_DIR = 'assets';
export const CDN_PREFIX = 'https://raw.githubusercontent.com/LalbaAnthony/docs-all/main/';

const CDN_REPO_PATTERN = /^https?:\/\/raw\.githubusercontent\.com\/LalbaAnthony\/docs-all\//i;
const MEDIA_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|avif|bmp|ico|mp4|webm|mov|mp3|wav|ogg|pdf|zip)$/i;

/** @typedef {{ level: 'error' | 'warning', file: string, line?: number, message: string }} Issue */

const toPosix = (p) => p.split(path.sep).join('/');

function listEntries(dir) {
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
}

/** Returns every file under `dir`, repo-relative, POSIX separators. */
function walkFiles(rootDir, dir) {
  const files = [];
  for (const entry of listEntries(dir)) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(rootDir, abs));
    else if (entry.isFile()) files.push(toPosix(path.relative(rootDir, abs)));
  }
  return files;
}

/** Returns repo-relative doc folders (dirs outside `assets/` that directly hold a `.md`). */
export function findDocDirs(rootDir) {
  const contentAbs = path.join(rootDir, CONTENT_DIR);
  const docDirs = [];
  const visit = (dir) => {
    const entries = listEntries(dir);
    if (dir !== contentAbs && entries.some((e) => e.isFile() && e.name.endsWith('.md'))) {
      docDirs.push(toPosix(path.relative(rootDir, dir)));
    }
    for (const e of entries) {
      if (e.isDirectory() && e.name !== ASSETS_DIR) visit(path.join(dir, e.name));
    }
  };
  visit(contentAbs);
  return docDirs;
}

/** Rules 1, 2 and the "assets are stored in assets/" half of rule 4. */
export function checkStructure(rootDir) {
  /** @type {Issue[]} */
  const issues = [];
  const contentAbs = path.join(rootDir, CONTENT_DIR);
  if (!existsSync(contentAbs)) {
    return [{ level: 'error', file: CONTENT_DIR, message: 'content folder not found' }];
  }

  for (const docDir of findDocDirs(rootDir)) {
    if (!existsSync(path.join(rootDir, docDir, 'index.md'))) {
      issues.push({ level: 'error', file: docDir, message: 'missing index.md entry point' });
    }
    const assetsAbs = path.join(rootDir, docDir, ASSETS_DIR);
    if (!existsSync(assetsAbs) || !statSync(assetsAbs).isDirectory()) {
      issues.push({
        level: 'error',
        file: docDir,
        message: `missing ${ASSETS_DIR}/ folder (add ${ASSETS_DIR}/.gitkeep if the doc has no assets yet)`,
      });
    }
  }

  for (const file of walkFiles(rootDir, contentAbs)) {
    const segments = file.split('/');
    if (segments.slice(0, -1).includes(ASSETS_DIR)) continue;
    const name = segments.at(-1);
    if (name.endsWith('.md')) continue;
    if (name.endsWith('.pdf')) {
      const sourceMd = file.replace(/\.pdf$/, '.md');
      if (!existsSync(path.join(rootDir, sourceMd))) {
        issues.push({ level: 'error', file, message: `generated PDF has no source ${path.posix.basename(sourceMd)}` });
      }
      continue;
    }
    issues.push({ level: 'error', file, message: `asset must be stored in the doc's ${ASSETS_DIR}/ folder` });
  }

  return issues;
}

/** Blanks fenced code blocks and inline code spans while preserving line numbers. */
export function stripCode(markdown) {
  const lines = markdown.split(/\r?\n/);
  let fence = null;
  return lines
    .map((line) => {
      const match = line.match(/^\s*(`{3,}|~{3,})/);
      if (fence) {
        if (match && match[1][0] === fence[0] && match[1].length >= fence.length) fence = null;
        return '';
      }
      if (match) {
        fence = match[1];
        return '';
      }
      return line.replace(/(`+)[^`]*?\1/g, (m) => ' '.repeat(m.length));
    })
    .join('\n');
}

/** Extracts link/image targets with their 1-based line number. */
export function extractUrls(markdown) {
  const patterns = [
    /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?/g, // [text](url) / ![alt](url)
    /<(?:img|video|audio|source|a)\b[^>]*?\s(?:src|href)\s*=\s*["']([^"']+)["']/gi, // HTML tags
    /^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s|$)/gm, // [id]: url
  ];
  const stripped = stripCode(markdown);
  const results = [];
  for (const pattern of patterns) {
    for (const match of stripped.matchAll(pattern)) {
      const line = stripped.slice(0, match.index + match[0].indexOf(match[1])).split('\n').length;
      results.push({ url: match[1], line });
    }
  }
  return results.sort((a, b) => a.line - b.line);
}

/** Rule 4: references to assets must use the CDN URL pointing at the doc's own assets/ folder. */
export function checkReferences(rootDir, mdFile, markdown) {
  /** @type {Issue[]} */
  const issues = [];
  const docDir = path.posix.dirname(mdFile);
  const expectedPrefix = `${CDN_PREFIX}${docDir}/${ASSETS_DIR}/`;

  for (const { url, line } of extractUrls(markdown)) {
    const bare = url.replace(/[?#].*$/, '');
    const at = { file: mdFile, line };

    if (CDN_REPO_PATTERN.test(bare)) {
      if (!bare.startsWith(expectedPrefix)) {
        issues.push({ level: 'error', ...at, message: `CDN URL must start with ${expectedPrefix} (got ${url})` });
        continue;
      }
      const repoPath = decodeURIComponent(bare.slice(CDN_PREFIX.length));
      if (!existsSync(path.join(rootDir, repoPath))) {
        issues.push({ level: 'error', ...at, message: `CDN URL points to a missing file: ${repoPath}` });
      }
      continue;
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(bare) || bare.startsWith('//')) {
      if (MEDIA_EXTENSIONS.test(bare)) {
        issues.push({ level: 'warning', ...at, message: `external asset, consider storing it in ${ASSETS_DIR}/: ${url}` });
      }
      continue;
    }

    if (bare === '' || !MEDIA_EXTENSIONS.test(bare)) continue;

    const repoPath = bare.startsWith('/')
      ? bare.slice(1)
      : path.posix.normalize(path.posix.join(docDir, decodeURIComponent(bare)));
    issues.push({ level: 'error', ...at, message: `local asset path, use the CDN URL instead: ${CDN_PREFIX}${repoPath}` });
  }

  return issues;
}

/** Rule 3: every changed `.md` with a sibling `.pdf` must come with a changed `.pdf`. */
export function checkPdfFreshness(rootDir, changedFiles) {
  const changed = new Set(changedFiles);
  /** @type {Issue[]} */
  const issues = [];
  for (const file of changed) {
    if (!file.startsWith(`${CONTENT_DIR}/`) || !file.endsWith('.md')) continue;
    if (!existsSync(path.join(rootDir, file))) continue;
    const pdf = file.replace(/\.md$/, '.pdf');
    if (existsSync(path.join(rootDir, pdf)) && !changed.has(pdf)) {
      issues.push({ level: 'error', file, message: `modified but ${path.posix.basename(pdf)} was not regenerated` });
    }
  }
  return issues;
}

function git(rootDir, args) {
  return execFileSync('git', args, { cwd: rootDir, encoding: 'utf8' })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/** @param {{ mode: 'worktree' | 'staged' | 'base', base?: string }} options */
export function getChangedFiles(rootDir, options) {
  switch (options.mode) {
    case 'staged':
      return git(rootDir, ['diff', '--name-only', '--cached']);
    case 'base':
      return git(rootDir, ['diff', '--name-only', `${options.base}...HEAD`]);
    case 'worktree':
      return [
        ...git(rootDir, ['diff', '--name-only', 'HEAD']),
        ...git(rootDir, ['ls-files', '--others', '--exclude-standard']),
      ];
    default:
      throw new Error(`unknown mode: ${options.mode}`);
  }
}

export function runChecks(rootDir, changedFiles) {
  const issues = checkStructure(rootDir);
  const contentAbs = path.join(rootDir, CONTENT_DIR);
  if (existsSync(contentAbs)) {
    for (const file of walkFiles(rootDir, contentAbs)) {
      if (!file.endsWith('.md') || file.split('/').includes(ASSETS_DIR)) continue;
      issues.push(...checkReferences(rootDir, file, readFileSync(path.join(rootDir, file), 'utf8')));
    }
  }
  if (changedFiles) issues.push(...checkPdfFreshness(rootDir, changedFiles));
  return issues;
}

export function parseArgs(argv) {
  const options = { mode: 'worktree', base: undefined, git: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--staged') options.mode = 'staged';
    else if (arg === '--no-git') options.git = false;
    else if (arg === '--base') {
      const base = argv[++i];
      if (!base) throw new Error('--base requires a git ref');
      options.mode = 'base';
      options.base = base;
    } else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

function main() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const options = parseArgs(process.argv.slice(2));
  const changedFiles = options.git ? getChangedFiles(rootDir, options) : null;
  const issues = runChecks(rootDir, changedFiles);

  for (const issue of issues) {
    const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
    const log = issue.level === 'error' ? console.error : console.warn;
    log(`${location}: [${issue.level}] ${issue.message}`);
  }
  const errors = issues.filter((i) => i.level === 'error').length;
  const warnings = issues.length - errors;
  console.log(`\n${errors} error(s), ${warnings} warning(s)`);
  process.exitCode = errors > 0 ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
  }
}
