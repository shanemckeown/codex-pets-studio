# Charted — Codex build brief

> DevDay Exchange Community Hackathon, London, Sun 1 Nov 2026. Build 11:00–17:00, submit by 17:00 (aim 16:30).
> Solo builder: Shane McKeown (ex-doctor, builds a CRM for aesthetic clinics). Codex builds; Shane drives and records the demo.
> Paste this whole file into Codex as the first message, together with the event paragraph from the Builders Guide.

---

## 0. Outcome promise (the one journey)

**A practitioner scans the product box, then says "two units between the eyebrows, four units each side by the outer eye" with gloves on. Dots appear on the right spots of a face chart, each carrying the product and batch number. They fine-tune by voice ("move point 3 left 2 steps", "move point 5 just above the outer right eyebrow"), and one click gives a printable treatment record.**

Who it is for: injectors at aesthetic clinics (Botox, filler). Today they type injection notes and batch numbers by hand after the patient leaves, or skip them. Batch numbers matter for recalls and complications.

Everything below serves that journey. Anything that doesn't is out of scope.

## 1. Hackathon rules you must respect

- Build the core project today. Libraries, APIs and boilerplate are fine; credit every one in the README under "Existing code and assets".
- Never commit secrets. `OPENAI_API_KEY` lives in `.env.local` (gitignored); ship `.env.example`.
- No personal data. Patient/practitioner identities, product labels, GTIN fixtures and batches are synthetic and labelled as such. Display categories are simply **Botox** and **Filler**; "Botox" is familiar demo vocabulary, not a claim that the generated label identifies a genuine branded product.
- Check current OpenAI docs (developers.openai.com) for model names and SDK calls. Do not guess. Record which docs page you used in `CODEX_LOG.md`.
- Commit after every milestone with a message naming the milestone. Keep `CODEX_LOG.md` up to date: one short entry per milestone saying what you built and, when a problem actually occurred, what went wrong and how you fixed it. Never invent a failure for the log. This file is our "how Codex helped" evidence.

## 2. Stack (decided, don't re-litigate)

- Next.js (App Router) + TypeScript + Tailwind. One app, no database: session state in React + `localStorage`.
- Server route handlers only for OpenAI calls (key never reaches the browser).
- OpenAI Node SDK: speech-to-text for transcription; Responses API with **structured outputs (strict JSON schema)** for parsing. Use the current recommended models from the docs.
- `zxing-wasm` to decode GS1 DataMatrix from webcam frames or an uploaded image. Serve the `.wasm` from `/public`, not a CDN.
- `bwip-js` to generate the synthetic demo barcode.
- Vitest for unit tests. `npm test` and `npm run build` must both pass at every milestone.

## 3. Data model (mirrors the target CRM so it can be ported back)

```ts
// One dot on the chart. Field names match the CRM's InjectionPoint on purpose: do not rename.
export interface InjectionPoint {
  id: string;
  x: number;            // % of chart width, 0-100
  y: number;            // % of chart height, 0-100
  treatmentType: "botox" | "filler" | "other";
  productName: string;
  batchNumber: string;  // "" if no box scanned yet
  units: number;        // toxin units, or ml for filler
  notes?: string;
  injectedAt: string;   // ISO
  injectedBy: string;   // "demo-practitioner"
  // hackathon additions
  pointNumber: number; // persisted, monotonically allocated; never reused
  region: RegionId;
  unit: "units" | "ml";
  expiry?: string;      // ISO date from the scan
  source: "voice" | "tap";
}

export interface ScannedProduct {
  gtin: string; batch: string; expiry: string; serial?: string;
  productName: string; treatmentType: "botox" | "filler" | "other";
  expired: boolean;
}
```

### 3b. Session and product binding

- Persist points and `nextPointNumber` together. Reloading, deleting and undoing never renumbers existing dots or allows a used number to be allocated again.
- Capture the active scanned product when recording starts (or when a typed command is submitted). New points copy its name/category, batch and expiry; later scans never alter existing points or an in-flight utterance.
- Demo aliases: "botox" / "toxin" match the Botox demo category; "filler" matches Filler. If the category is omitted, use the captured active product. If it conflicts, show a short clarification and do not attach the active product's batch to a different category.
- With no scan, an explicitly named category can be recorded with an empty batch and visible "No batch scanned" label. An unknown GTIN retains its captured batch but needs the user to choose a category before it can supply a default category/unit.
- Changing an existing point's product requires explicitly choosing a scanned product (and copying its batch/expiry) or an unscanned category (and clearing its batch/expiry). Never carry the old product's batch across a product change.
- Give each recorded/submitted utterance a stable request ID. Apply each result at most once, including retries; one utterance's accepted changes are one undo transaction. Confirmation-only actions do not create undo entries. Ignore a late response after session reset.

