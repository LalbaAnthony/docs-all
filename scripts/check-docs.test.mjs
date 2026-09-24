import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';

import {
  CDN_PREFIX,
  checkPdfFreshness,
  checkReferences,
  checkStructure,
  extractUrls,
  findDocDirs,
  parseArgs,
  runChecks,
  stripCode,
} from './check-docs.mjs';

let root;

function write(relPath, content = '') {
  const abs = path.join(root, relPath);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

const messages = (issues) => issues.map((i) => `${i.level} ${i.file}${i.line ? `:${i.line}` : ''} ${i.message}`);

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'check-docs-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('findDocDirs', () => {
  test('detects folders holding .md files, ignoring assets and category folders', () => {
    write('content/cat/doc-a/index.md');
    write('content/cat/doc-a/assets/a.md');
    write('content/cat/doc-b/other.md');
    write('content/cat/empty/assets/.gitkeep');
    assert.deepEqual(findDocDirs(root), ['content/cat/doc-a', 'content/cat/doc-b']);
  });
});

describe('checkStructure', () => {
  test('accepts a valid doc folder', () => {
    write('content/cat/doc/index.md');
    write('content/cat/doc/index.pdf');
    write('content/cat/doc/assets/shot.png');
    assert.deepEqual(checkStructure(root), []);
  });

  test('flags missing index.md and assets/', () => {
    write('content/cat/doc/readme.md');
    const out = messages(checkStructure(root));
    assert.equal(out.length, 2);
    assert.match(out[0], /content\/cat\/doc missing index\.md/);
    assert.match(out[1], /content\/cat\/doc missing assets\/ folder/);
  });

  test('flags assets stored outside assets/', () => {
    write('content/cat/doc/index.md');
    write('content/cat/doc/assets/.gitkeep');
    write('content/cat/doc/shot.png');
    write('content/cat/doc/img/other.jpg');
    const out = messages(checkStructure(root));
    assert.deepEqual(out, [
      "error content/cat/doc/img/other.jpg asset must be stored in the doc's assets/ folder",
      "error content/cat/doc/shot.png asset must be stored in the doc's assets/ folder",
    ]);
  });

  test('flags PDFs without their source .md', () => {
    write('content/cat/doc/index.md');
    write('content/cat/doc/assets/.gitkeep');
    write('content/cat/doc/old.pdf');
    assert.deepEqual(messages(checkStructure(root)), ['error content/cat/doc/old.pdf generated PDF has no source old.md']);
  });

  test('reports a missing content folder', () => {
    assert.match(messages(checkStructure(root))[0], /content folder not found/);
  });
});

describe('stripCode / extractUrls', () => {
  test('ignores fenced and inline code, keeps line numbers', () => {
    const md = ['```', '![x](a.png)', '```', '`![y](b.png)`', '![z](c.png)'].join('\n');
    assert.equal(stripCode(md).split('\n').length, 5);
    assert.deepEqual(extractUrls(md), [{ url: 'c.png', line: 5 }]);
  });

  test('handles tilde fences and nested backtick fences', () => {
    const md = ['~~~', '![x](a.png)', '```', '~~~', '![z](c.png)'].join('\n');
    assert.deepEqual(extractUrls(md), [{ url: 'c.png', line: 5 }]);
  });

  test('extracts markdown, HTML and reference-style targets', () => {
    const md = ['![a](one.png "title")', '<img alt="x" src="two.png" width="4"/>', '[ref]: three.png', '[link](page.md)'].join(
      '\n',
    );
    assert.deepEqual(
      extractUrls(md).map((u) => u.url),
      ['one.png', 'two.png', 'three.png', 'page.md'],
    );
  });
});

