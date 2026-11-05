#!/usr/bin/env python3
"""Build content/treatment-pages/*.json from content/from-production/."""

from __future__ import annotations

import json
from pathlib import Path

from treatment_content_lib import (
    FROM_PRODUCTION,
    OUT_DIR,
    problem_to_template,
    procedure_to_template,
    write_template,
)

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    written: list[Path] = []

    problems_dir = FROM_PRODUCTION / "problems"
    if problems_dir.is_dir():
        for path in sorted(problems_dir.glob("*.json")):
            doc = json.loads(path.read_text(encoding="utf-8"))
            if doc.get("error"):
                continue
            tpl = problem_to_template(doc)
            written.append(write_template(tpl))

    for folder in ("behandlingar", "plastikkirurgi"):
        single_files = FROM_PRODUCTION / folder
        if single_files.is_dir():
            sources = sorted(single_files.glob("*.json"))
        else:
            sources = []
        legacy = FROM_PRODUCTION / f"{folder}.json"
        if legacy.is_file() and not sources:
            data = json.loads(legacy.read_text(encoding="utf-8"))
            for doc in data:
                if doc.get("sections"):
                    tpl = procedure_to_template(doc)
                    written.append(write_template(tpl))
            continue
        for path in sources:
            doc = json.loads(path.read_text(encoding="utf-8"))
            if doc.get("error"):
                continue
            if not doc.get("sections"):
                continue
            tpl = procedure_to_template(doc)
            written.append(write_template(tpl))

    index = {
        "count": len(written),
        "paths": sorted(
            str(p.relative_to(ROOT)).replace("\\", "/") for p in written
        ),
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(written)} treatment page(s) → {OUT_DIR}")


if __name__ == "__main__":
    main()