## 4. Face regions (fixed list: the model may only pick from these)

Clinical convention: the chart shows the patient **facing you**, so the patient's **left** is on the **viewer's right** (x > 50). Coordinates are % of a 300×400 portrait chart; tune visually in M2, but keep every id.

| RegionId | x | y | | RegionId | x | y |
|---|---|---|---|---|---|---|
| forehead_centre | 50 | 20 | | cheek_right | 30 | 53 |
| forehead_right | 38 | 22 | | cheek_left | 70 | 53 |
| forehead_left | 62 | 22 | | nasolabial_right | 41 | 62 |
| glabella | 50 | 33 | | nasolabial_left | 59 | 62 |
| temple_right | 22 | 31 | | upper_lip | 50 | 68 |
| temple_left | 78 | 31 | | lower_lip | 50 | 73 |
| crows_feet_right | 25 | 41 | | marionette_right | 41 | 76 |
| crows_feet_left | 75 | 41 | | marionette_left | 59 | 76 |
| tear_trough_right | 40 | 46 | | masseter_right | 25 | 66 |
| tear_trough_left | 60 | 46 | | masseter_left | 75 | 66 |
| chin | 50 | 85 | | jawline_right | 29 | 77 |
| | | | | jawline_left | 71 | 77 |

Several dots in the same region fan out slightly (small deterministic offset by index) so they don't stack.

### 4b. Landmarks: the face geometry is one source of truth

`lib/face-geometry.ts` defines named **landmarks** (x/y %), and **the SVG outline is drawn from those same points**: brow curves pass through the brow landmarks, mouth corners are the mouth landmarks, and so on. Never hand-place the drawing and the landmarks separately, or "outer right eyebrow" drifts off the drawn eyebrow. Regions (§4) are placed relative to landmarks too.

Landmarks, plain English, each side where it applies:
eyebrow inner / middle / outer · eye inner corner / outer corner / pupil · under-eye · temple · cheekbone · nose bridge / tip / side of nostril · mouth corner · upper lip centre (cupid's bow) / lower lip centre · upper lip edge / lower lip edge · chin point · jaw angle · jawline middle · earlobe · hairline centre · forehead centre.

**Side convention (demo default):** in everything the user says and sees, "left/right" means **the screen's** left/right. `RegionId`s stay in patient terms (patient's left = screen right) so stored records retain patient-side identifiers. Keep visible labels "Screen left / patient right" and "Screen right / patient left"; exported region names use patient sides. Put the mapping in one function `screenSideToPatientSide()` behind a constant `SIDE_CONVENTION = "screen"`, so a "patient" setting is a one-line change later.

### 4c. Point editing

Every dot shows its **number** (1, 2, 3… in the order added; numbers never reshuffle after a delete; deleted numbers are not reused). The most recently added or edited dot is the **selected** dot (ring highlight), so "move it" / "that one" means the selected dot.

**Step size:** 1 step = 1% of chart width (horizontal) or height (vertical). Keep the same face outline and geometry throughout the demo so the user learns this coordinate system. Voice moves name the target and explicit steps: "move point 5 up 3 steps" or "move it left 1 step". Require a positive whole-number step count and a direction. "Move five up", a missing step count, or a count without a direction prompts clarification; never guess whether a number is a point or distance.

Edit operations (all undoable, one undo stack shared with adds):
- `move` — target, direction (up/down/left/right), steps → "move point 5 up 3 steps", "move it left 1 step"
- `move_to` — target, landmark, optional offset (just above / below / inside / outside = 3 steps in that direction) → "move point 3 to the outer right eyebrow", "put point 2 just above the left mouth corner"
- `delete` — target → "delete point 4", "delete the last one"; first command requests confirmation, a separate second delete command confirms (§4d).
- `change` — target, field (amount/product), value → "make point 2 three units"
- `select` — target → "point 6"
- `undo` / `redo`
- Targets: a number, "it/that one/last", or "all in <region>" for delete/change only.

A dot moved by an edit keeps its `region` unless it is moved to a landmark in a different region; then `region` updates to the nearest region. Dots clamp inside 0–100.

**Two parsers, fast path first:** after transcription, a tiny local grammar (`lib/edit-grammar.ts`, pure, unit tested) handles simple forms ("move point N <dir> S steps", "move it <dir> S steps", "delete point N", "delete", "cancel", "undo") in the browser, avoiding a second model request. Audio transcription still needs its network round trip. Anything it can't match goes to `/api/parse`.

