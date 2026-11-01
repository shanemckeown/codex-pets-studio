# Attribution

Codex Pets Studio was built by Shane McKeown with Codex during the 1 November 2026 hackathon build window. Initial planning documents and the earlier charting/face-studio directions remain in history. No Aestheticc application source, patient records, private vault content or credentials were incorporated.

## Libraries

Installed versions are pinned by `package-lock.json`.

| Library | Version | Licence | Source |
| --- | --- | --- | --- |
| Next.js | 15.5.24 | MIT | [Vercel Next.js](https://github.com/vercel/next.js) |
| React / React DOM | 19.2.4 | MIT | [React](https://github.com/facebook/react) |
| Three.js | 0.187.0 | MIT | [Three.js](https://github.com/mrdoob/three.js) |
| MediaPipe Tasks Vision / WASM | 1.2.0 | Apache-2.0 | [MediaPipe](https://github.com/google-ai-edge/mediapipe) |
| OpenAI Node SDK | 7.47.0 | Apache-2.0 | [OpenAI Node](https://github.com/openai/openai-node) |
| TypeScript | 5.9.3 | Apache-2.0 | [TypeScript](https://github.com/microsoft/TypeScript) |
| Vitest | 3.2.7 | MIT | [Vitest](https://github.com/vitest-dev/vitest) |

The licence names above were checked against installed package manifests. Upstream licence terms continue to apply. The project uses system sans and monospace fonts; it does not bundle a downloaded brand font.

## Face model and rendering

- Google MediaPipe [Face Landmarker guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker) and [Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js).
- Bundled model: [official float16 Face Landmarker task](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task). The [Face Mesh V2 model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf) identifies Apache License 2.0 and describes estimated monocular landmarks and limitations.
- Facial region weighting, reference registration, mesh contour fill, native export and Gaussian surface code were written for this project. The Gaussian renderer uses anisotropic covariance projection and depth-sorted alpha compositing; [3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/) is the primary background reference. No code or pretrained model from that project was copied.
- Full-head foreground uses the official [MediaPipe Selfie Multiclass model](https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite), served locally. Its [model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Multiclass%20Segmentation.pdf) specifies Apache License 2.0. Segmentation keeps observed hair, face and nearby ears/accessories; it does not invent missing pixels.
- Full-head Gaussian primitives are sampled from a shallow photographic surface using segmentation alpha. No learned multi-view Gaussian reconstruction, SHARP model, or complete 3D head reconstruction is included.

## OpenAI and artwork

- [Decisions API](https://developers.openai.com/api/docs/guides/decisions): `gpt-6-luna`, used server-side for capture checks and finite animation-intent routing.
- [Image generation](https://developers.openai.com/api/docs/guides/image-generation): `gpt-image-2.5-sunburst`, used server-side for one original character portrait per explicit generation action.
- [Speech to text](https://developers.openai.com/api/docs/guides/speech-to-text): `gpt-transcribe`, used server-side for recorded authoring commands.
- `public/demo/portrait.png` is an OpenAI-generated synthetic portrait made on 1 November 2026 with the built-in image-generation tool. Prompt summary: a fictional adult, front-facing, neutral expression, clear portrait suitable for landmark fitting. It is not a captured expression reference set.
- A separate lavender humanoid portrait was generated through the real application API during verification. It remains a temporary local test artifact, outside Git.

## Native pet contract

The desktop v2 manifest, 8×11 atlas geometry, state timings, sixteen clockwise gaze poses, and extra neutral slot at row 0 / column 6 were verified against the installed `hatch-pet` contract, animation rows, assembler and validator. The extra neutral slot was discovered during independent validation and corrected before final verification.

[Official Pets documentation](https://learn.chatgpt.com/docs/pets) describes desktop custom pets and activity behavior. Its web-upload format differs from this local desktop v2 export. No native app code, live event hook or installer is included in the generated package.
