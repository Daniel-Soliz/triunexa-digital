# TRIUNEXA — Cinematic directory

## Visual sequence
Continuous fixed Three.js canvas: green constellation, camera approaching and rising through the network, grid alignment behind catalogue cards. Pinned desktop hero with four depth layers; catalogue slides over the preceding scene; creator closes the journey. Instrument Serif + DM Sans, deep green / moss / warm paper / soft gold. All HTML remains visible without animation.

## Files and tuning
- cinematic.css: --cinema-deep, --cinema-moss, --cinema-paper, --cinema-gold; spacing and typography.
- public/cinematic.js: CINEMA.nodes, mobileNodes, cameraSpeed, pixelRatio; CDN URLs pinned. GSAP + ScrollTrigger + Lenis + Three.js, one scroll timeline and one animation frame loop.
- PublicPlatform.tsx: copy, discovery flow, preserved search, anchors, feedback, ADM.
- publicApi.ts: BUSINESS_SECTORS, canonicalSector, rotateDaily. Rotation changes presentation, not research timestamps.
- CompanyDialog.tsx: public contact dossier with evidence, safe URLs, no guessed names, email or WhatsApp.

## Progressive enhancement
CDN failure leaves the native-scroll catalogue fully functional. Loader never blocks clicks and disappears after two seconds. WebGL failure falls back to CSS gradients. Reduced motion disables smooth scroll, pinning and animated camera; canvas renders a still frame. Mobile uses 30 instanced nodes with DPR at most 1.3. Desktop DPR at most 2. Rendering pauses while hidden. Dialogs use native focus trapping, Escape and restored focus; Lenis does not intercept dialog scroll.

## Contact enrichment
Only address is synchronized from the previously validated CRM business projection. Email, contact_name, contact_role and details_sources require explicit field verification from official public sources. Historical CRM users, messages and notes are not exposed. No third-party confidential contacts are copied. Missing channels are marked as unconfirmed.

## Daily catalogue
The requested research target is 100 new verified companies per sector per day. This is a target, never a claim of delivered volume. All ten sectors are visible even when empty; no invented placeholder businesses. The scheduled research task must report actual additions/updates, deficits, duplicates and source failures. Do not delete good records merely to simulate novelty. Geography initially São Paulo; expand geography explicitly only when sources identify the correct city. No paid data providers or private credential dependency was added.

## Verification
CI: TypeScript, Vite build, JavaScript syntax, original public tests and dossier/mobile/reduced-motion/PWA tests. Verify the public migration through anon privileges. PR must pass before publishing.
