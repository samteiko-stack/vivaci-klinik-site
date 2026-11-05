#!/usr/bin/env python3
"""Pull structured content from vivaci-klinik-production (Next.js SSR)."""

from __future__ import annotations

import json
import re
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE = "https://vivaci-klinik-production.up.railway.app"
OUT = Path(__file__).resolve().parents[1] / "content" / "from-production"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Vivaci-Webflow-Migration/1.0"})

ROUTE_PREFIXES = (
    "/problem/",
    "/behandlingar/",
    "/plastikkirurgi/",
    "/experter/",
    "/nyheter/",
    "/faq",
    "/om-oss",
    "/kontakt",
    "/fore-efter",
    "/plastikkirurgi",
    "/behandlingar",
    "/problem",
)


def fetch(path: str) -> str:
    url = urljoin(BASE, path)
    r = SESSION.get(url, timeout=45)
    r.raise_for_status()
    return r.text


def discover_paths() -> list[str]:
    seen: set[str] = set()
    queue: deque[str] = deque(["/"])
    while queue:
        path = queue.popleft()
        if path in seen:
            continue
        seen.add(path)
        try:
            html = fetch(path)
        except requests.RequestException as exc:
            print(f"skip {path}: {exc}")
            continue
        for href in re.findall(r'href="(/[^"#?]+)"', html):
            if href.startswith("/en"):
                continue
            if any(href == p or href.startswith(p) for p in ROUTE_PREFIXES):
                if href not in seen:
                    queue.append(href)
            if href in {"/om-oss", "/kontakt", "/faq", "/fore-efter", "/behandlingar", "/problem", "/plastikkirurgi"}:
                if href not in seen:
                    queue.append(href)
        time.sleep(0.15)
    return sorted(seen)


def section_map(main: BeautifulSoup) -> dict[str, list[str]]:
    """Map h2 heading -> paragraph texts until next h2."""
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for el in main.find_all(["h2", "p"], recursive=True):
        if el.name == "h2":
            current = el.get_text(" ", strip=True)
            sections.setdefault(current, [])
        elif el.name == "p" and current:
            t = el.get_text(" ", strip=True)
            if t:
                sections[current].append(t)
    return sections


def _decode_escaped_json_string(raw: str) -> str:
    return json.loads(f'"{raw}"')


def _parse_json_string_array(raw: str) -> list[str]:
    data = json.loads(raw.replace('\\"', '"').replace("\\\\", "\\"))
    if not isinstance(data, list):
        return []
    return [str(x).strip() for x in data if str(x).strip()]


def parse_care_tabs_from_html(html: str) -> dict[str, Any] | None:
    """Tabbed Före/Efter copy lives in Next RSC payload, not always as h2 sections."""
    if "beforeItems" not in html or "afterItems" not in html:
        return None

    intro_b = intro_a = ""
    before: list[str] = []
    after: list[str] = []

    rsc_intro_b = re.search(r'beforeIntro\\":\\"((?:\\\\.|[^"\\])*)\\"', html)
    rsc_intro_a = re.search(r'afterIntro\\":\\"((?:\\\\.|[^"\\])*)\\"', html)
    rsc_start = html.find('beforeItems\\":[')
    if rsc_start >= 0:
        sub = html[rsc_start + len('beforeItems\\":') :]
        parts = sub.split('],\\"afterItems\\":', 1)
        if len(parts) == 2:
            try:
                before = _parse_json_string_array(parts[0] + "]")
                after_end = parts[1].find("]")
                after = _parse_json_string_array(parts[1][: after_end + 1])
            except json.JSONDecodeError:
                before = []
                after = []
        if rsc_intro_b:
            intro_b = rsc_intro_b.group(1)
        if rsc_intro_a:
            intro_a = rsc_intro_a.group(1)

    if not before and not after:
        intro_b_m = re.search(r'"beforeIntro"\s*:\s*"((?:\\.|[^"\\])*)"', html)
        intro_a_m = re.search(r'"afterIntro"\s*:\s*"((?:\\.|[^"\\])*)"', html)
        before_m = re.search(r'"beforeItems"\s*:\s*(\[[^\]]*\])', html)
        after_m = re.search(r'"afterItems"\s*:\s*(\[[^\]]*\])', html)
        if before_m and after_m:
            try:
                before = _parse_json_string_array(before_m.group(1))
                after = _parse_json_string_array(after_m.group(1))
            except json.JSONDecodeError:
                return None
        if intro_b_m:
            intro_b = _decode_escaped_json_string(intro_b_m.group(1))
        if intro_a_m:
            intro_a = _decode_escaped_json_string(intro_a_m.group(1))

    if not before and not after and not intro_b and not intro_a:
        return None
    return {
        "introBefore": intro_b,
        "introAfter": intro_a,
        "before": before,
        "after": after,
    }