**One parser contract from M3 onwards:** strict root object `{ commands: Command[], unparsed: string[] }`. `Command` is a nested discriminated union (`add`, `move`, `move_to`, `delete`, `cancel`, `change`, `select`, `undo`, `redo`), not a root-level union. Add commands contain `entries`; region/landmark identifiers are enums. Use required nullable fields for optional schema values and `additionalProperties: false`. Both parsers produce the same contract and the same reducer validates/applies it. The model never decides that deletion is confirmed: the client checks pending state and distinct user input IDs. Handle refusals, incomplete outputs and request failures without changing the chart. A typed-transcript input uses this same path as a microphone fallback.

**Keyboard and touch too:** click a dot to select; arrow keys nudge 1 step, Shift+arrow 5 steps. Delete requests confirmation and a second distinct Delete press confirms; ignore held-key repeat events. A touch delete control follows the same two-action confirmation. Drag works on touch.

### 4d. Deletion must be confirmed by another delete command

1. "Delete point 4" highlights the target and shows **"Are you sure? Say ‘delete point 4’ again or ‘delete’ to confirm. Say ‘cancel’ to keep it."** No point disappears yet. Keep the microphone controls usable while the confirmation is visible.
2. A second, separately submitted utterance saying "delete point 4" or "delete" deletes exactly that pending point. "Yes" alone does not confirm. Two delete commands in one recording, a retried request, or duplicate delivery never count as two user commands.
3. Resolve the target to immutable point IDs when asking; selection changes cannot retarget the confirmation. "Delete point 5" while point 4 is pending starts a new confirmation for point 5 and deletes neither.
4. "Cancel" / Escape clears the request. Any other chart command clears the pending request before being handled. Reset/reload clears pending confirmation too; it is not persisted.
5. Confirmed deletion remains undoable and restores the same point number, position, amount and product/batch. For a bulk delete, show the count and point numbers and confirm that exact snapshot.

## 5. How people talk to it

**Demo vocabulary = plain English** (judges must follow it): landmarks from §4b plus everyday words ("between the eyebrows", "by the outer eye", "smile lines", "upper lip"). The parse prompt lists every landmark and region with these plain names.

**Clinical shorthand glossary = later, for real users.** Create `lib/glossary.ts` exporting an empty `CLINICAL_SHORTHAND` array with one commented example, wired into the prompt, so real clinic terms can be added later without code changes. Do not fill it today.

Expansion rules:
- "each side" / "both sides" / "bilateral" → one entry per side with the full amount each.
- Record only explicitly dictated sites and quantities. "Twelve units across the forehead" does not specify individual sites: add nothing for that phrase and ask for sites and amounts. Do not invent sites, distribute a total or round amounts. "Four units at the left forehead, four in the centre, four at the right" explicitly specifies three sites with 4 units each.
- Toxin → `unit: "units"`; filler → `unit: "ml"` when the category/unit context is explicit and compatible. "Half a mil" = 0.5 ml. "A syringe" has no assumed volume; ask for millilitres. Missing quantities or conflicting units require clarification.
- Apply the captured scanned-product binding and category aliases in §3b; never infer a batch from the category name alone.
- Anything the model can't place goes in `unparsed` and is shown to the user. Never guess a region.
- An add can be placed by landmark: "two units just above the outer right eyebrow" → dot at that landmark + offset, region = nearest region.

## 6. Milestones (do them in order; commit after each)

Each milestone ends with its check passing. If one runs >45 min over, stop and tell Shane what to cut.

**M1 — Scaffold (target 11:20).** Next.js + TS + Tailwind + Vitest, `.env.example`, `.gitignore` covering `.env*.local`, README skeleton with headings from §9, empty `CODEX_LOG.md`.
*Check:* `npm run build && npm test` pass; `git status` shows no env file.

**M2 — Face chart, tap mode (target 12:15).** Write `lib/face-geometry.ts` first (§4b), then draw today a clean single-colour SVG face outline (forehead, brows, eyes, nose, lips, jaw, ears) in a 300×400 viewBox **from those landmark points**: our own artwork, no traced images. Debug toggle (`?landmarks=1`) shows every landmark as a labelled cross so Shane can eyeball the fit. Render numbered dots at region coordinates. Sidebar: session entries in order and totals per product ("Botox: 20 units · Filler: 1.0 ml"). Tapping a region opens a tiny picker (product, amount) as a manual fallback. Undo last entry.
*Check:* unit tests: every RegionId and landmark has coordinates inside 0–100; patient-left regions have x > 50; `screenSideToPatientSide("right")` returns patient left; totals add up for a fixture session.

