# Orbital scroll and publication

The user explicitly requests stronger continuously moving background and extraordinary scroll responses, and authorizes updating the existing GitHub repository and published GitHub Pages site directly. This supersedes the earlier hold for publication approval.

Motion thesis: keep the opening scene briefly in view on desktop while native scrolling rotates the orbital sculpture, moves the viewpoint closer and shifts the background grid. The next content section ends this chapter. A moving nebula supplies ambient motion even while the pointer is still. Later section ornaments respond to their position in the viewport; reading and catalogue controls stay stable. Mobile uses a shorter unpinned variant. Reduced motion disables the pinned chapter. Pause stops the background and render loop.

Implementation: `OndaScroll.ts` caches layout on resize/content changes and writes motion variables once per scroll animation frame. `OndaExperience.tsx` consumes the same progress in the existing shader without recreating resources. `onda-experience.css` supplies the responsive choreography; `OndaLandingSections.tsx` owns its wrapper. Update the public test workflow and the PWA cache version. No new runtime dependencies or database changes.

Verification: write failing scroll/background tests first; run TypeScript, production build and all public tests. Inspect real scroll states in Playwright CLI on desktop/mobile. Update the existing PR branch through the connected GitHub integration, wait for checks, merge into main under the explicit publication authorization, wait for GitHub Pages deployment and verify the public site in a fresh browser.

Review adjustments: the pinned desktop chapter starts at 1024px, avoiding the legacy overflow containers at tablet widths. Narrower screens keep native unpinned scrolling and no horizontal copy translation. `#inicio` belongs to the unpinned wrapper so the brand resets the chapter. Manual pause collapses the extra scroll interval. These behaviors have dedicated regression tests.
