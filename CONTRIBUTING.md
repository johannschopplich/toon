# Contributing to TOON

Thanks for helping improve TOON — small contributions make a big difference. This document gives a short, practical guide to getting started.

## Quick start

1. Fork the repository and create a feature branch from `main`:

   git checkout -b my-fix-or-feature

2. Install dependencies:

   pnpm install

3. Run tests:

   pnpm test

4. (Optional) Run lint or formatting if available in `package.json` scripts:

   pnpm lint
   pnpm format

5. Run benchmarks (optional): see `benchmarks/README.md` for details.

## What you can do

- Fix typos and improve wording in `README.md` or `SPEC.md`.
- Add or improve `benchmarks/` README and reproducibility notes.
- Add small tests under `test/` for edge cases you find when reading the code.
- Add issue templates, contributing docs, or a code of conduct (files in `.github/`).

## Making a good pull request

1. Use a descriptive branch name and commit message.
2. Keep PRs small and focused — small changes are easier to review.
3. In the PR description include:
   - What you changed and why.
   - How to run or test the change locally.
   - Any related issue number (e.g. `#123`).
4. If your change touches docs, update `README.md` or `SPEC.md` accordingly.

## Tests & CI

- Run the test suite locally before opening a PR: `pnpm test`.
- If adding code, add a matching unit test in `test/` for the behavior you change.

## Code style

Follow the existing project conventions. If there is a lint script, run it locally.

## Reporting bugs

If you find a bug, open an issue using the provided bug report template in `.github/ISSUE_TEMPLATE/` (we provide a template in this repo).

## Code of Conduct

This project expects contributors to follow a Code of Conduct. See `CODE_OF_CONDUCT.md` for details.

## Need help?

- Open an issue and tag it `help wanted` or `good first issue`.
- Open a draft PR if you want early feedback on a proposed change.

Thank you for contributing — we appreciate your time and improvements!
