#!/usr/bin/env python3
"""Build legal shell + hydrated pages."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    py = sys.executable
    scripts = ROOT / "scripts"
    subprocess.check_call([py, str(scripts / "seed_legal_content.py")])
    subprocess.check_call([py, str(scripts / "build_legal_page_shell.py")])
    subprocess.check_call([py, str(scripts / "hydrate_legal_page.py")])
    subprocess.check_call([py, str(scripts / "fix_legal_links_in_export.py")])


if __name__ == "__main__":
    main()