def _merge_care_tabs_into_sections(sections: dict[str, dict], care: dict[str, Any]) -> None:
    """Prefer structured tab data over flattened Före & eftervård paragraphs."""
    if care.get("introBefore") or care.get("before"):
        sections["Före behandling"] = {
            "paragraphs": [care["introBefore"]] if care.get("introBefore") else [],
            "items": care.get("before") or [],
            "children": {},
        }
    if care.get("introAfter") or care.get("after"):
        sections["Efter behandling"] = {
            "paragraphs": [care["introAfter"]] if care.get("introAfter") else [],
            "items": care.get("after") or [],
            "children": {},
        }


def section_map_rich(main: BeautifulSoup) -> dict[str, dict]:
    """Map h2 -> paragraphs, list items, and h3 subsections."""
    sections: dict[str, dict] = {}
    current_h2: str | None = None
    current_h3: str | None = None

    def bucket(h2: str) -> dict:
        sections.setdefault(
            h2,
            {"paragraphs": [], "items": [], "children": {}},
        )
        return sections[h2]

    def child(h2: str, h3: str) -> dict:
        b = bucket(h2)
        b["children"].setdefault(h3, {"paragraphs": [], "items": []})
        return b["children"][h3]

    for el in main.find_all(["h2", "h3", "p", "li"], recursive=True):
        if el.name == "h2":
            current_h2 = el.get_text(" ", strip=True)
            current_h3 = None
            bucket(current_h2)
        elif el.name == "h3" and current_h2:
            current_h3 = el.get_text(" ", strip=True)
            child(current_h2, current_h3)
        elif el.name == "p" and current_h2:
            t = el.get_text(" ", strip=True)
            if not t:
                continue
            if current_h3:
                child(current_h2, current_h3)["paragraphs"].append(t)
            else:
                bucket(current_h2)["paragraphs"].append(t)
        elif el.name == "li" and current_h2:
            t = el.get_text(" ", strip=True)
            if not t:
                continue
            if current_h3:
                child(current_h2, current_h3)["items"].append(t)
            else:
                bucket(current_h2)["items"].append(t)
    return sections


def parse_facts(main: BeautifulSoup) -> tuple[list[dict[str, str]], str]:
    """Behandlingsfakta sidebar-style facts from production layout."""
    items: list[dict[str, str]] = []
    summary = ""
    for block in main.find_all(string=re.compile(r"Behandlingsfakta", re.I)):
        parent = block.parent
        if not parent:
            continue
        container = parent.find_parent(id="main-content") or parent.parent
        if not container:
            continue
        text = container.get_text("\n", strip=True)
        for label in ("Behandlingstid", "Återhämtning", "Smärtnivå", "Pris"):
            m = re.search(re.escape(label) + r"\s+([^\n]+)", text)
            if m:
                items.append({"label": label, "value": m.group(1).strip()})
        break
    return items, summary


