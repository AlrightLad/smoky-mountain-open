"""Shared bootstrap helper for regen-*.py scripts.

R1 remediation (2026-05-15): regen scripts depend on docs/reports/*.html
scaffolds. If a scaffold is missing the script previously exited 1 with
"file missing" — the post-commit hook then swallowed this with `|| true`,
silently no-op'ing the regen and leaving Founder with no dashboard. The
audit-report-2026-05-15.md "snapshot-PASS vs durable-PASS" lesson named
this pattern.

Use:
    from _dashboard_bootstrap import ensure_scaffold
    ensure_scaffold(TARGET)  # raises if scaffold can't be produced

The function copies templates/dashboards/<name>.template.html → docs/reports/
<name>.html (and the same for _assets/). Idempotent: skips files that
already exist. Pure-Python (no bash dependency) so it works under standalone
Python invocations on Windows where the bootstrap-via-bash variant fails.

Any failure raises SystemExit(1) with a clear diagnostic message.
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = ROOT / "templates" / "dashboards"
DEST_DIR = ROOT / "docs" / "reports"


def _scaffold_one(template_name: str) -> bool:
    """Copy a single template to its destination if missing. Returns True if
    a file was copied, False if skipped (already present) or template
    missing. Raises if destination directory can't be created."""
    template = TEMPLATES_DIR / f"{template_name}.template.html"
    dest = DEST_DIR / f"{template_name}.html"
    if dest.exists():
        return False
    if not template.exists():
        return False
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(template, dest)
    return True


def _scaffold_assets() -> bool:
    """Copy _assets/ from templates if dest is missing. Returns True if
    copied, False if skipped."""
    src = TEMPLATES_DIR / "_assets"
    dst = DEST_DIR / "_assets"
    if dst.exists():
        return False
    if not src.exists():
        return False
    shutil.copytree(src, dst)
    return True


def ensure_scaffold(target_path: Path) -> None:
    """Ensure target HTML exists; scaffold from templates if missing.

    Raises SystemExit(1) with diagnostic if templates are unavailable or
    target still missing after scaffolding.
    """
    if target_path.exists():
        return

    if not TEMPLATES_DIR.exists():
        print(
            f"[bootstrap] FAIL templates directory missing at {TEMPLATES_DIR}. "
            f"Cannot self-heal — run from repo root or check git status.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    # Always scaffold _assets/ when bootstrapping a missing target — they
    # carry CSS/JS the HTML needs to render.
    _scaffold_assets()

    template_name = target_path.stem  # "dashboard.html" → "dashboard"
    copied = _scaffold_one(template_name)
    if not copied:
        # Either the template doesn't exist or the destination was created
        # between checks. Re-check disk state.
        if not target_path.exists():
            print(
                f"[bootstrap] FAIL no template at "
                f"{TEMPLATES_DIR / (template_name + '.template.html')}; "
                f"templates/dashboards/ may be incomplete.",
                file=sys.stderr,
            )
            raise SystemExit(1)
    else:
        print(
            f"[bootstrap] scaffolded {target_path.name} from templates",
            file=sys.stderr,
        )
