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

## 2026-11-01, 12:30–13:35 — Codex Pets Studio implementation

- Shane pivoted the event project from charting/cosmetic exploration to a photo-to-desktop-pet creator, then clarified that real expressions must come from recorded photos. The initial planning history is preserved; the current authoritative brief is `docs/PET_STUDIO_BRIEF.md`.
- Codex implemented seven sequential captures (including the requested frown), laptop webcam access, mobile native-camera input and Photos fallback, automatic observable-property Decisions checks, explicit approval, retakes and optional further-side shots. Replacing the neutral reference clears the old set. Late webcam streams are stopped after navigation; audio tracks are stopped and the upload filename follows the recorder MIME type.
- Captured expression states provide observed landmark geometry and photo textures, registered to a shared eye/chin frame. Real-face mode does not synthesize facial expressions from the neutral shot. Synthetic-demo/generated-character mode explicitly labels its procedural fallback.
- Implemented the original-character route with one server-side `gpt-image-2.5-sunburst` generation per explicit request, bounded prompts, loading/errors and no automatic paid retries. The model is prompted toward recognisable humanoid faces. The UI explains that the facial oval is preserved, without hair, ears, horns or a whole creature.
- Added photo-textured and Gaussian surface renderers sharing the same reference/state model. The Gaussian renderer samples photographic colours onto anisotropic 3D surfels, projects covariance into screen ellipses and depth-sorts alpha compositing. It is an estimated surface representation, not learned multi-view Gaussian reconstruction. A screenshot verified visible output; distinct real expression-reference transitions still need a consenting subject's actual matching photo set.
- Added state previews with native frame timings and a browser-memory ZIP exporter. Packages contain `pet.json`, `spritesheet.png` and installation instructions. Neither native installation nor selection is performed.
- Replaced the green/cream Charted UI with fullscreen **Codex Pets Studio**, system sans/monospace fonts, restrained neutral surfaces and a stable camera action position. Public repository renamed by the parent orchestrator to `https://github.com/shanemckeown/codex-pets-studio`.

### Actual issues and corrections

- The unfinished scaffold had a missing closing brace in an adjustment switch case; the first typecheck caught it. Fixed before rendering.
- Initial npm downloads stalled/ran very slowly. A retry using complete public npm cache entries and pinned compatible versions completed in 17 seconds. No private application source was copied. `npm ci --dry-run --offline --ignore-scripts` subsequently passed lockfile consistency without changing the live dependency tree.
- MediaPipe's base tessellation omits eye and mouth interiors. Browser inspection showed empty eye holes; explicit photographic contour fill corrected this.
- The demo PNG exceeded the capture API's inline image limit. Demo and uploaded photos now use the same JPEG normalization.
- Browser capture requests initially failed the origin guard because Next normalized `request.url` to localhost while the browser used 127.0.0.1. Comparing Origin against the actual HTTP Host fixed the legitimate same-origin request; a real browser command then returned 200.
- Independent native atlas validation found that desktop v2 additionally requires a neutral frame at row 0 / column 6. The original prose contract had omitted that exception. Export now has **74 populated cells** (73 animation/gaze frames plus neutral) and **14 transparent unused cells**, while the idle animation still has six frames. The exporter and unit tests were corrected, then the bundled native validator passed the Gaussian output without warnings.

### Checks actually performed

- `npm run typecheck`: passed.
- `npm test`: eight tests passed, covering native frame layout/timings, required neutral slot/count, gaze order, jump landing, captured-reference routing and ZIP records/CRC.
- `npm run build`: passed with Next.js 15.5.24. Production output is isolated in `.next-production` so the development review server remains usable.
- Real Decisions intent eval: five supported states passed (`waving`, `waiting`, `failed`, `running`, `jumping`); a treatment-dose request was rejected with 422. No mocked model was used for this API eval.
- Real Decisions capture check on a synthetic generated portrait: HTTP 200, one-face probability 1, clear-framing 0.95, requested-neutral-reference 0.98; 2250 ms.
- Real GPT Image application route: HTTP 200, one Sunburst portrait, 143,516 JPEG bytes, 19,158 ms. No retry.
- Browser approval flow with a synthetic neutral fixture: file selection stayed on the current step; explicit approval advanced it. Back and retake cleared the completed state. Attempting final build after an earlier reference had been retaken redirected to the first missing approval. This checks flow, not the validity of distinct expression photos.
- Deferred-webcam lifecycle simulation: a stream resolving after Back had its track stopped; no live video remained. Actual laptop/iPhone camera hardware was not exercised.
- Mobile layout checks: 375×667 and 390×844 had exact viewport document dimensions and no page overflow. Main action Y remained unchanged before and after approval. Parent independent review also checked 320×568 and a separate-context approval/retake flow using intercepted capture-check responses for UI isolation.
- Downloaded ZIP passed system `unzip -t`. Browser export validation checked dimensions, populated/unused cells and edge clipping. Parent's installed native `validate_atlas.py --require-v2` passed the actual Gaussian PNG with zero warnings/residue.
- Not performed: actual native installation/playback, live microphone recording, distinct real-photo expression-transition QA, public deployment, video recording or submission. These are not reported as passes.

### Sources

Current official OpenAI Decisions, image-generation and speech-to-text guides; Google MediaPipe Face Landmarker Web guide and model card; the installed desktop hatch-pet animation contract/validator; the original 3D Gaussian Splatting project for covariance-rendering background. Exact links, installed versions, licences and artwork provenance are in `ATTRIBUTION.md`.
