#!/usr/bin/env python3
"""
audit_css.py — Static auditor for CSS quality, token conformance and
accessibility-critical visual properties.

Usage:
    python audit_css.py --path <file-or-directory> [--json]

Dependencies:
    pip install tinycss2 css_specificity

Designed to be called by the `analyzing-css-code-quality` skill.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Iterable, Optional

try:
    import tinycss2
    from tinycss2.ast import (
        AtRule,
        Declaration,
        QualifiedRule,
        WhitespaceToken,
    )
except ImportError as exc:
    sys.exit("Missing dependency: tinycss2. Install with: pip install tinycss2")

try:
    from css_specificity import SpecificityCalculator
except ImportError:
    SpecificityCalculator = None  # fallback to internal heuristic


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class Finding:
    file: str
    line: int
    lens: str           # specificity | token | layout | a11y | hygiene
    severity: str       # critical | warning | suggestion
    rule: str           # short machine-readable code
    message: str
    selector: str = ""
    property: str = ""
    value: str = ""

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v not in ("", None)}


@dataclass
class AuditReport:
    files_analyzed: int = 0
    findings: list[Finding] = field(default_factory=list)
    summary: dict[str, Any] = field(default_factory=dict)

    def add(self, finding: Finding) -> None:
        self.findings.append(finding)

    def finalize(self) -> None:
        by_sev: dict[str, int] = {"critical": 0, "warning": 0, "suggestion": 0}
        by_lens: dict[str, int] = {}
        for f in self.findings:
            by_sev[f.severity] = by_sev.get(f.severity, 0) + 1
            by_lens[f.lens] = by_lens.get(f.lens, 0) + 1
        self.summary = {
            "files_analyzed": self.files_analyzed,
            "total_findings": len(self.findings),
            "by_severity": by_sev,
            "by_lens": by_lens,
        }


# ---------------------------------------------------------------------------
# Constants / heuristics
# ---------------------------------------------------------------------------

HEX_RE = re.compile(r"#(?:[0-9a-fA-F]{3,4}){1,2}\b")
RGB_HSL_RE = re.compile(r"\b(?:rgba?|hsla?)\s*\(", re.IGNORECASE)
PIXEL_RE = re.compile(r"(-?\d*\.?\d+)px\b")
ALLOWED_PX_SCALE = {0, 1, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128}
VIEWPORT_UNIT_RE = re.compile(r"\b\d*\.?\d+(?:vw|vh|vmin|vmax)\b", re.IGNORECASE)
CONTAINER_UNIT_RE = re.compile(r"\b\d*\.?\d+(?:cqw|cqh|cqi|cqb|cqmin|cqmax)\b", re.IGNORECASE)
FIXED_WIDTH_RE = re.compile(r"\bwidth\s*:\s*(\d+)px\b", re.IGNORECASE)
MOTION_PROPS_RE = re.compile(
    r"\b(?:animation|transition)(?:-[\w-]+)?\s*:", re.IGNORECASE
)
MOTION_MEDIA_RE = re.compile(
    r"@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)", re.IGNORECASE
)
LAYER_RE = re.compile(r"@layer\s+([^;{]+)[;{]", re.IGNORECASE)
FOCUS_VISIBLE_RE = re.compile(r":focus-visible\b", re.IGNORECASE)
FOCUS_RE = re.compile(r"(?<!:)\:focus(?!-visible)\b", re.IGNORECASE)
IMPORTANT_RE = re.compile(r"!\s*important\b", re.IGNORECASE)
ID_SELECTOR_RE = re.compile(r"#[\w-]+")
CLASS_SELECTOR_RE = re.compile(r"\.[\w-]+")
ELEMENT_SELECTOR_RE = re.compile(r"(?:^|[\s>+~,(])([a-zA-Z][\w-]*)")

# Specificity threshold above which a normal component rule is flagged.
SPEC_WARNING_THRESHOLD = (0, 2, 0)  # (id, class, element) → anything ≥ (0,2,0)


# ---------------------------------------------------------------------------
# CSS parsing helpers
# ---------------------------------------------------------------------------

def parse_css_file(path: Path) -> tuple[str, list[Any]]:
    """Return (raw_text, parsed_rules). Raises on unreadable input."""
    text = path.read_text(encoding="utf-8", errors="replace")
    rules = tinycss2.parse_stylesheet(
        text, skip_comments=True, skip_whitespace=True
    )
    return text, rules


def iter_declarations(
    rules: Iterable[Any],
) -> Iterable[tuple[Declaration, int]]:
    """Yield (declaration, line) from rules, descending into @media and @layer."""
    for rule in rules:
        if isinstance(rule, Declaration):
            yield rule, rule.source_line
        elif isinstance(rule, AtRule):
            # @media, @supports, @layer { ... }
            if rule.content and isinstance(rule.content, list):
                for sub in rule.content:
                    yield from iter_declarations([sub])


def extract_selector_text(rule: QualifiedRule) -> str:
    """Serialize the prelude of a qualified rule into a selector string."""
    parts: list[str] = []
    for token in rule.prelude:
        if isinstance(token, WhitespaceToken):
            parts.append(" ")
        elif hasattr(token, "serialize"):
            parts.append(token.serialize())
        else:
            parts.append(str(token))
    return "".join(parts).strip()


def _heuristic_specificity(selector: str) -> tuple[int, int, int]:
    """Fallback specificity (id, class, element) when css_specificity is absent."""
    ids = len(ID_SELECTOR_RE.findall(selector))
    classes = len(CLASS_SELECTOR_RE.findall(selector))
    # crude element count: identifiers not preceded by . or #
    elements = len(
        re.findall(r"(?<![\w.#-])[a-zA-Z][\w-]*", selector)
    )
    return (ids, classes, elements)


def compute_specificity(selector: str) -> tuple[int, int, int]:
    if SpecificityCalculator is not None:
        try:
            spec = SpecificityCalculator.calculate(selector)
            return (spec.a, spec.b, spec.c)
        except Exception:
            pass
    return _heuristic_specificity(selector)


# ---------------------------------------------------------------------------
# Lenses
# ---------------------------------------------------------------------------

def lens_specificity(
    path: Path, rules: list[Any], raw: str, report: AuditReport
) -> None:
    has_layer = bool(LAYER_RE.search(raw))

    for rule in rules:
        if isinstance(rule, QualifiedRule):
            selector = extract_selector_text(rule)
            if not selector:
                continue
            line = rule.source_line

            # ID selectors in component rules
            if ID_SELECTOR_RE.search(selector):
                report.add(
                    Finding(
                        file=str(path),
                        line=line,
                        lens="specificity",
                        severity="warning",
                        rule="id-selector-in-component",
                        message="ID selector used; prefer a class for reusable components.",
                        selector=selector,
                    )
                )

            spec = compute_specificity(selector)
            if spec >= SPEC_WARNING_THRESHOLD and not has_layer:
                report.add(
                    Finding(
                        file=str(path),
                        line=line,
                        lens="specificity",
                        severity="warning",
                        rule="high-specificity-selector",
                        message=(
                            f"Specificity {spec} exceeds (0,2,0) without cascade layers. "
                            "Consider lowering specificity or introducing @layer."
                        ),
                        selector=selector,
                    )
                )

    # !important occurrences
    for m in IMPORTANT_RE.finditer(raw):
        line = raw.count("\n", 0, m.start()) + 1
        report.add(
            Finding(
                file=str(path),
                line=line,
                lens="specificity",
                severity="critical" if not has_layer else "warning",
                rule="important-without-layer",
                message=(
                    "!important used without a cascade-layer justification; "
                    "it often masks a cascade bug."
                ),
            )
        )


def lens_token_conformance(
    path: Path, rules: list[Any], raw: str, report: AuditReport
) -> None:
    has_custom_props = "--" in raw and "var(" in raw
    for decl, line in iter_declarations(rules):
        prop = decl.lower_name
        value = decl.value.serialize().strip() if decl.value else ""

        # Hardcoded colors
        if HEX_RE.search(value) or RGB_HSL_RE.search(value):
            if not has_custom_props:
                sev, msg = (
                    "suggestion",
                    "Hardcoded colour; no token system detected — consider introducing tokens.",
                )
            else:
                sev, msg = (
                    "warning",
                    "Hardcoded colour where a design-token system is present; "
                    "prefer var(--color-*).",
                )
            report.add(
                Finding(
                    file=str(path),
                    line=line,
                    lens="token",
                    severity=sev,
                    rule="hardcoded-color",
                    message=msg,
                    property=prop,
                    value=value,
                )
            )

        # Off-scale pixel values
        for match in PIXEL_RE.finditer(value):
            try:
                px = float(match.group(1))
            except ValueError:
                continue
            if px not in ALLOWED_PX_SCALE:
                report.add(
                    Finding(
                        file=str(path),
                        line=line,
                        lens="token",
                        severity="suggestion",
                        rule="off-scale-pixel",
                        message=(
                            f"{px:g}px is outside the 4px spacing/scale system "
                            f"({sorted(ALLOWED_PX_SCALE)})."
                        ),
                        property=prop,
                        value=value,
                    )
                )


def lens_layout(
    path: Path, rules: list[Any], raw: str, report: AuditReport
) -> None:
    for decl, line in iter_declarations(rules):
        prop = decl.lower_name
        value = decl.value.serialize().strip() if decl.value else ""

        # Viewport units inside component-ish rules (heuristic: any rule)
        if VIEWPORT_UNIT_RE.search(value):
            report.add(
                Finding(
                    file=str(path),
                    line=line,
                    lens="layout",
                    severity="suggestion",
                    rule="viewport-unit-in-component",
                    message=(
                        "Viewport unit used; inside a component prefer container "
                        "units (cqi/cqw) or intrinsic sizing."
                    ),
                    property=prop,
                    value=value,
                )
            )

        # Fixed pixel width on containers
        m = FIXED_WIDTH_RE.search(f"{prop}: {value}")
        if m and int(m.group(1)) > 320:
            report.add(
                Finding(
                    file=str(path),
                    line=line,
                    lens="layout",
                    severity="critical",
                    rule="fixed-width-over-320px",
                    message=(
                        f"Fixed width of {m.group(1)}px can prevent reflow at 320px "
                        "(WCAG 1.4.10). Use max-width / min() / fluid sizing."
                    ),
                    property=prop,
                    value=value,
                )
            )

        # margin-based spacing where gap is available
        if prop in ("margin-bottom", "margin-top") and value not in ("0", "0px"):
            report.add(
                Finding(
                    file=str(path),
                    line=line,
                    lens="layout",
                    severity="suggestion",
                    rule="margin-spacing",
                    message=(
                        "Prefer parent gap over child margin for composable layout."
                    ),
                    property=prop,
                    value=value,
                )
            )


def lens_accessibility(
    path: Path, rules: list[Any], raw: str, report: AuditReport
) -> None:
    has_motion = bool(MOTION_PROPS_RE.search(raw))
    has_reduced = bool(MOTION_MEDIA_RE.search(raw))

    if has_motion and not has_reduced:
        # locate first motion declaration for line reference
        m = MOTION_PROPS_RE.search(raw)
        line = raw.count("\n", 0, m.start()) + 1 if m else 1
        report.add(
            Finding(
                file=str(path),
                line=line,
                lens="a11y",
                severity="critical",
                rule="motion-without-reduced-preference",
                message=(
                    "Animation/transition present but no @media "
                    "(prefers-reduced-motion: reduce) guard found in this file."
                ),
            )
        )

    # focus visibility
    has_focus_visible = bool(FOCUS_VISIBLE_RE.search(raw))
    has_focus_selector = bool(FOCUS_RE.search(raw))
    if has_focus_selector and not has_focus_visible:
        report.add(
            Finding(
                file=str(path),
                line=1,
                lens="a11y",
                severity="critical",
                rule="missing-focus-visible",
                message=(
                    ":focus used without :focus-visible; keyboard focus indicators "
                    "may be suppressed for pointer users while missing for keyboard "
                    "users. Add :focus-visible styles."
                ),
            )
        )


def lens_hygiene(
    path: Path, rules: list[Any], raw: str, report: AuditReport
) -> None:
    seen_selectors: dict[str, int] = {}
    for rule in rules:
        if not isinstance(rule, QualifiedRule):
            continue
        selector = extract_selector_text(rule)
        if not selector:
            continue
        if selector in seen_selectors:
            report.add(
                Finding(
                    file=str(path),
                    line=rule.source_line,
                    lens="hygiene",
                    severity="suggestion",
                    rule="duplicate-selector",
                    message=(
                        f"Selector also defined at line {seen_selectors[selector]}; "
                        "merge or verify intentional split."
                    ),
                    selector=selector,
                )
            )
        else:
            seen_selectors[selector] = rule.source_line

    # declared layers but no rules inside them (simple heuristic)
    if LAYER_RE.search(raw):
        unlayered = 0
        for rule in rules:
            if isinstance(rule, QualifiedRule):
                # crude: if the raw text before the rule contains no @layer block marker
                unlayered += 1
        if unlayered and not re.search(r"@layer\s+[^;{]+\s*\{", raw):
            report.add(
                Finding(
                    file=str(path),
                    line=1,
                    lens="hygiene",
                    severity="warning",
                    rule="declared-layer-unused",
                    message=(
                        "@layer declared but no block-form usage detected; "
                        "unlayered rules break the declared cascade strategy."
                    ),
                )
            )


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

LENS_FUNCS = {
    "specificity": lens_specificity,
    "token": lens_token_conformance,
    "layout": lens_layout,
    "a11y": lens_accessibility,
    "hygiene": lens_hygiene,
}


def audit_file(path: Path) -> AuditReport:
    report = AuditReport()
    if path.suffix.lower() != ".css":
        chunks = extract_css_from_js(path)
        if not chunks:
            return report
        report.files_analyzed = 1
        for css, base in chunks:
            tmp = path.parent / (path.stem + ".extracted.css")
            tmp.write_text(css, encoding="utf-8")
            raw, rules = parse_css_file(tmp)
            sub = AuditReport()
            sub.files_analyzed = 0
            for func in LENS_FUNCS.values():
                func(path, rules, raw, sub)
            for f in sub.findings:
                f.line = (f.line or 0) + base - 1
                f.file = str(path)
                report.add(f)
            try:
                tmp.unlink()
            except OSError:
                pass
        return report
    try:
        raw, rules = parse_css_file(path)
    except OSError as exc:
        report.add(
            Finding(
                file=str(path),
                line=0,
                lens="hygiene",
                severity="critical",
                rule="unreadable-file",
                message=str(exc),
            )
        )
        return report

    report.files_analyzed = 1
    for func in LENS_FUNCS.values():
        func(path, rules, raw, report)
    return report


def extract_css_from_js(path: Path) -> list[tuple[str, int]]:
    """Extract CSS template literals from a JS/TS file, returning (css, base_line)."""
    text = path.read_text(encoding="utf-8", errors="replace")
    out = []
    for m in re.finditer(r"GM_addStyle\s*\(`(.*?)`\)", text, re.DOTALL):
        css = m.group(1)
        base = text.count("\n", 0, m.start(1)) + 1
        out.append((css, base))
    # also handle tagged template css`...` / styled`...`
    for m in re.finditer(r"(?:css|styled)\s*`([^`]*)`", text, re.DOTALL):
        css = m.group(1)
        base = text.count("\n", 0, m.start(1)) + 1
        out.append((css, base))
    return out


def collect_css_files(root: Path) -> list[Path]:
    if root.is_file() and root.suffix.lower() in (".css", ".js", ".jsx", ".ts", ".tsx"):
        return [root]
    if root.is_dir():
        files = []
        for pat in ("*.css", "*.js", "*.jsx", "*.ts", "*.tsx"):
            files.extend(root.rglob(pat))
        return sorted(
            p for p in files
            if "node_modules" not in p.parts and ".git" not in p.parts
        )
    return []


def merge_reports(reports: list[AuditReport]) -> AuditReport:
    merged = AuditReport()
    for r in reports:
        merged.files_analyzed += r.files_analyzed
        merged.findings.extend(r.findings)
    merged.finalize()
    return merged


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Static CSS quality auditor for the analyzing-css-code-quality skill."
    )
    parser.add_argument(
        "--path",
        required=True,
        help="CSS file or directory to audit.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit machine-readable JSON instead of the default text summary.",
    )
    args = parser.parse_args(argv)

    root = Path(args.path).expanduser().resolve()
    css_files = collect_css_files(root)
    if not css_files:
        print(f"No .css files found at {root}", file=sys.stderr)
        return 2

    reports = [audit_file(p) for p in css_files]
    merged = merge_reports(reports)

    if args.json:
        payload = {
            "summary": merged.summary,
            "findings": [f.to_dict() for f in merged.findings],
        }
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    else:
        print(f"Files analysed: {merged.files_analyzed}")
        for sev in ("critical", "warning", "suggestion"):
            subset = [f for f in merged.findings if f.severity == sev]
            if not subset:
                continue
            print(f"\n== {sev.upper()} ({len(subset)}) ==")
            for f in subset:
                loc = f"{f.file}:{f.line}"
                print(f"  [{f.rule}] {loc}  {f.message}")
        if not merged.findings:
            print("No findings.")

    # exit code: non-zero if critical findings exist (useful in CI)
    return 1 if any(f.severity == "critical" for f in merged.findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())