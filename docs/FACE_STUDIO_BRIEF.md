# Charted — Face studio pivot, 1 November 2026

Supersedes the original charting implementation for this hackathon. The original `CODEX_BRIEF.md` remains as planning history.

## Outcome

Load a synthetic demo or your own front-facing photo, see a movable estimated 3D facial surface, select a face region and explore a cosmetic or artistic visual change using the same controls. Voice commands use Decisions to choose supported actions. Generate a portrait preview and download it.

Shane clarified: no 360° head required; front and some sides are enough. Five capture angles are useful references: front, slight left, further left, slight right, further right. Front view drives the initial landmark-based surface. Side photos support capture quality and rendering references, not an unverified claim of fused 3D reconstruction. Limited orbit only.

Artistic effects must support cosmetic-preview reuse. One shared set of named facial regions and adjustment state drives both modes. Cosmetic previews are illustrative; they do not predict treatment outcomes or recommend treatments/doses. Capture checks assess framing, lighting and pose, not medical suitability.

## Priorities

1. Front photo → real detected landmarks → movable textured/mesh facial surface.
2. Real Decisions API capture check and command routing; disclose unavailable API access.
3. Reusable region controls (lips, cheeks, jaw, forehead) with undo/reset and view controls.
4. Voice transcription through the server; typed commands as fallback.
5. Image generation using the photo references and the selected region/settings; download output.
6. Five labelled photo slots, with front required and side views optional.

## Scope and evidence

No Gaussian-splat claim: this first implementation fits an estimated facial mesh from landmarks. No barcode or clinical-record export in this pivot. Keep key server-side; use synthetic images in the repo; user uploads stay in browser memory and are sent to OpenAI only for requested checks/previews. Keep local development until public deployment is explicitly authorised. Record asset provenance, exact dependency versions and tested versus untested API paths.

The original 17:00 submission deadline and public repo/video/attribution requirements remain. Feature freeze at 15:30; reserve the remaining time for fixes and demo materials.
