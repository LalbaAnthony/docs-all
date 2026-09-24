# Contributing

- `.pdf` files are generated from `.md` files using https://apitemplate.io/pdf-tools/convert-markdown-to-pdf/.
- Each documentation folder should contain its own `assets` folder for storing images and other media files.
- Each documentation folder should have an `index.md` file as the main entry point.
- To edit a doc, modify the `.md` file and regenerate the `.pdf` file.
- Assets should always be stored in the `assets` folder and linked using the https://raw.githubusercontent.com/ CDN URL, for example: `content/my-doc/assets/download-screenshot.png` becomes `https://raw.githubusercontent.com/LalbaAnthony/docs-all/main/content/my-doc/assets/download-screenshot.png`.

## Checks

- `node scripts/check-docs.mjs` validates the rules above (also runs in CI on push/PR).
- `node --test "scripts/*.test.mjs"` runs the checker's unit tests.
- Optional pre-commit hook: `git config core.hooksPath .githooks`.