def parse_related(main: BeautifulSoup, path: str) -> list[dict[str, str]]:
    related: list[dict[str, str]] = []
    for a in main.find_all("a", href=True):
        href = a["href"]
        if href == path or not href.startswith("/"):
            continue
        if href.startswith(("/behandlingar/", "/problem/", "/plastikkirurgi/")):
            title = a.get_text(" ", strip=True).split("Läs mer")[0].strip()[:120]
            if title:
                related.append({"title": title, "href": href})
    dedup: dict[str, dict[str, str]] = {}
    for item in related:
        dedup[item["href"]] = item
    return list(dedup.values())[:12]


def _dedupe_faqs(items: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    out: list[dict[str, str]] = []
    for row in items:
        q = (row.get("question") or "").strip()
        if not q or q in seen:
            continue
        seen.add(q)
        out.append({"question": q, "answer": (row.get("answer") or "").strip()})
    return out


def parse_faq_from_main(main: BeautifulSoup) -> list[dict[str, str]]:
    """Production FAQ accordions live under h2 «Vanliga frågor»."""
    items: list[dict[str, str]] = []
    for h2 in main.find_all("h2"):
        if h2.get_text(strip=True).lower() != "vanliga frågor":
            continue
        section = h2.find_parent("section") or main
        for btn in section.find_all("button"):
            q = btn.get_text(" ", strip=True)
            if not q or len(q) > 200:
                continue
            answer = ""
            container = btn.find_parent("div")
            if container:
                for p in container.find_all("p"):
                    t = p.get_text(" ", strip=True)
                    if t and t != q:
                        answer = t
                        break
            if answer:
                items.append({"question": q, "answer": answer})
        break
    if items:
        return _dedupe_faqs(items)
    return parse_faq(main.get_text("\n", strip=True))


def parse_faq(main_text: str) -> list[dict[str, str]]:
    m = re.search(
        r"Vanliga frågor\s+(.*?)(?:Boka din kostnadsfria|Osäker på vilken|Möt våra experter|$)",
        main_text,
        re.S | re.I,
    )
    if not m:
        return []
    lines = [ln.strip() for ln in m.group(1).split("\n") if ln.strip()]
    faqs: list[dict[str, str]] = []
    i = 0
    while i < len(lines):
        if lines[i].endswith("?"):
            q = lines[i]
            if q.lower().startswith("osäker på vilken"):
                break
            ans = lines[i + 1] if i + 1 < len(lines) and not lines[i + 1].endswith("?") else ""
            faqs.append({"question": q, "answer": ans})
            i += 2 if ans else 1
        else:
            i += 1
    return _dedupe_faqs(faqs)


def parse_problem(slug: str, html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find(id="main-content")
    if not main:
        return {"slug": slug, "error": "no main-content"}
    h1 = main.find("h1")
    title = h1.get_text(" ", strip=True) if h1 else slug
    intro = ""
    if h1:
        for sib in h1.find_all_next(["p", "h2"], limit=4):
            if sib.name == "h2":
                break
            if sib.name == "p":
                intro = sib.get_text(" ", strip=True)
                break
    sections = section_map(main)
    main_text = main.get_text("\n", strip=True)
    recommended: list[dict[str, str]] = []
    for a in main.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/behandlingar/"):
            recommended.append(
                {
                    "slug": href.rstrip("/").split("/")[-1],
                    "name": a.get_text(" ", strip=True).split("Läs mer")[0].strip()[:120],
                    "url": href,
                }
            )
    # dedupe recommended by slug
    dedup: dict[str, dict] = {}
    for item in recommended:
        dedup[item["slug"]] = item
    return {
        "type": "problem",
        "slug": slug,
        "sourceUrl": f"{BASE}/problem/{slug}",
        "name": title,
        "heroIntro": intro,
        "whatIsIt": "\n\n".join(sections.get("Vad är det?", [])),
        "symptoms": "\n\n".join(sections.get("Tecken & symtom", [])),
        "causes": "\n\n".join(sections.get("Orsaker", [])),
        "assessment": "\n\n".join(sections.get("Hur vi bedömer det", [])),
        "recommendedTreatments": list(dedup.values()),
        "faqs": parse_faq_from_main(main),
        "rawSectionHeadings": list(sections.keys()),
    }


def parse_procedure(path: str, html: str, page_type: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find(id="main-content")
    if not main:
        return {"path": path, "error": "no main-content", "type": page_type}
    h1 = main.find("h1")
    title = h1.get_text(" ", strip=True) if h1 else path.rstrip("/").split("/")[-1]
    intro = ""
    if h1:
        for sib in h1.find_all_next(["p", "h2"], limit=4):
            if sib.name == "h2":
                break
            if sib.name == "p":
                intro = sib.get_text(" ", strip=True)
                break
    sections = section_map_rich(main)
    care_tabs = parse_care_tabs_from_html(html)
    if care_tabs:
        _merge_care_tabs_into_sections(sections, care_tabs)
    facts, facts_summary = parse_facts(main)
    return {
        "type": page_type,
        "path": path,
        "sourceUrl": urljoin(BASE, path),
        "title": title,
        "heroIntro": intro,
        "sections": sections,
        "facts": facts,
        "factsSummary": facts_summary,
        "faqs": parse_faq_from_main(main),
        "related": parse_related(main, path),
        "rawSectionHeadings": list(sections.keys()),
    }


def parse_home_faq(html: str) -> dict:
    """Homepage FAQ accordion from production."""
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find(id="main-content") or soup
    section = main
    items: list[dict[str, str]] = []
    for h2 in main.find_all("h2"):
        if h2.get_text(strip=True) != "Vanliga frågor":
            continue
        section = h2.find_parent("section") or main
        for btn in section.find_all("button"):
            q = btn.get_text(" ", strip=True)
            if not q or len(q) > 120:
                continue
            answer = ""
            container = btn.find_parent("div")
            if container:
                for p in container.find_all("p"):
                    t = p.get_text(" ", strip=True)
                    if t and t != q and len(t) < 600:
                        answer = t
                        break
            if answer:
                items.append({"question": q, "answer": answer})
        break
    seen: set[str] = set()
    deduped: list[dict[str, str]] = []
    for row in items:
        if row["question"] in seen:
            continue
        seen.add(row["question"])
        deduped.append(row)
    cta_href = "/faq"
    for a in section.find_all("a", href=True) if section else []:
        if "Se alla" in a.get_text(strip=True):
            cta_href = a["href"]
            cta_label = a.get_text(" ", strip=True).replace("→", "").strip()
            break
    else:
        cta_label = "Se alla frågor"
    return {
        "sourceUrl": f"{BASE}/",
        "tagline": "FAQ",
        "heading": "Vanliga frågor",
        "intro": (
            "Här hittar du svar på de vanligaste frågorna om bokning, "
            "behandlingar och besök hos oss."
        ),
        "cta": {"label": cta_label, "href": cta_href},
        "items": deduped,
    }


def parse_footer(html: str) -> dict:
    """Site footer: contact, link columns, newsletter, legal (production homepage)."""
    soup = BeautifulSoup(html, "html.parser")
    foot = soup.find("footer")
    out: dict = {
        "sourceUrl": f"{BASE}/",
        "contact": {},
        "linkColumns": [],
        "newsletter": {},
        "legal": [],
        "copyright": "",
    }
    if not foot:
        return out

    grid_cols = foot.select(".grid > div")
    if not grid_cols:
        grid_cols = [c for c in foot.find_all("div", recursive=False)]

    if grid_cols:
        col0 = grid_cols[0]
        for a in col0.find_all("a", href=True):
            href = a["href"]
            text = a.get_text(" ", strip=True)
            if "google.com/maps" in href and text:
                out["contact"]["address"] = {"label": text, "href": href}
            elif href.startswith("tel:"):
                out["contact"]["phone"] = {"label": text, "href": href}
            elif href.startswith("mailto:"):
                out["contact"]["email"] = {"label": text, "href": href}
            elif "facebook.com" in href:
                out["contact"].setdefault("social", []).append(
                    {"network": "facebook", "href": href, "label": "Facebook"}
                )
            elif "instagram.com" in href:
                out["contact"].setdefault("social", []).append(
                    {"network": "instagram", "href": href, "label": "Instagram"}
                )
            elif "tiktok.com" in href:
                out["contact"].setdefault("social", []).append(
                    {"network": "tiktok", "href": href, "label": "TikTok"}
                )

        for i, col in enumerate(grid_cols[1:], start=1):
            h3 = col.find("h3")
            if not h3:
                continue
            title = h3.get_text(strip=True)
            if title.lower() == "nyhetsbrev":
                ps = col.find_all("p")
                headings = [p.get_text(strip=True) for p in ps if p.get_text(strip=True)]
                form = col.find("form")
                inp = form.find("input", attrs={"type": "email"}) if form else None
                btn = form.find("button") if form else None
                out["newsletter"] = {
                    "sectionTitle": title,
                    "title": headings[0] if headings else "Håll dig uppdaterad",
                    "description": headings[1] if len(headings) > 1 else "",
                    "placeholder": inp.get("placeholder") if inp else "Din e-postadress",
                    "submitLabel": btn.get_text(strip=True) if btn else "Prenumerera",
                }
                continue
            links: list[dict[str, str]] = []
            for a in col.find_all("a", href=True):
                label = a.get_text(" ", strip=True)
                if not label:
                    continue
                links.append({"label": label, "href": a["href"]})
            if links:
                out["linkColumns"].append({"title": title, "links": links})

    bottom = foot.select_one(".border-t")
    if bottom:
        copy_el = bottom.find("p")
        if copy_el:
            out["copyright"] = copy_el.get_text(" ", strip=True)
        for a in bottom.find_all("a", href=True):
            label = a.get_text(" ", strip=True)
            if not label:
                continue
            out["legal"].append({"label": label, "href": a["href"]})

    return out


def parse_home_problems_slider(html: str) -> dict:
    """Featured Hudproblem carousel on the production homepage."""
    soup = BeautifulSoup(html, "html.parser")
    for h2 in soup.find_all("h2"):
        if h2.get_text(strip=True) != "Hudproblem":
            continue
        section = h2.find_parent("section")
        if not section:
            continue
        links: list[dict[str, str]] = []
        for a in section.find_all("a", href=True):
            if not a["href"].startswith("/problem/"):
                continue
            name = a.get_text(" ", strip=True)
            if not name or len(name) > 50:
                continue
            slug = a["href"].rstrip("/").split("/")[-1]
            links.append({"href": a["href"], "slug": slug, "name": name})
        seen: set[str] = set()
        ordered: list[dict[str, str]] = []
        for item in links:
            if item["slug"] in seen:
                continue
            seen.add(item["slug"])
            ordered.append(item)
        bgs: list[str] = []
        for el in section.find_all(style=True):
            m = re.search(r'background-image:url\("([^"]+)"\)', el.get("style", ""))
            if m:
                bgs.append(m.group(1))
        items: list[dict[str, str]] = []
        for i, link in enumerate(ordered):
            row = dict(link)
            if i < len(bgs):
                row["image"] = bgs[i]
            items.append(row)
        cta = {"label": "Se alla problem", "href": "/problem?kategori=hud"}
        for a in section.find_all("a", href=True):
            if "Se alla" in a.get_text(strip=True):
                cta = {"label": a.get_text(strip=True), "href": a["href"]}
                break
        intro = ""
        for p in section.find_all("p"):
            t = p.get_text(" ", strip=True)
            if len(t) > 40 and "Se alla" not in t:
                intro = t
                break
        if not intro:
            intro = (
                "Från acne och rosacea till pigmentering och förstorade porer — "
                "utforska vanliga hudproblem och läs mer om hur vi bedömer och "
                "behandlar dem på Vivaci."
            )
        return {
            "sourceUrl": f"{BASE}/",
            "tagline": "Problem",
            "heading": "Hudproblem",
            "intro": intro,
            "cta": cta,
            "items": items,
        }
    return {"sourceUrl": f"{BASE}/", "tagline": "Problem", "heading": "Hudproblem", "items": []}


def parse_generic(path: str, html: str, page_type: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find(id="main-content") or soup.find("main") or soup.body
    title = soup.title.get_text(strip=True) if soup.title else path
    h1 = main.find("h1") if main else None
    return {
        "type": page_type,
        "path": path,
        "sourceUrl": urljoin(BASE, path),
        "title": h1.get_text(strip=True) if h1 else title,
        "headings": [h.get_text(strip=True) for h in main.find_all(["h2", "h3"])[:40]] if main else [],
        "textPreview": (main.get_text(" ", strip=True)[:1200] if main else ""),
    }


def classify(path: str) -> str:
    if path.startswith("/problem/") and path.count("/") >= 2:
        return "problem"
    if path.startswith("/behandlingar/") and path.count("/") >= 2:
        return "behandling"
    if path.startswith("/plastikkirurgi/") and path.count("/") >= 2:
        return "plastikkirurgi"
    if path.startswith("/experter/") and path.count("/") >= 2:
        return "expert"
    if path.startswith("/nyheter/") and path.count("/") >= 2:
        return "nyhet"
    return "static"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    print("Discovering paths…")
    paths = discover_paths()
    manifest = {
        "baseUrl": BASE,
        "pulledAt": datetime.now(timezone.utc).isoformat(),
        "pathCount": len(paths),
        "paths": paths,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    buckets: dict[str, list] = {
        "problems": [],
        "behandlingar": [],
        "plastikkirurgi": [],
        "experter": [],
        "nyheter": [],
        "static": [],
    }

    home_html: str | None = None

    for path in paths:
        kind = classify(path)
        slug = path.rstrip("/").split("/")[-1]
        print(f"  {path} ({kind})")
        try:
            html = fetch(path)
        except requests.RequestException as exc:
            print(f"    failed: {exc}")
            continue
        if path == "/":
            home_html = html
        if kind == "problem":
            doc = parse_problem(slug, html)
            buckets["problems"].append(doc)
            (OUT / "problems" / f"{slug}.json").parent.mkdir(parents=True, exist_ok=True)
            (OUT / "problems" / f"{slug}.json").write_text(
                json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8"
            )
        elif kind in ("behandling", "plastikkirurgi"):
            doc = parse_procedure(path, html, kind)
            folder = "behandlingar" if kind == "behandling" else "plastikkirurgi"
            buckets[folder].append(doc)
            (OUT / folder / f"{slug}.json").parent.mkdir(parents=True, exist_ok=True)
            (OUT / folder / f"{slug}.json").write_text(
                json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8"
            )
        else:
            doc = parse_generic(path, html, kind)
            key = {
                "expert": "experter",
                "nyhet": "nyheter",
            }.get(kind, "static")
            buckets[key].append(doc)
        time.sleep(0.12)

    for name, items in buckets.items():
        (OUT / f"{name}.json").write_text(
            json.dumps(items, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    if home_html:
        slider = parse_home_problems_slider(home_html)
        (OUT / "home-problems-slider.json").write_text(
            json.dumps(slider, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"  home-problems-slider ({len(slider.get('items', []))} items)")
        faq = parse_home_faq(home_html)
        (OUT / "home-faq.json").write_text(
            json.dumps(faq, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"  home-faq ({len(faq.get('items', []))} items)")
        footer = parse_footer(home_html)
        (OUT / "footer.json").write_text(
            json.dumps(footer, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(
            f"  footer (contact + {len(footer.get('linkColumns', []))} link columns, "
            f"{len(footer.get('legal', []))} legal)"
        )

    print(f"\nDone. {len(paths)} paths → {OUT}")


if __name__ == "__main__":
    main()
