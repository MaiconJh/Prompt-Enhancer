---
name: analyzing-css-code-quality
description: >
  Audits CSS and CSS-in-JS stylesheets for specificity discipline, design-token conformance, layout resilience, cascade-layer correctness, and accessibility-critical visual properties. Use when the user asks for a CSS code review, wants to audit a stylesheet for maintainability or design-system drift, needs to diagnose specificity wars or !important creep, requests a token-compliance check, or asks whether layout and visual presentation meet WCAG reflow and motion-preference requirements.
---

# Analyzing CSS Code Quality

## Quick Reference

Analyze CSS source files or diffs and return findings grouped by severity (`critical`, `warning`, `suggestion`). Focus on the failure modes that do not surface as compile errors: specificity creep, token drift, non-resilient layout, cascade misuse, and accessibility regressions in visual presentation. For exact, mechanically checkable conditions (hardcoded hex values, `!important` counts, specificity above a threshold), run `scripts/audit_css.py` rather than counting manually.

## Scope boundary

This skill reviews **static CSS source** — `.css`, `.scss`, `.less`, and CSS-in-JS template literals when raw CSS is supplied. Do **not** attempt:

- live contrast-ratio measurement — that requires rendered colors and a runtime tool;
- visual-regression or screenshot comparison;
- JavaScript or framework component architecture outside the styling layer;
- browser-support assertions without checking current documentation.

When a finding depends on runtime behavior or rendered output, state the limitation explicitly rather than guessing.

## Instructions

### 1. Establish the analysis baseline

Before issuing findings, determine:

- **Token system present?** Search for `:root` blocks or theme files containing custom properties. If a token system exists, hardcoded visual values are **token drift**; if none exists, hardcoded values are **architecture debt**, not a conformance failure.
- **Cascade layers in use?** Look for an `@layer` statement. If present, record the declared order — it determines whether a specificity finding is a bug or a deliberate override.
- **Methodology in use?** Identify BEM, utility-first, CSS Modules, or unmanaged global CSS. Do not recommend a methodology the codebase has not adopted; review against the methodology actually present.
- **Target surface.** Distinguish component styles from page-level layout styles. The same selector may be acceptable in a layout layer and unacceptable in a component layer.

### 2. Run the deterministic audit script (recommended)

When a file or directory is available, run:

```
python scripts/audit_css.py --path <css-file-or-directory> --json
```

The script returns a structured report covering: `!important` count and locations, ID selectors, selector specificity maxima, hardcoded hex/rgb/hsl literals, off-scale pixel values, missing `prefers-reduced-motion` when `transition` or `animation` is present, and duplicate selectors. Use the script output as the factual base; reserve manual judgment for contextual interpretation and severity assignment.

### 3. Apply the review lenses

Work through the lenses in this order. Each has a corresponding reference file in `references/`; load a reference only when the codebase exhibits that concern.

**Lens A — Specificity and cascade discipline.** Check for `!important` without a documented cascade-layer justification, ID selectors on components, selector specificity above `(0,1,0)` in normal component rules, and overrides that raise specificity instead of relying on layer order or `:where()`. Load `references/specificity-and-cascade.md` when specificity conflicts are present or `@layer` usage needs validation.

**Lens B — Design-token conformance.** With a token system present, flag hardcoded colors, spacing, typography, radii, and shadows, and name the nearest semantic token substitute when one can be identified. Distinguish primitive, semantic, and component tiers. Load `references/token-conformance.md` for the full drift taxonomy and tier-mapping rules.

**Lens C — Layout resilience.** Flag fixed pixel widths/heights on containers that should reflow, missing `box-sizing: border-box` where inline-size or block-size is set on slotted content, margin-based spacing where `gap` is available, and viewport units (`vw`/`vh`) inside components that should use container units. Load `references/layout-and-responsive.md` when the review involves Grid, Flexbox, container queries, or fluid sizing.

**Lens D — Accessibility-critical CSS.** Check that `:focus-visible` exists for interactive elements, that `prefers-reduced-motion: reduce` neutralizes or shortens non-essential motion when transitions/animations are present, that text uses `rem`-relative sizing sufficient for 200% zoom, and that layout avoids horizontal scrolling at 320px width (WCAG 1.4.10 reflow). Do not attempt contrast measurement statically; instead, flag token pairs that are used as foreground/background without documented validation. Load `references/accessibility-visual.md` for criterion-level detail and implementation patterns.

**Lens E — Structural hygiene.** Check for duplicate selectors, empty rule blocks, unknown or misspelled properties, unlayered rules when a layer system is declared, and unused layers that were removed from the `@layer` statement. These are low-severity unless they indicate a broken cascade strategy.

### 4. Severity assignment

- **`critical`** — blocks reflow at 320px, removes keyboard focus visibility, ignores `prefers-reduced-motion` on essential motion, or introduces `!important` that masks a cascade bug without layer justification. These are correctness failures, not style preferences.
- **`warning`** — hardcoded visual values where a token exists, specificity above `(0,1,0)` without documented reason, viewport units inside components, margin-based spacing in layout primitives, or duplicate declarations that change computed values.
- **`suggestion`** — methodology-consistent improvements: replacing a fixed pixel with a fluid `clamp()`, moving a one-off rule into a utility layer, or switching a redundant media query to a container query when the component is clearly context-dependent.

### 5. Output format

Return a Markdown table with columns: **file**, **line**, **lens**, **severity**, **finding**, **suggested fix**. For findings that require runtime verification (contrast, rendered focus indicator size), append a note: `[requires runtime verification]`. Group the table by severity, critical first.

If the analysis covers a diff rather than a full file, restrict findings to changed lines unless a pre-existing issue makes the change unsafe.

## Edge cases

- **No token system present.** Do not report “token drift.” Report hardcoded values as architecture debt and recommend a token layer only if the codebase shows repeated values or multi-theme requirements.
- **Utility-first codebase.** In Tailwind or atomic CSS, specificity is intentionally flat and `!important` may be rare; focus Lens A on layer ordering and component escape hatches rather than utility-class specificity.
- **Preprocessor variables.** SCSS/Less variables that compile to static values are not custom properties. Treat them as design-token proxies only if they are the single source of truth; otherwise flag them as a source of drift against the runtime token system.
- **`@layer` present but unused.** If `@layer` is declared and no rules are placed inside it, flag the unlayered rules as breaking the declared cascade strategy — do not treat the declaration alone as compliance.
- **CSS-in-JS with dynamic values.** Template literals containing interpolated values cannot be statically resolved. Analyze the static portions and label interpolated values as unverifiable.