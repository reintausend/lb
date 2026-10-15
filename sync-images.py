#!/usr/bin/env python3
"""Fill project pages and the feed from images dropped in each project folder.

A static page cannot list a folder by itself. After adding or removing images, run:

    python3 sync-images.py

Web images (jpg, jpeg, png, gif, webp, avif, svg) are picked up.
A file whose name starts with "preview" is the feed and page hero.
Otherwise the first file in alphabetical order is the hero.
Every other image is appended in the project page gallery.
HEIC/HEIF files are skipped because browsers do not display them.
"""

from html import escape
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
PROJECTS = ROOT / "projects"
FEED = ROOT / "feed.html"
PLACEHOLDER = "../../assets/images/placeholder.svg"
FEED_PLACEHOLDER = "assets/images/placeholder.svg"
WEB_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"}

FIGURE_RE = re.compile(
    r"\n?[ \t]*<figure>\s*<img\s+src=\"(?!https?:|\.\./)[^\"]*\"[^>]*>\s*</figure>",
    re.IGNORECASE,
)
GALLERY_RE = re.compile(
    r"[ \t]*<!-- gallery:start -->.*?<!-- gallery:end -->\n?",
    re.DOTALL,
)
PREVIEW_RE = re.compile(
    r'(<figure class="project-preview">\s*<img src=")[^"]+(")',
)
CONTENT_RE = re.compile(
    r"(<section class=\"project-content\">)(.*?)(</section>)",
    re.DOTALL,
)
TITLE_RE = re.compile(r'<h1 class="project-title">([^<]*)</h1>')


def web_images(folder):
    images = [
        path
        for path in folder.iterdir()
        if path.is_file() and path.suffix.lower() in WEB_EXTENSIONS
    ]
    images.sort(key=lambda path: path.name.lower())
    preview = next(
        (path for path in images if path.stem.lower().startswith("preview")),
        images[0] if images else None,
    )
    gallery = [path for path in images if path is not preview]
    return preview, gallery


def gallery_block(images, title):
    lines = ["      <!-- gallery:start -->"]
    safe_title = escape(title, quote=True)
    for image in images:
        src = escape(image.name, quote=True)
        lines.append("      <figure>")
        lines.append(
            f'        <img src="{src}" alt="{safe_title}" loading="lazy">'
        )
        lines.append("      </figure>")
    lines.append("      <!-- gallery:end -->")
    return "\n".join(lines) + "\n"


def restore_preview_markup(html, html_path):
    """Repair a preview tag split by an old regex replacement."""
    if PREVIEW_RE.search(html):
        return html
    restored, count = re.subn(
        r'\n[^\n<]*" alt="([^"]*)" loading="lazy">\s*</figure>',
        lambda match: (
            "\n    <figure class=\"project-preview\">\n"
            f"      <img src=\"{PLACEHOLDER}\" alt=\"{match.group(1)}\" loading=\"lazy\">\n"
            "    </figure>"
        ),
        html,
        count=1,
    )
    if count != 1:
        raise SystemExit(f"No preview image found in {html_path}")
    return restored


def update_project(html_path, preview, gallery):
    html = restore_preview_markup(html_path.read_text(encoding="utf-8"), html_path)
    title_match = TITLE_RE.search(html)
    title = title_match.group(1) if title_match else html_path.stem
    preview_src = escape(preview.name, quote=True) if preview else PLACEHOLDER

    def replace_preview(match):
        return match.group(1) + preview_src + match.group(2)

    updated, preview_count = PREVIEW_RE.subn(replace_preview, html, count=1)
    if preview_count != 1:
        raise SystemExit(f"No preview image found in {html_path}")

    content_match = CONTENT_RE.search(updated)
    if not content_match:
        raise SystemExit(f"No project content found in {html_path}")

    inner = GALLERY_RE.sub("", content_match.group(2))
    inner = FIGURE_RE.sub("", inner)
    inner = inner.rstrip() + "\n" + gallery_block(gallery, title)
    updated = (
        updated[: content_match.start()]
        + content_match.group(1)
        + inner
        + "    </section>"
        + updated[content_match.end() :]
    )
    html_path.write_text(updated, encoding="utf-8")


def update_feed(choices):
    html = FEED.read_text(encoding="utf-8")
    for slug, src in choices.items():
        pattern = re.compile(
            rf'(href="projects/{re.escape(slug)}/{re.escape(slug)}\.html">\s*<img src=")[^"]+'
        )
        html, count = pattern.subn(lambda match: match.group(1) + src, html, count=1)
        if count != 1:
            raise SystemExit(f"No feed image found for {slug}")
    FEED.write_text(html, encoding="utf-8")


def main():
    feed_sources = {}
    for html_path in sorted(PROJECTS.glob("*/*.html")):
        preview, gallery = web_images(html_path.parent)
        update_project(html_path, preview, gallery)
        if preview:
            feed_sources[html_path.parent.name] = (
                f"projects/{html_path.parent.name}/{preview.name}"
            )
        else:
            feed_sources[html_path.parent.name] = FEED_PLACEHOLDER
        extra = f" +{len(gallery)}" if gallery else ""
        shown = preview.name if preview else "placeholder"
        print(f"{html_path.parent.name}: {shown}{extra}")
    update_feed(feed_sources)


if __name__ == "__main__":
    main()
