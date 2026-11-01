# Codex Pets Studio

Turn a set of face photos into an expressive desktop companion: guided references → estimated 3D facial surface → animation previews → downloadable native desktop pet package.

Built by Shane McKeown with Codex during the [DevDay Exchange Community Hackathon, London](https://luma.com/dde-ldn-hack), 1 November 2026. The initial charting idea and subsequent face-studio exploration are preserved in the Git history and earlier briefs; [the pet-studio brief](docs/PET_STUDIO_BRIEF.md) defines the implemented direction.

**Verified locally:** production build, twelve unit tests, mobile approval/retake flow, real Decisions command and capture checks, real character-generation API, Gaussian export and independent native v2 atlas validation. See [CODEX_LOG.md](CODEX_LOG.md) for exact evidence and limits. No public deployment, native installation or submitted video is claimed.

## Run locally

Use a recent Node.js release supported by Next.js and npm. Install the versions in `package-lock.json`:

```sh
npm ci
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local for AI checks, commands and transcription.
npm run dev
```

Open [the local studio](http://127.0.0.1:3000). Landmark fitting, manual animation previews and export run in the browser without an API key. Decisions checks and typed/voice authoring require a server-side key and access to the selected API models. Missing API access produces an explicit error; manual state controls remain available.

```sh
npm test
npm run typecheck
npm run build
# With the dev server running and a configured key: real, billable Decisions evals
node scripts/api-eval.mjs
```

The MediaPipe model and WASM runtime are served locally from `public/`. API keys remain on the server and must never be prefixed with `NEXT_PUBLIC_`.

## Test on your phone

Connect the phone and Mac to the same local network (including a phone hotspot). On the Mac, run:

```sh
# Replace this address if the Mac changes networks.
CODEX_PETS_LAN_HOST=172.20.10.3 npm run dev:lan
```

Open **http://172.20.10.3:3000** on the phone. The server binds the local network instead of only localhost; no public tunnel or deployment is created. `CODEX_PETS_LAN_HOST` permits only that exact additional development origin for Next.js assets/HMR. Stop the server with Ctrl-C when finished, or return to `npm run dev` for localhost-only access.

On a phone, **Take photo** opens the in-page camera with the oval guide when the studio is served over HTTPS. On a plain LAN HTTP link, it explains that HTTPS is required and does not launch the OS camera. **Camera app** is a separate, explicit native-camera alternative, and **Choose photo** opens Photos/files; those alternatives remain available over HTTP. The oval also appears during photo review, but cannot be displayed inside the phone’s system camera picker. Browsers restrict live webcam and microphone APIs to secure contexts, so use the explicit photo alternatives and typed commands over this HTTP link. Localhost camera/microphone testing remains available on the Mac. Actual reachability from the phone also depends on the network and Mac firewall.

## Create a pet

Choose one of two paths in the fullscreen studio:

- **Use my face:** seven sequential captures: neutral front, slight subject-left/right, gentle smile, eyes gently closed, raised eyebrows, and gentle frown. Use the same consenting subject, framing and lighting. Selecting this path opens the in-page camera once on secure desktop and mobile contexts, preserving the oval guide. Capture freezes the current photo for review while the same camera stream remains active. Photo approved returns to the live next instruction; Retake returns to live view at the same instruction, with no countdown. Camera-origin review keeps the live selfie mirroring, while stored photos remain unmirrored for processing. Leaving capture or switching explicitly to an uploaded photo releases the stream. The native Camera app remains an explicit secondary option. A separate Photos option is always available. Each capture is checked by OpenAI in the background. Your explicit **Photo approved** click advances the flow immediately, even while that advisory check is pending. Retaking or moving on cancels the old check and ignores stale results. You can retake it; AI advice never replaces your approval. Further-side references are optional.
- **Invent a character:** describe an original humanoid face and explicitly generate one portrait. The server uses GPT Image; there are no automatic paid retries. The same face renderer and export pipeline follow. Unsupported creatures may fail face fitting; edit the prompt and explicitly try again.

After fitting, inspect the nine activity states, turn the face, choose a photo or Gaussian surface, or use typed/voice intent such as “look curious”. Then name the pet, create the package, and download its ZIP.

The synthetic demo uses one generated neutral portrait. Its procedural expression changes are clearly labelled approximations. It does not contain genuine smile, closed-eye or frown reference photos. Generated characters have the same single-portrait limitation. The renderer preserves the visible photographic head, including segmented hair and ears. Hidden or already-cropped parts cannot be recovered. Single-portrait mode provides head motion, without inventing new facial expressions.

### Save and reload the same photos

Use **Save photos** in the preview to download a private version 1 JSON file containing your original photo data. Keep that file private. **Load saved photos** on the welcome screen validates all seven required captures and rebuilds them locally, without retakes, camera access or new AI capture checks. Photos are never added to the repository or stored on the server.

## How the face works

MediaPipe landmarks align the retained original photographs by the eyes. An on-device MediaPipe multiclass segmenter separates the visible hair, face and nearby ear/accessory foreground from the background and torso. Connected head foreground is rendered on a shallow curved surface. Captured expression photos supply observed appearance, with registered transitions; the same photos are reused, without retakes or sending them to an image-generation API. If a source photo itself cuts off the hair or ears, those missing pixels cannot be recovered.

The **Gaussian surface** option samples photographic colour and segmentation alpha onto anisotropic 3D Gaussian surfels across that full-head surface. Covariances are projected into screen ellipses and depth-sorted alpha compositing. Both renderers use modest pose motion and share native export. This is a **photographic 2.5D head portrait**, not a learned multi-view reconstruction or measured head anatomy. Angle photos are observed references, without automatic multi-view fusion. The original landmark/region functions remain separate for later artistic or cosmetic illustration work; there are no treatment or dose recommendations.

Decisions is used during **authoring**: automatic capture checks and a finite animation-intent router. Voice is transcribed server-side and follows the same Decisions path. The exported native pet has no embedded API calls or arbitrary Codex event hooks; the desktop app supplies its existing activity playback.

## Desktop export contract

The ZIP contains `pet.json`, `spritesheet.png`, and `INSTALL.txt`.

- Native desktop **v2**: `spriteVersionNumber: 2`.
- Transparent PNG **1536×2288**, 8 columns ×11 rows, **192×208** cells.
- Activity rows: idle6, running-right8, running-left8, waving4, jumping5, failed8, waiting6, running6, review6.
- Last two rows: sixteen clockwise gaze poses starting **up**, then right, down, left. Neutral front uses idle.
- Exactly **74 nonempty cells** (73 animation/gaze frames plus the v2 neutral frame at row0,column6) and **14 transparent unused cells**. Export checks dimensions, occupancy and boundary clipping before offering a download.
- Preview and export share the same pose function and facial renderer. Preview uses the native per-frame durations.

Unzip into a new folder under `~/.codex/pets/<pet-id>/` (or `$CODEX_HOME/pets/<pet-id>/`), keeping `pet.json` and `spritesheet.png` together. In desktop Settings → Pets, refresh and select the pet. The studio does not install or select it. This desktop v2 contract is distinct from the web pet-upload format.

The package contract was checked against the locally installed `hatch-pet` references and a local v2 manifest. See [official Pets documentation](https://learn.chatgpt.com/docs/pets) for desktop creation and state behavior; it does not document every local v2 field.

## Privacy and limits

Photos and recordings stay in browser memory during authoring; the app uses no local storage, database or accounts. Each captured photo is sent to OpenAI for a suggested capture check, with this disclosed before capture. Voice transcription sends the recorded audio to OpenAI. Export intentionally saves rendered likeness frames in the downloaded package. Replacing the neutral photo clears old expression references and generated output. Reloading the page clears the working set.

The demo portrait is synthetic. No Aestheticc source, patient records, vault notes or credentials were copied into this project. Use your own face or photos of someone who has agreed. Webcam and native camera-picker controls are implemented. A deferred-camera-stream lifecycle test passed; actual laptop/iPhone hardware capture and live microphone recording have not been verified in this session. Native installation remains untested; the bundled native validator passed the generated Gaussian atlas, which is stronger evidence than dimensions alone but does not prove playback in the app. The saved real-photo set was imported locally and neutral, frown and side states were visually inspected with hair and ears preserved. Capture-flow regression tests used a synthetic fixture.

## Credits, evidence and submission

[ATTRIBUTION.md](ATTRIBUTION.md) credits libraries, model and generated artwork. [CODEX_LOG.md](CODEX_LOG.md) records actual implementation, corrections and checks. [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) tracks the remaining event deliverables.

**Demo video:** pending (maximum 90 seconds). **Temporary public HTTPS preview:** [Open Codex Pets Studio](https://shoppers-colleague-quarterly-science.trycloudflare.com). No email login is required; signed-out browser access and a real Decisions request were verified on 1 November 2026. This preview runs through the developer's Mac, which must remain awake and connected; it is not a durable hosted deployment. **Repository:** [shanemckeown/codex-pets-studio](https://github.com/shanemckeown/codex-pets-studio).