**M3 — Speak → dots (target 13:00, before lunch).** Big push-to-talk button (hold, or press-start / press-stop; also space bar). `MediaRecorder` → `POST /api/transcribe` → text → local grammar or `POST /api/parse` → strict JSON `{ commands: Command[], unparsed: string[] }` (§4c) where `region` is an enum of the RegionIds above → dots added with `source: "voice"`. Show the transcript and a 3-second "added 3 entries · undo" toast.
*Check:* `npm run eval:parse` runs these sentences through `/api/parse` (needs a real key; skip with a clear message if none) and asserts the result:
1. "Two units between the eyebrows" → glabella 2 units
2. "Four units each side by the outer eye" → crows_feet_left 4, crows_feet_right 4
3. "Half a mil filler in the upper lip" → upper_lip 0.5 ml, filler, productName Filler (matching active filler scan)
4. "Four units at the left forehead, four in the centre, four at the right" → forehead_left/centre/right 4 each, with screen-to-patient side mapping
5. "Zero point three millilitres of filler under each eye" → tear_trough_left 0.3 ml, tear_trough_right 0.3 ml
6. "Two units just above the outer right eyebrow" → 2 units at landmark eyebrow-outer (screen right) + 3 steps up
7. "and some in the earlobe" → nothing added, phrase lands in `unparsed` because the amount is missing (earlobe itself is a valid landmark)
8. "Twelve units across the forehead" → no invented sites or amounts; clarification in `unparsed`
9. "A syringe of filler in the upper lip" → no assumed volume; clarification in `unparsed`

Each eval sets its active product/category explicitly; no dependence on the previous case. Assert that a conflicting spoken category never acquires the other category's batch.

**M4 — Point editing (target 14:00).** Everything in §4c–4d: numbered dots, selection, local edit grammar, `/api/parse` edit actions, keyboard nudges, shared undo/redo.
*Check:* unit tests for `lib/edit-grammar.ts` and the reducer that applies edits: "move point 3 left 1 step" → x −1; "move point 5 up 3 steps" → point 5 y −3; "move it right 2 steps" → selected x +2; "move five up" → clarification, no change; "move point 3 to the outer right eyebrow" → exact landmark coordinates; "put point 2 just above the left mouth corner" → landmark y −3; first delete leaves the point in place and opens confirmation; a separate second delete removes it; duplicate request/same-recording double delete/"yes" never confirms; cancel preserves it; a different target starts a fresh confirmation; confirmed delete then undo restores the same number, position and batch; a move past the edge clamps at 0/100; "move point 99 left 1 step" → friendly error, nothing changes. Eval sentences 6–7 above extended with three edit sentences that must route through `/api/parse`. Test reload-safe numbering, once-only request application, one-utterance undo, and product snapshots when a scan changes during transcription.

**M5 — Scan the box (target 15:00).** Cut order if late: webcam first (keep upload only). Two input routes into the same decoder: webcam (`getUserMedia`, back camera on phones, scan every ~300 ms until a hit) and "Upload label photo". Decode with `zxing-wasm`, DataMatrix + GS1-128 formats.
- 🔴 **Read the decoder's raw `bytes`, decode as Latin-1, and parse that. Never parse `.text`.** Rendered text depends on decoder text mode; use raw bytes to preserve the group separator (ASCII 29, `\x1D`) ending a variable-length field. Verify preservation in the generated-label round-trip test.
- GS1 parser (`lib/gs1.ts`, pure, unit tested): AIs `01` GTIN (14 fixed, verify check digit), `17` expiry YYMMDD (DD `00` = last day of that month), `10` batch (variable, to `\x1D` or end), `21` serial (variable). Strip a leading `]d2` / `]C1` symbology identifier if present.
- On success: banner "Botox · Batch DEMO2611A · Exp 30 Jun 2027 · DEMO", becomes the **active product**; new entries capture its batch and expiry according to §3b. Expired → red banner, still allowed (we warn, never block).
- `lib/demo-products.ts` maps synthetic GTINs to names. Unknown GTIN → "Unknown product", batch still captured.

**Demo labels (generate in M2; decode/upload smoke check before point-editing work).** `scripts/make-demo-label.ts` uses `bwip-js` (`gs1datamatrix`) to generate `public/demo/demo-toxin-label.png` and `public/demo/demo-filler-label.png`. Route `/demo-label` shows a responsive mock box with a Botox/Filler switcher, the category name, "SYNTHETIC DEMO PRODUCT · NOT FOR CLINICAL USE", human-readable batch/expiry, and a large high-contrast barcode with a clear quiet zone. Provide full-screen display and PNG download. Open it on the phone and scan with the laptop webcam, or display it on the laptop and scan with a phone. Serve the same generated PNGs for upload fallback; these must be real decodable GS1 DataMatrix symbols, not decorative images. Use check-digit-valid synthetic GTIN fixtures labelled demo-only; verify the chosen test-number convention against current GS1 documentation rather than claiming a prefix guarantees an unassigned code.
- **Botox** (demo category) · batch `DEMO2611A` · expiry 2027-06-30 · serial `0001`
- **Filler** (demo category) · batch `DF2610B` · expiry 2026-10-31 · serial `0002` (already expired on event day, to show the red banner). Keep day-zero expiry only as an explicitly labelled legacy parser test, not on the demo label.

*Check:* unit tests: parser on raw strings with and without `\x1D`, with `]d2` prefix, end-of-month expiry, bad check digit rejected; a round-trip test decodes the generated PNGs with `zxing-wasm` and gets back the exact GTIN, batch, expiry and serial. Before recording, actually scan the label displayed on the other device; do not count image-upload success as camera verification. The label page needs to open on the second device; `localhost` on the laptop is not reachable by that name on the phone. Use the public demo URL or transfer/open the generated PNG there. A phone used as the scanner needs the app served over HTTPS; retain laptop localhost plus a phone-displayed PNG as a fallback.

**M6 — Treatment record (target 15:30).** Cut order if late: print styling first (a plain table is fine). `/record` print view: clinic placeholder header, synthetic patient "Demo Patient", date, the chart with dots, a table (region, product, amount, batch, expiry, time, voice/tap), product totals. Print stylesheet; "Print / Save PDF" = `window.print()`. "Copy as JSON" button outputs `InjectionPoint[]`.
*Check:* run the full journey (scan → speak 3 sentences → two voice edits → record) with the Playwright smoke test, or document it as a manual checklist in the README if Playwright costs >20 min.

**STOP BUILDING at 15:30.** From here it's only fixes found while recording.

**M7 — Optional polish only.** Keep the single face outline and fixed geometry for the whole demo; do not add a photo toggle or an alternate face that changes where landmarks appear.

## 7. Out of scope (do not build)

Accounts, login, a database, patient records, multiple patients, appointment booking, real product catalogues, live always-on listening, deployment configuration beyond what's needed for one link, any clinical advice or dosing suggestions.

## 8. UX notes

- Built for gloved hands: push-to-talk button ≥ 80 px, everything also works from the keyboard (space = talk, U = undo).
- The newest dot pulses once when it lands. Colours: toxin dots one colour, filler another, legend visible.
- Errors talk like a person: "How much should I record at the earlobe?"

## 9. README (required for submission)

Headings: What it is (two lines) · Who it's for and the problem · Demo video link · How to run (clone, `npm i`, `.env.local`, `npm run dev`, open `/demo-label` on a phone and scan it) · How it works (diagram: speech → transcribe → strict-schema parse → region lookup → chart; box → DataMatrix → GS1 parse → active product) · How Codex helped (link to `CODEX_LOG.md`, one concrete example) · Built today vs existing (libraries listed with licences; idea and domain knowledge from the author's clinical background; no code reused from other projects) · Synthetic data notice · Limitations.

## 10. Demo video script (≤ 90 s, Shane records 15:30–16:15)

1. (0–10 s) "Injectors write batch numbers and injection sites by hand after the patient's gone. Here's hands-free charting."
2. (10–25 s) Hold the phone showing `/demo-label` to the webcam → green banner with batch and expiry.
3. (25–45 s) Hold the talk button: "Two units between the eyebrows, four each side by the outer eye, four at the left forehead, four in the centre, four at the right." Dots land numbered, totals update, batch is on every entry.
4. (45–60 s) "Move point 5 up 3 steps." "Move point 3 just above the outer right eyebrow." Dots glide into place.
5. (60–70 s) Scan the expired filler label → red banner (warns, doesn't block). "Half a mil filler in the upper lip."
6. (70–80 s) Open the record → full table with batch numbers.
7. (80–90 s) "Built today with Codex. Here's one thing it did:" show the `CODEX_LOG.md` entry.

Keep a backup screen recording of a clean run in case the venue Wi-Fi drops during finals. Before submission, check the public repository, README demo URL and video link in a signed-out browser; no permission requests. Rehearse deletion separately: "delete point 4" → visible "Are you sure?" → "delete point 4" → undo restores it.
