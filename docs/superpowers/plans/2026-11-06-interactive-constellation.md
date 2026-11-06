# Interactive constellation implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan in this session. The user explicitly delegated visual decisions and implementation.

**Goal:** Modernize the existing TRIUNEXA public directory with an authored, mouse-responsive orbital scene and a clearer discovery experience.

**Architecture:** Extend the current React public page, keeping its data, search, company dossiers, feedback and administrator flow. Isolate the decorative WebGL scene and pointer behavior from the functional page. Preserve a still-image fallback.

**Tech Stack:** React 19, TypeScript, CSS, native WebGL, existing lucide icons; Playwright CLI and existing Playwright tests.

## Global constraints
- Work on `feat/interactive-constellation` in the fresh, separate checkout; no changes to the user's other local projects.
- No database/authentication/schema changes; no invented companies or metrics.
- No paid component retrieval or hosted generation; credentials never enter the repository.
- Full keyboard support, visible focus, reduced motion, a pause control, no horizontal overflow at 360px.
- Stop expensive rendering offscreen/hidden; cap pixel density and frame rate; static fallback on WebGL failure.
- Keep GitHub Pages deployment compatible. Prepare a reviewable branch/PR before any production publication.

## Design and motion thesis
An open network becomes a luminous orbital sculpture. Deep indigo (#0d0c11), violet (#8962ff), ice (#c9efff), pale lilac (#efeef4) and white preserve recognizable TRIUNEXA cues. Gabarito headings and Onest body remain. A clear headline and real catalogue search lead the left; a tactile orbital object occupies the right. The signature is light and viewing angle responding to the pointer, with restrained supporting hover feedback. Catalogue uses quiet light surfaces for reading. No scattered reveal choreography or scroll hijacking.

## Review focus
- Slow/offline requests still show an actionable catalogue error.
- Reduced motion or a manually paused scene never traps navigation or keeps background rendering active.
- Long company names and large category sets wrap at narrow widths.
- Switching to ADM tears down decorative rendering.
- WebGL absence/loss leaves an attractive still and fully working search.

### Task 1: Prove the new interaction requirements
- [x] Preserve existing public tests; update the hero assertion to the clearer new headline.
- [x] Add behavioral tests for pointer response, pause/resume, reduced motion, WebGL fallback and narrow layout.
- [x] Run new tests first and observe feature failures.

### Task 2: Build the experience
- [x] Create `OndaExperience.tsx` for scoped pointer motion, user preference and bounded WebGL rendering.
- [x] Update `OndaLandingSections.tsx` with the clearer hero, orbital stage, navigation and step feedback.
- [x] Add `onda-experience.css` for the extended visual system and responsive/reduced-motion states.
- [x] Wire the public page, preserve catalogue behavior and improve accessible labels/skip navigation.
- [x] Verify TypeScript, build and public browser tests.

### Task 3: Inspect and deliver
- [x] Use Playwright CLI to inspect desktop/mobile and exercise search, company modal, pause and navigation.
- [x] Capture and visually review screenshots; fix findings in a batch.
- [ ] Review diff, run focused tests, commit and prepare a pull request for the existing GitHub Pages project.

## Progress
- Baseline TypeScript and production build passed. Initial browser tests could not launch because the required Chromium was missing; installed the matching browser before retesting.
- Impeccable installed and reference guides loaded; its engine launcher cannot write its cache, so direct project context is used as its documented fallback.

- Fresh independent code review completed. Findings were reproduced by failing browser tests and corrected: mobile-menu keyboard focus, persistent WebGL resources on pause/resume, and a static fallback image. The visibility test now also supports browsers without WebGL.
- Decision: keep the current GitHub Pages hosting and existing Supabase integration; this public visual change needs no database or authentication migration.
- GitHub CLI is installed in the local tools directory but is not authenticated; use the already connected GitHub integration for the review branch.
