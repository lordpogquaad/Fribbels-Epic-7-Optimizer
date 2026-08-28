---
name: vendored-css-customizations
description: "2. CSS holds vendored third-party stylesheets linked directly in app.html (not pulled from node_modules at runtime); awn.css is intentionally color-customized from the npm package — diff before overwriting it from npm, never blindly re-vendor it."
metadata:
  type: reference
---

# Vendored CSS — awn.css is intentionally customized (files confirmed present 2026-08-28)

`2. Frontend\1. Source\2. CSS\` contains vendored copies of third-party library stylesheets that are
`<link>`ed directly in app.html, not pulled from `node_modules` at runtime. Folder contents confirmed
2026-08-28: `app.global.css`, `awn.css`, `darktheme.css`, `rangeslider.css`, `style.css` (the earlier
`chosen.css`, a confirmed orphan, was deleted 2026-06-17 and remains absent).

**`awn.css` = awesome-notifications' `dist/style.css`, pretty-printed AND color-customized — do NOT
overwrite from npm without diffing first.** Toast text/icon/progress-bar colors were darkened for
contrast on the pastel backgrounds: success `#40871d`→`#2d5e15`, info `#1c76a6`→`#0d4d6e`, warning
`#c26700`→`#7a4000`, base toast `gray`→`#595959` (alert `#a92019` and backgrounds unchanged). The npm
package is installed and declared in the renderer's `package.json`, but the app deliberately links
the customized local copy instead of the npm dist.

**`rangeslider.css`** (drives the optimizer slot-filter sliders) is stock — only Prettier-reformatted,
semantically identical to the npm package; safe to re-vendor from npm if ever needed. Dark-mode
coloring for it lives in `darktheme.css` overrides, not in this file.

**`app.global.css`** is loaded via webpack `import`, not via app.html — it's live, not orphaned,
despite the unusual loading path.

**Modernized (not suppressed) during the 2026-06-19 lint pass:** two deprecated CSS declarations were
replaced with current equivalents rather than rule-suppressed — `word-break: break-word` →
`overflow-wrap: break-word`, `clip: rect(0 0 0 0)` → `clip-path: inset(50%)`. Stylelint config
deliberately allows camelCase selectors (`selector-class-pattern: null` / `selector-id-pattern: null`
— the app uses camelCase by design, don't enforce kebab-case) and disables
`no-descending-specificity` (reordering rules for it is a regression risk, not worth the noise).

**How to apply:** before any dependency-refresh pass touches `2. CSS`, diff `awn.css` against the
current npm `awesome-notifications` dist before considering overwriting it — the color customization
has no other record. `rangeslider.css` and the rest can be treated as ordinary vendored files.
