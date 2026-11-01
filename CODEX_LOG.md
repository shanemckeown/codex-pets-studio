# Codex build log

Record actual work, evidence and failures; never invent a problem to fill a template. All dates and times refer to London.

## 2026-11-01 — Repository preparation, before the build window

- Shane selected Charted and refined the journey: synthetic product barcode → dictated sites and amounts → explicit point movements → printable batch-linked record.
- Codex reviewed the brief and incorporated the approved category labels, explicit step commands, unified parser contract, preserved point numbering and two-command deletion confirmation.
- Codex prepared the README, public build brief, environment placeholder, ignore rules and submission checklist. No application code was copied from Aestheticc or implemented in this milestone.
- Documentation checked during planning: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [OpenAI API quickstart](https://developers.openai.com/api/docs/quickstart), [Codex quickstart](https://developers.openai.com/codex/quickstart), [zxing-wasm ReadResult](https://sec-ant.github.io/zxing-wasm/docs/interfaces/full.ReadResult.html), [GS1 healthcare expiry-date guidance](https://gs1.se/en/news/change-of-date-format-for-regulated-healthcare-products/).
- Concrete planning correction: the parser schema now has a root object containing nested command variants; a top-level discriminated union would conflict with the documented strict-output schema requirements. Implementation and live API validation remain pending.
- Verification: all seven initial files passed local-link and secret-pattern checks; `.env`, `.env.local` and production environment files are ignored, while the blank `.env.example` remains tracked. The public repository at https://github.com/shanemckeown/charted was created and its page/API were checked without authentication; the default branch is `main`. Application tests, builds and camera/voice verification are not yet available.

## Implementation milestone template

- Time and milestone:
- What was built:
- Documentation and versions used:
- Checks actually run and results:
- Actual issue and fix, if any:
- Remaining limitations:
