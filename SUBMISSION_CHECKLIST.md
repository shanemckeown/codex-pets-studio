# Codex Pets Studio submission checklist

Target submission: **16:30 London, 1 November 2026**. Deadline: **17:00**. Feature freeze: **15:30**.

## Requirements and provenance

- The [public event page](https://luma.com/dde-ldn-hack) confirms the 11:00 build start, 17:00 submission close and maximum team size of four.
- Public repository, setup instructions, a video no longer than 90 seconds, Codex contribution evidence and attribution requirements come from the brief supplied by Shane. The official submission form/Builders Guide still needs checking.
- [x] [Public renamed repository](https://github.com/shanemckeown/codex-pets-studio) verified without authentication by the parent orchestrator.
- [x] Initial pre-build planning history preserved; actual build-window implementation recorded in CODEX_LOG.md.
- [x] README explains the implemented creator, setup, privacy and limitations.
- [x] Dependency/model/artwork credits and licences recorded in ATTRIBUTION.md.
- [x] Environment files and private test/browser artifacts ignored; keys stay server-side.
- [ ] Final submission links and organiser requirements checked.

## Verified implementation

- [x] Fullscreen sequential seven-photo capture UI, explicit Photo approved/Retake controls and optional further angles.
- [x] Upload → approval → next step, Back/retake and missing-approval gate checked with a synthetic fixture.
- [x] 375×667 and 390×844 layout checks; independent 320×568 retake check; no page overflow.
- [x] Webcam lifecycle simulation stops a late stream after navigation. Laptop webcam and mobile native-camera/Photos controls implemented.
- [x] Shared registered captured-expression geometry/appearance; real-face mode disables procedural facial-expression invention.
- [x] Photo surface and photo-coloured anisotropic Gaussian surfel rendering on an estimated facial surface.
- [x] Nine activity states and sixteen clockwise gaze directions; native frame timings shared with export.
- [x] Actual downloadable ZIP with pet.json, transparent sprite PNG and installation guide.
- [x] Native desktop v2 atlas: 1536×2288, 192×208 cells, 73 animation/gaze frames plus extra neutral slot; 14 unused transparent cells.
- [x] System unzip integrity, browser geometry/alpha/edge checks and independent bundled native validator all pass the Gaussian export.
- [x] Typecheck, eight unit tests and production build pass.
- [x] Lockfile installation dry-run passes; full fresh-clone install not claimed.
- [x] Real Decisions intent eval and real synthetic photo capture check pass.
- [x] Real GPT Image character-generation API returns one portrait; explicit-request/no-automatic-retry behavior implemented.

## Remaining verification and submission work

- [ ] Actual laptop/iPhone camera hardware capture.
- [ ] Live microphone recording/transcription journey.
- [ ] Distinct captured-expression transition QA using a consenting subject's matching photographs.
- [ ] Full invented-character UI journey through fitting/export (generation API verified separately).
- [ ] Optional native desktop installation/playback, only if Shane explicitly requests it after preview.
- [ ] Fresh-clone installation on another machine.
- [x] Temporary public HTTPS preview explicitly approved; signed-out page access and a real Decisions request verified. URL is in README.
- [ ] Durable public hosting: current preview depends on the Mac staying awake, connected, and running the server/tunnel.
- [ ] Record a ≤90-second video showing capture/character creation, expression preview and native export.
- [ ] Include a concrete Codex contribution: browser-discovered eye/mouth mesh-hole correction and independent native neutral-slot validation.
- [ ] Add accessible final video/demo links to README and check signed-out access.
- [ ] Complete the official submission before 17:00 and retain confirmation.
