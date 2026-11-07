#!/usr/bin/env python3
"""Surgical fixer driven by audit-css-report.json. Only applies mechanical, safe edits."""
import json, re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent
REPORT = ROOT / "audit-css-report.json"

def fix_important(text, finding):
    # Remove !important only when inside reduced-motion guard (intentional keep) -> skip
    return text, False

def fix_off_scale(text, finding):
    prop = finding.get("property", "")
    value = finding.get("value", "")
    if not prop or not value:
        return text, False
    # Replace off-scale px with nearest allowed
    scale = [0,1,2,4,8,12,16,24,32,48,64,96,128]
    def repl(m):
        px = float(m.group(1))
        nearest = min(scale, key=lambda s: abs(s-px))
        return f"{nearest:g}px" if nearest != px else m.group(0)
    new_value = re.sub(r"(-?\d*\.?\d+)px\b", lambda m: f"{min(scale,key=lambda s:abs(s-float(m.group(1)))):g}px", value)
    if new_value == value:
        return text, False
    old = f"{prop}: {value}"
    new = f"{prop}: {new_value}"
    if old in text:
        return text.replace(old, new, 1), True
    return text, False

def main():
    data = json.loads(REPORT.read_text())
    findings = data["findings"]
    # group by file
    files = {}
    for f in findings:
        files.setdefault(f["file"], []).append(f)
    for rel, fs in files.items():
        path = ROOT / rel
        if not path.exists():
            print("skip (missing):", rel); continue
        text = path.read_text(encoding="utf-8")
        applied = 0
        for f in fs:
            rule = f["rule"]
            if rule == "off-scale-pixel":
                text, ok = fix_off_scale(text, f)
                if ok: applied += 1
            else:
                # leave judgment items untouched
                pass
    path.write_text(text, encoding="utf-8")
    print(f"{rel}: applied {applied} mechanical fixes (of {len(fs)} findings)")

if __name__ == "__main__":
    main()