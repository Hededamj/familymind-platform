"""Extract Mette's målgruppeprofiler (.docx) to markdown.

Reads all .docx files in docs/personas/sources/ and writes corresponding
.md files to docs/personas/<slug>.md. Idempotent — safe to re-run.

Usage:
    python scripts/extract-personas.py
"""

import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def extract_paragraphs(docx_path: Path):
    """Yield (full_text, runs, is_list) for each paragraph in the document."""
    with zipfile.ZipFile(docx_path) as z:
        xml_bytes = z.read("word/document.xml")
    root = ET.fromstring(xml_bytes)

    for p in root.iter(W + "p"):
        pPr = p.find(W + "pPr")
        is_list = pPr is not None and pPr.find(W + "numPr") is not None

        runs = []
        for r in p.iter(W + "r"):
            bold = False
            rPr = r.find(W + "rPr")
            if rPr is not None and rPr.find(W + "b") is not None:
                bold = True
            text = "".join(t.text or "" for t in r.iter(W + "t"))
            runs.append((text, bold))

        full_text = "".join(t for t, _ in runs)
        yield full_text, runs, is_list


def runs_to_md(runs) -> str:
    parts = []
    for text, bold in runs:
        if not text:
            continue
        parts.append(f"**{text}**" if bold else text)
    return "".join(parts)


def to_markdown(docx_path: Path) -> str:
    lines = []
    for full_text, runs, is_list in extract_paragraphs(docx_path):
        stripped = full_text.strip()
        if not stripped:
            lines.append("")
            continue

        # Document title: "Målgruppeprofil (intern) – ..."
        if stripped.startswith("Målgruppeprofil"):
            lines.append(f"# {stripped}")
            continue

        # Numbered sections: "1) Kursus", "10) Segmenter", ...
        m = re.match(r"^\s*(\d+)\)\s*(.+)$", stripped)
        if m:
            lines.append(f"## {m.group(1)}. {m.group(2).strip()}")
            continue

        content = runs_to_md(runs).rstrip()
        lines.append(f"- {content}" if is_list else content)

    out = "\n".join(lines)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip() + "\n"


def main() -> int:
    sources_dir = Path("docs/personas/sources")
    dest_dir = Path("docs/personas")

    if not sources_dir.is_dir():
        print(f"error: {sources_dir} does not exist", file=sys.stderr)
        return 1

    docx_files = sorted(sources_dir.glob("*.docx"))
    if not docx_files:
        print(f"no .docx files found in {sources_dir}")
        return 0

    for docx in docx_files:
        md = to_markdown(docx)
        out_path = dest_dir / (docx.stem + ".md")
        out_path.write_text(md, encoding="utf-8")
        print(f"wrote: {out_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
