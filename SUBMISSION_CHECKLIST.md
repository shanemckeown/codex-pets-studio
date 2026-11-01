# Charted submission checklist

Target submission: **16:30 London time, Sunday 1 November 2026**. Deadline: **17:00**.

## Requirements and sources

- The [public event page](https://luma.com/dde-ldn-hack) confirms the 11:00 build start, 17:00 submission close and maximum team size of four.
- The public GitHub repository, README/setup, video of no more than 90 seconds, meaningful Codex evidence, original build-window work, attribution and privacy requirements below come from the event brief supplied by Shane.
- The official Builders Guide/submission-form link has not yet been supplied. Cross-check it when available; do not claim every organiser rule has been independently verified.

## Repository and provenance

- [ ] Public GitHub repository opens without signing in.
- [x] README explains the idea, intended users and current build status.
- [x] Local environment files and credentials are ignored; `.env.example` contains no key.
- [x] Pre-build planning/setup is distinguished from implementation during the event.
- [ ] App implementation is built during the hackathon and milestone commits are preserved.
- [ ] Existing code, templates, libraries and assets actually used are credited, with sources and licences.
- [ ] Final tracked files and history contain no secrets, personal data or private project source.

## Working product

- [ ] Fresh clone/install/setup instructions work with a user-supplied API key.
- [ ] `npm test` and `npm run build` pass.
- [ ] Real API parse evals pass; a skipped eval is not reported as a pass.
- [ ] Generated demo label round-trips through the decoder with exact batch and expiry.
- [ ] Barcode displayed on one device scans using the other device's camera.
- [ ] Scan → dictate → chart → two voice edits → printable record works end to end.
- [ ] Delete confirmation requires a second distinct delete command; undo restores the point.
- [ ] API key remains server-side; public endpoint limits are reviewed before hosting.
- [ ] Hosted demo link opens without permission requests and its microphone/camera flow works.

## Submission materials

- [ ] Video shows the working core journey and lasts no more than 90 seconds.
- [ ] README contains the final public video and demo links.
- [ ] One concrete example of Codex helping is evidenced in `CODEX_LOG.md` and the video.
- [ ] Backup screen recording of a clean run is saved.
- [ ] GitHub, demo and video links are checked in a signed-out browser.
- [ ] Official submission form and remaining organiser requirements are checked.
- [ ] Submission completed before 17:00; confirmation retained.
