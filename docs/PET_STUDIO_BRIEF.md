# Codex Pets Studio — photo-to-pet creator

Latest agreed direction, 1 November 2026, including captured-expression clarification. Supersedes the cosmetic-preview UI for today's hackathon. Preserve reusable face geometry, regions and expression controls underneath.

## Outcome

Choose **Use my face** (guided photo onboarding) or **Invent a character** (GPT Image prompt) → movable front/partial-side face → expression preview → download a native Codex desktop pet package (`pet.json` + transparent sprite sheet). Both routes share the facial rig, state preview and export. The creator is 3D; the exported native pet uses existing sprite playback. Do not claim the native app runs a 3D renderer or Decisions API.

User decisions:
- Fun, visual hackathon product using Decisions, photo/3D and voice where useful.
- No 360° head required; front and some side coverage only.
- Onboarding submits both angles and expressions.
- Real-face expressions come from the recorded expression captures: reconstruct/render those states and switch or transition between them. Do not make procedural smile/frown synthesis the core approach.
- Artistic work must reuse facial infrastructure applicable to cosmetic previews.
- Sol implements; the parent agent plans and independently reviews.

## Capture flow

Seven guided shots: neutral front, slight left, slight right, front-facing smile, front-facing eyes gently closed, front-facing raised eyebrows, and front-facing frown (added by Shane). The frown reference drives the failed/disappointed reaction. Optional further-left/further-right neutral reference shots. Same lighting, camera distance and framing; user supplies their own consenting subject. Allow uploaded files and a synthetic demo; camera capture is useful after the upload path works. Explain which references are required versus optional and allow retakes.

Decisions checks observable capture properties: one visible face, framing/lighting, requested view, requested expression. Never infer identity, health, attractiveness, diagnosis or treatment suitability. A result can suggest a retake; it is not a clinical assessment. Register captured expressions to shared head framing, scale and pose; each expression supplies its own observed geometry and appearance. Use state switching or simple transitions first, with visual checks for head jumps and ghosting. Neutral angle photos do not provide multi-view coverage of every expression: a single photo per expression still requires estimated depth. Do not claim automatic multi-view fusion or full reconstruction without evidence.

## Invent a character (added by Shane)

Offer prompt-driven GPT Image generation for people who do not want to upload their face. Start with fantastical humanoid portraits whose eyes, nose and mouth can be tracked: an elf, cosmic character or friendly humanoid robot. Prompt for a single front-facing unobstructed face, neutral expression and consistent lighting. One explicit Generate action makes one server-side generation request; provide visible progress, errors and an explicit retry, without silent paid regeneration. Keep credentials server-side and generated portraits in transient memory.

Run the generated portrait through the shared landmark/renderer pipeline. Explain that expressions from this single portrait are procedural approximations. If a character cannot be tracked, explain the limitation and let the user revise the prompt; do not claim support for arbitrary non-human creatures. Generating a full reference set is optional after the one-image journey works. Preserve the generated character's appearance as far as the face renderer supports, and inspect its actual preview before promising full-character export.

## First checkpoint

One synthetic/demo face that visibly blinks, smiles and looks left/right. Inspect the motion at pet size before building more states. Use corresponding landmarks from actual expression reference photos when available; avoid inventing unseen mouth/eye detail. A neutral-only demo can use restrained procedural expression approximations, clearly labelled as such, but must not pretend to use expression references it does not have.

## Rendering boundary

Current scaffold uses a MediaPipe photo-textured estimated facial mesh. Investigate Gaussian splat rendering of aligned captured expression states after the complete mesh/export journey works; begin with two expressions and inspect switching at pet size. This does not require a learned expression rig: the user supplies the expressions. Gaussian surfels sampled from estimated surfaces must be labelled accurately, and must not be presented as a learned multi-view Gaussian reconstruction. Keep face registration, geometry and regional weights separate from the renderer to preserve reuse. Procedural expression approximation remains a clearly labelled single-image demo/generated-character fallback.

## Native desktop export (verified locally)

- `spriteVersionNumber: 2`, transparent PNG or WebP, 1536×2288.
- 8 columns ×11 rows; each cell 192×208.
- Standard row frame counts: idle6, running-right8, running-left8, waving4, jumping5, failed8, waiting6, running6, review6. Native v2 additionally requires a dedicated neutral/front frame at row0 column6 (zero-based); this is not a seventh idle animation frame. There are 74 populated cells including the sixteen directions and neutral frame, and 14 transparent unused cells. Confirmed against the installed native validator and extended-atlas assembler; their neutral-slot requirement is omitted from the animation-row prose.
- Last two rows contain sixteen look directions, clockwise starting UP (000), then right090, down180, left270. Neutral front occupies the dedicated slot, not direction000.
- `pet.json`: `id`, `displayName`, `description`, `spriteVersionNumber:2`, `spritesheetPath` matching the included file.
- Render frames, display a state-by-state animation preview, validate the exact export and download a ZIP. Include concise local installation instructions. Do not install/select a pet in the user's app until explicitly requested after the animation is reviewed.
- Desktop v2 local export is distinct from the documented web upload format. Target desktop only today.

## Decisions, voice and images

Make a real Decisions call during onboarding and/or to map natural language to supported expression presets (idle, working, curious/waiting, pleased/review, disappointed/failed, greeting). Use the native state names for export. A short voice command can use the server transcription route then the same Decisions path as typed input. Decisions is part of authoring, not arbitrary code embedded in the native pet JSON.

Synthetic demo portrait already exists at `public/demo/portrait.png`, made with the built-in image-generation tool today. Any generated expression references must be credited and distinguished from captured photos. Keep user photos, key material and audio out of Git and persistent storage; previews/transient captures belong in browser memory. Server calls use `.env.local`, which is ignored.

## Delivery

Implement in the existing repository and build branch; reuse working pieces and replace the unfinished cosmetic UI. Keep public docs honest about achieved versus planned work. Tests: expression/state transitions, export geometry/counts/transparency and manifest, meaningful browser journey, real Decisions response; no fabricated test passes. Browser inspect animations, not just still images. Update README/setup/credits/CODEX_LOG and provide a concrete Codex contribution for the ≤90-second video. Feature freeze15:30, submission target16:30, deadline17:00 London.

No production Aestheticc changes, native-app patching, live Codex event bridge, full-head reconstruction or medical guidance. No automatic deployment or native pet installation.