describe('checkReferences', () => {
  const md = 'content/cat/doc/index.md';

  test('accepts a CDN URL pointing at an existing asset of the same doc', () => {
    write('content/cat/doc/assets/shot.png');
    assert.deepEqual(checkReferences(root, md, `![s](${CDN_PREFIX}content/cat/doc/assets/shot.png)`), []);
  });

  test('flags CDN URLs missing the content/ prefix, pointing at another doc or another branch', () => {
    const wrong = [
      `${CDN_PREFIX}cat/doc/assets/shot.png`,
      `${CDN_PREFIX}content/cat/other/assets/shot.png`,
      'https://raw.githubusercontent.com/LalbaAnthony/docs-all/dev/content/cat/doc/assets/shot.png',
    ];
    const issues = checkReferences(root, md, wrong.map((u) => `![s](${u})`).join('\n'));
    assert.equal(issues.length, 3);
    for (const issue of issues) assert.match(issue.message, /CDN URL must start with/);
  });

  test('flags CDN URLs pointing at a missing file', () => {
    const issues = checkReferences(root, md, `<img src="${CDN_PREFIX}content/cat/doc/assets/nope.png">`);
    assert.deepEqual(messages(issues), [`error ${md}:1 CDN URL points to a missing file: content/cat/doc/assets/nope.png`]);
  });

  test('flags local asset paths and suggests the CDN URL', () => {
    const issues = checkReferences(root, md, '![s](./assets/shot.png)\n![t](/content/x/y.gif)');
    assert.deepEqual(messages(issues), [
      `error ${md}:1 local asset path, use the CDN URL instead: ${CDN_PREFIX}content/cat/doc/assets/shot.png`,
      `error ${md}:2 local asset path, use the CDN URL instead: ${CDN_PREFIX}content/x/y.gif`,
    ]);
  });

  test('warns on external media, ignores regular links and anchors', () => {
    const body = ['![g](https://example.com/a.gif?x=1)', '[site](https://example.com)', '[doc](other.md)', '[top](#top)'].join('\n');
    assert.deepEqual(messages(checkReferences(root, md, body)), [
      `warning ${md}:1 external asset, consider storing it in assets/: https://example.com/a.gif?x=1`,
    ]);
  });
});

describe('checkPdfFreshness', () => {
  test('flags a changed .md whose .pdf was not regenerated', () => {
    write('content/cat/doc/index.md');
    write('content/cat/doc/index.pdf');
    assert.deepEqual(messages(checkPdfFreshness(root, ['content/cat/doc/index.md'])), [
      'error content/cat/doc/index.md modified but index.pdf was not regenerated',
    ]);
  });

  test('passes when both changed, when no PDF exists, or when the .md was deleted', () => {
    write('content/cat/doc/index.md');
    write('content/cat/doc/index.pdf');
    write('content/cat/nopdf/index.md');
    assert.deepEqual(
      checkPdfFreshness(root, [
        'content/cat/doc/index.md',
        'content/cat/doc/index.pdf',
        'content/cat/nopdf/index.md',
        'content/cat/gone/index.md',
        'README.md',
      ]),
      [],
    );
  });
});

describe('runChecks', () => {
  test('aggregates all rules and skips the PDF check without changed files', () => {
    write('content/cat/doc/index.md', `![s](${CDN_PREFIX}cat/doc/assets/s.png)`);
    write('content/cat/doc/index.pdf');
    write('content/cat/doc/assets/s.png');
    assert.equal(runChecks(root, null).length, 1);
    assert.equal(runChecks(root, ['content/cat/doc/index.md']).length, 2);
  });
});

describe('parseArgs', () => {
  test('parses modes', () => {
    assert.deepEqual(parseArgs([]), { mode: 'worktree', base: undefined, git: true });
    assert.equal(parseArgs(['--staged']).mode, 'staged');
    assert.deepEqual(parseArgs(['--base', 'origin/main']), { mode: 'base', base: 'origin/main', git: true });
    assert.equal(parseArgs(['--no-git']).git, false);
  });

  test('rejects invalid input', () => {
    assert.throws(() => parseArgs(['--base']), /requires a git ref/);
    assert.throws(() => parseArgs(['--nope']), /unknown argument/);
  });
});
