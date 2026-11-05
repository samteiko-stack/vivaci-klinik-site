"""Normalize Railway / from-production treatment docs → template JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
FROM_PRODUCTION = ROOT / "content" / "from-production"
OUT_DIR = ROOT / "content" / "treatment-pages"
TREATMENT_PRICES_PATH = ROOT / "content" / "treatment-prices.json"

DEFAULT_HERO_CTAS = {
    "primaryCta": {"label": "Boka gratis konsultation", "href": "/kontakt"},
    "secondaryCta": {"label": "Boka behandling", "href": "/kontakt"},
}

DEFAULT_QUIZ_CTA = {
    "enabled": True,
    "heading": "Osäker på vilken behandling som passar dig?",
    "intro": (
        "Boka en kostnadsfri konsultation med en av våra erfarna behandlare. "
        "Vi lyssnar på dina mål, bedömer dina förutsättningar och tar fram en plan "
        "som är skräddarsydd för dig — helt utan köptvång."
    ),
    "primaryCta": {"enabled": False},
    "quizLink": {"label": "Gör vårt gratis quiz", "enabled": True},
}

DEFAULT_BOTTOM_CTA = {
    "enabled": True,
    "heading": "Boka din kostnadsfria konsultation",
    "intro": (
        "Vi hjälper dig att hitta rätt behandling för just dina behov. "
        "Välkommen till Vivaci Klinik i Solna."
    ),
    "primaryCta": {"label": "Kontakta oss", "href": "/kontakt"},
}

# FAQ left-column CTA: problem → method; behandling/plastik → boka konsultation.
DEFAULT_FAQ_CTA_PROBLEM = {
    "label": "Läs mer om vår metod",
    "href": "#vivaci-method",
}
DEFAULT_FAQ_CTA_TREATMENT = {
    "label": "Boka kostnadsfri konsultation",
    "href": "/kontakt",
}

# Railway h2 titles for site-wide blocks on treatment pages
RAILWAY_METHOD_H2 = "Avancerad diagnostik. Personliga behandlingar. Bättre resultat."
RAILWAY_EXPERTS_H2 = "Möt våra experter"
RAILWAY_TRUST_H2 = "Därför väljer patienter Vivaci"
RAILWAY_QUIZ_CTA_H2 = "Osäker på vilken behandling som passar dig?"
RAILWAY_BOTTOM_CTA_H2 = "Boka din kostnadsfria konsultation"
RAILWAY_BEFORE_AFTER_GALLERY_H2 = "Före & Efter"

EMPTY_FACT_VALUES = frozenset({"", "—", "-", "–", "...", "null", "None"})
BARE_PRICE_TOKENS = frozenset({"från", "fr", "fr.", "from", "from."})
PRICE_LABEL = "Pris"
LEGACY_PRICE_LABELS = frozenset({"Pris från", "Pris from"})
PRICE_NO_FR_PREFIX = frozenset(
    {
        "vid konsultation",
        "kontakta oss",
        "enligt offert",
        "pris på förfrågan",
    }
)

# Railway h2/h3 labels that are layout chrome, not body copy
STRUCTURAL_LABELS = frozenset(
    {
        "Snabb översikt",
        "Resultat över tid",
        "Din behandlingsresa",
        "Vanliga behandlingsområden",
        "Problem den behandlar",
        "Teamet",
        "Varför Vivaci",
        "Se resultat från våra behandlingar",
        "Teamet",
        "Omdömen",
    }
)

# h3 blocks under "Så fungerar det" that are journey steps, not area cards
JOURNEY_CHILD_TITLES = frozenset(
    {
        "Kostnadsfri konsultation",
        "Individuell plan",
        "Behandling",
        "Uppföljning",
    }
)

TIMELINE_LINE = re.compile(
    r"^(Dag\s*\d+(?:\s*[–-]\s*\d+)?|Månad\s*\d+(?:\s*[–-]\s*\d+)?)\s+(.+)$",
    re.IGNORECASE,
)


def _enabled(text: str | None) -> bool:
    return bool(text and str(text).strip())


def _enabled_list(items: list | None) -> bool:
    return bool(items and len(items) > 0)


def _price_fact_usable(value: str) -> bool:
    v = value.strip()
    if not v or v in EMPTY_FACT_VALUES:
        return False
    low = re.sub(r"[.\s]+$", "", v.lower())
    if low in BARE_PRICE_TOKENS:
        return False
    if low in PRICE_NO_FR_PREFIX:
        return True
    if "konsultation" in low:
        return True
    return bool(re.search(r"\d", v))


def format_price_value(value: str) -> str:
    """Display amounts as «fr. …»; consult copy stays plain."""
    v = value.strip()
    if not _price_fact_usable(v):
        return ""
    low = v.lower()
    if low in PRICE_NO_FR_PREFIX:
        return v
    if "konsultation" in low and not re.search(r"\d", v):
        return v
    if re.match(r"^fr\.?\s", v, re.I):
        return "fr. " + re.sub(r"^fr\.?\s*", "", v, flags=re.I)
    if re.search(r"\d", v):
        return f"fr. {v}"
    return v


def _normalize_fact_row(row: dict[str, Any]) -> tuple[str, dict[str, str]]:
    label = str(row.get("label") or "").strip()
    value = str(row.get("value") or "").strip()
    icon = row.get("icon")
    if label in LEGACY_PRICE_LABELS or label == PRICE_LABEL:
        label = PRICE_LABEL
        value = format_price_value(value)
        if not value:
            return label, {"label": label, "value": ""}
    out: dict[str, str] = {"label": label, "value": value}
    if icon:
        out["icon"] = icon
    return label, out


def _fact_usable(item: dict[str, Any] | None) -> bool:
    if not item or not item.get("label"):
        return False
    value = str(item.get("value") or "").strip()
    if not value or value in EMPTY_FACT_VALUES:
        return False
    label = str(item.get("label") or "").strip()
    if label in LEGACY_PRICE_LABELS or label == PRICE_LABEL:
        return _price_fact_usable(value)
    return True


def default_fact_templates(category: str) -> list[dict[str, str]]:
    if category == "problem":
        return [
            {"label": "Typ", "value": "Hudproblem", "icon": "layout-grid"},
            {"label": "Konsultation", "value": "Kostnadsfri", "icon": "calendar-check"},
            {"label": "Behandlingstid", "value": "Varierar", "icon": "timer"},
            {"label": PRICE_LABEL, "value": "Vid konsultation", "icon": "wallet"},
        ]
    if category == "plastikkirurgi":
        return [
            {"label": "Behandlingstid", "value": "20–90 min", "icon": "timer"},
            {"label": "Återhämtning", "value": "1–7 dagar", "icon": "heart-pulse"},
            {"label": "Smärtnivå", "value": "Lokal bedövning", "icon": "bandage"},
            {"label": PRICE_LABEL, "value": "Vid konsultation", "icon": "wallet"},
        ]
    return [
        {"label": "Behandlingstid", "value": "30–90 min", "icon": "timer"},
        {"label": "Återhämtning", "value": "Ofta samma dag", "icon": "heart-pulse"},
        {"label": "Smärtnivå", "value": "Låg till måttlig", "icon": "bandage"},
        {"label": PRICE_LABEL, "value": "Vid konsultation", "icon": "wallet"},
    ]


def infer_treatment_time(prod: dict[str, Any] | None) -> str | None:
    if not prod:
        return None
    blob = json.dumps(prod.get("sections") or {}, ensure_ascii=False)
    m = re.search(r"(\d{1,3})\s*[–-]\s*(\d{1,3})\s*min", blob, re.I)
    if m:
        return f"{m.group(1)}–{m.group(2)} min"
    return None


def load_treatment_prices_catalog() -> dict[str, Any]:
    if not TREATMENT_PRICES_PATH.is_file():
        return {}
    return json.loads(TREATMENT_PRICES_PATH.read_text(encoding="utf-8"))


def resolve_treatment_price(page_path: str, category: str) -> str:
    """Admin-editable placeholders in content/treatment-prices.json."""
    if category == "problem":
        return "Vid konsultation"
    path = page_path if page_path.startswith("/") else f"/{page_path.lstrip('/')}"
    catalog = load_treatment_prices_catalog()
    by_path = catalog.get("byPath") or {}
    if path in by_path:
        return str(by_path[path]).strip()
    slug = path.strip("/").split("/")[-1]
    by_slug = catalog.get("bySlug") or {}
    if slug in by_slug:
        return str(by_slug[slug]).strip()
    defaults = catalog.get("defaults") or {}
    return str(defaults.get(category, "2 490 kr")).strip()


def apply_catalog_price(
    by_label: dict[str, dict[str, str]], page_path: str, category: str
) -> None:
    if category == "problem" or not page_path:
        return
    current = (by_label.get(PRICE_LABEL) or {}).get("value") or ""
    if _price_fact_usable(str(current)):
        return
    raw = resolve_treatment_price(page_path, category)
    formatted = format_price_value(raw)
    if not formatted:
        return
    by_label[PRICE_LABEL] = {
        "label": PRICE_LABEL,
        "value": formatted,
        "icon": "wallet",
    }


def load_production_doc(category: str, slug: str) -> dict[str, Any] | None:
    candidates = [
        FROM_PRODUCTION / category / f"{slug}.json",
        FROM_PRODUCTION / "problems" / f"{slug}.json",
    ]
    for path in candidates:
        if path.is_file():
            return json.loads(path.read_text(encoding="utf-8"))
    return None


def ensure_facts_items(
    items: list[dict[str, Any]] | None,
    category: str,
    prod: dict[str, Any] | None = None,
    *,
    fill_defaults: bool = True,
    page_path: str = "",
) -> list[dict[str, str]]:
    """Sidebar facts from production; optional template defaults when CMS has none."""
    by_label: dict[str, dict[str, str]] = {}

    def ingest(row: dict[str, Any]) -> None:
        if not _fact_usable(row):
            return
        label, normalized = _normalize_fact_row(row)
        if not str(normalized.get("value") or "").strip():
            return
        by_label[label] = normalized

    for row in items or []:
        ingest(row)
    if prod:
        for row in prod.get("facts") or []:
            ingest(row)
        if fill_defaults:
            inferred = infer_treatment_time(prod)
            if inferred and category != "problem":
                by_label.setdefault(
                    "Behandlingstid",
                    {"label": "Behandlingstid", "value": inferred, "icon": "timer"},
                )
    if not page_path and prod:
        page_path = str(prod.get("path") or "")
    apply_catalog_price(by_label, page_path, category)

    if not fill_defaults:
        return list(by_label.values())

    out: list[dict[str, str]] = []
    for tpl in default_fact_templates(category):
        if tpl["label"] in by_label:
            row = by_label[tpl["label"]]
            row.setdefault("icon", tpl.get("icon", ""))
            out.append(row)
        else:
            out.append(dict(tpl))
    return out


def _join_paragraphs(parts: list[str]) -> str:
    return "\n\n".join(p.strip() for p in parts if p and str(p).strip())


def _section_body(sections: dict[str, Any], h2: str) -> str:
    sec = sections.get(h2) or {}
    paras = [
        p
        for p in (sec.get("paragraphs") or [])
        if p.strip() not in STRUCTURAL_LABELS
    ]
    return _join_paragraphs(paras)


def _first_section_body(
    sections: dict[str, Any], keys: list[str]
) -> tuple[str, str | None]:
    for key in keys:
        body = _section_body(sections, key)
        if _enabled(body):
            return body, key
    return "", None


# Overview block titles — same on problem + treatment pages (Webflow template).
OVERVIEW_BLOCK_LABELS: dict[str, str] = {
    "whatIsIt": "Vad är det?",
    "symptoms": "Tecken & symtom",
    "causes": "Orsaker",
    "assessment": "Hur vi bedömer det",
}

# Railway h2 keys that may fill each overview block (procedure pages).
OVERVIEW_SOURCE_H2: dict[str, tuple[str, ...]] = {
    "whatIsIt": ("Om behandlingen", "Vad är denna behandling?", "Om ingreppet"),
    "symptoms": ("Tecken & symtom", "Vilka problem kan den behandla?"),
    "causes": ("Orsaker",),
    "assessment": (
        "Hur vi bedömer det",
        "Konsultation",
        "Är denna behandling rätt för mig?",
    ),
}

HOW_IT_WORKS_H2 = (
    "Så fungerar det",
    "Hur fungerar det?",
    "Ingreppssteg",
    "Behandlingsprocess",
)

BEFORE_AFTER_H2 = ("Före & eftervård", "Före behandling", "Efter behandling")


def _heading_present(headings: set[str], *keys: str) -> bool:
    return any(k in headings for k in keys)


def _clean_overview_body(text: str | None) -> str:
    if not text:
        return ""
    parts: list[str] = []
    for para in str(text).split("\n\n"):
        t = para.strip()
        if not t or t in STRUCTURAL_LABELS:
            continue
        parts.append(para.strip())
    return _join_paragraphs(parts)


def _problems_treated_overview(sections: dict[str, Any]) -> str:
    sec = sections.get("Vilka problem kan den behandla?") or {}
    parts: list[str] = []
    for title, sub in (sec.get("children") or {}).items():
        if title.strip() in STRUCTURAL_LABELS:
            continue
        body = _join_paragraphs(sub.get("paragraphs") or [])
        if body:
            parts.append(body)
    return _join_paragraphs(parts)


def _treatment_areas_overview(sections: dict[str, Any]) -> str:
    areas = _extract_areas(sections)
    parts: list[str] = []
    for area in areas:
        title = (area.get("title") or "").strip()
        body = (area.get("body") or "").strip()
        if title and body:
            parts.append(f"{title}: {body}")
        elif body:
            parts.append(body)
    return _join_paragraphs(parts)


def _mechanism_overview(sections: dict[str, Any]) -> str:
    cause = _section_body(sections, "Orsaker")
    if _enabled(cause):
        return cause
    saf = sections.get("Så fungerar det") or {}
    from_saf = _join_paragraphs(
        _paragraphs_until_markers(saf.get("paragraphs") or [])
    )
    if _enabled(from_saf):
        return from_saf
    for key in ("Hur fungerar det?", "Ingreppssteg", "Behandlingsprocess"):
        body = _section_body(sections, key)
        if _enabled(body):
            return body
    return ""


def _list_to_overview_prose(items: list[str], *, intro: str = "") -> str:
    cleaned = [i.strip() for i in items if i and str(i).strip()]
    if not cleaned:
        return ""
    if len(cleaned) == 1 and not intro:
        return cleaned[0]
    body = "\n".join(f"• {line}" for line in cleaned)
    if intro:
        body = f"{intro}\n\n{body}"
    return body


def _assessment_overview(
    sections: dict[str, Any], needs_assessment: list[str]
) -> str:
    chunks: list[str] = []
    for key in (
        "Hur vi bedömer det",
        "Konsultation",
        "Är denna behandling rätt för mig?",
    ):
        body = _section_body(sections, key)
        if _enabled(body):
            chunks.append(body)
            break
    konsult = (
        (sections.get("Så fungerar det") or {})
        .get("children", {})
        .get("Kostnadsfri konsultation")
        or {}
    )
    konsult_body = _join_paragraphs(konsult.get("paragraphs") or [])
    if _enabled(konsult_body) and konsult_body not in chunks:
        chunks.append(konsult_body)
    if needs_assessment:
        chunks.append(_join_paragraphs(needs_assessment))
    return _join_paragraphs(chunks)


def build_procedure_overview_blocks(
    sections: dict[str, Any],
    *,
    good_for: list[str],
    needs_assessment: list[str],
    category: str = "behandlingar",
) -> list[dict[str, Any]]:
    """Railway section copy under the four fixed overview titles."""
    strict = category in ("behandlingar", "plastikkirurgi")

    what_body = _clean_overview_body(
        _first_section_body(
            sections,
            ["Om behandlingen", "Vad är denna behandling?", "Om ingreppet"],
        )[0]
    )

    sym_body = _clean_overview_body(_section_body(sections, "Tecken & symtom"))
    sym_heading_key = "symptoms"
    if not _enabled(sym_body):
        sym_body = _clean_overview_body(
            _list_to_overview_prose(
                good_for,
                intro="Behandlingen passar ofta dig som:",
            )
        )
        if _enabled(sym_body):
            sym_heading_key = "goodFor"
    if not _enabled(sym_body):
        sym_body = _clean_overview_body(_section_body(sections, "Hur känns det?"))
    if not _enabled(sym_body):
        sym_body = _clean_overview_body(_section_body(sections, "Fördelar"))
    if not strict:
        if not _enabled(sym_body):
            sym_body = _clean_overview_body(_problems_treated_overview(sections))
        if not _enabled(sym_body):
            sym_body = _clean_overview_body(_treatment_areas_overview(sections))
        if not _enabled(sym_body):
            sym_body = _clean_overview_body(_section_body(sections, "Lämpliga kandidater"))
    elif not _enabled(sym_body):
        treated = _clean_overview_body(_problems_treated_overview(sections))
        if treated and "här förklarar vi vad" not in treated.lower():
            sym_body = treated

    cause_body = _clean_overview_body(_section_body(sections, "Orsaker"))
    if not _enabled(cause_body):
        cause_body = _clean_overview_body(_mechanism_overview(sections))

    assess_body = ""
    for key in (
        "Hur vi bedömer det",
        "Konsultation",
        "Är denna behandling rätt för mig?",
    ):
        body = _section_body(sections, key)
        if _enabled(body):
            assess_body = _clean_overview_body(body)
            break
    if not _enabled(assess_body):
        assess_body = _clean_overview_body(
            _assessment_overview(sections, needs_assessment)
        )

    labels = OVERVIEW_BLOCK_LABELS
    what_heading = "Om behandlingen" if strict else labels["whatIsIt"]
    sym_heading = (
        "Passar bra för dig som"
        if sym_heading_key == "goodFor"
        else labels["symptoms"]
    )
    return [
        {
            "id": "whatIsIt",
            "heading": what_heading,
            "body": what_body,
            "enabled": _enabled(what_body),
        },
        {
            "id": "symptoms",
            "heading": sym_heading,
            "body": sym_body,
            "enabled": _enabled(sym_body),
        },
        {
            "id": "causes",
            "heading": labels["causes"],
            "body": cause_body,
            "enabled": _enabled(cause_body),
        },
        {
            "id": "assessment",
            "heading": labels["assessment"],
            "body": assess_body,
            "enabled": _enabled(assess_body),
        },
    ]


def _paragraphs_until_markers(
    paragraphs: list[str], markers: frozenset[str] = STRUCTURAL_LABELS
) -> list[str]:
    out: list[str] = []
    for p in paragraphs:
        t = p.strip()
        if t in markers:
            break
        out.append(p)
    return out


def _cards_from_section(sec: dict | None) -> list[dict[str, str]]:
    if not sec:
        return []
    items: list[dict[str, str]] = []
    for sub_title, sub in (sec.get("children") or {}).items():
        sub_body = _join_paragraphs(sub.get("paragraphs") or [])
        if sub_title.strip() in STRUCTURAL_LABELS:
            continue
        if sub_title or sub_body:
            items.append({"title": sub_title, "body": sub_body})
    return items


def _parse_timeline_from_items(items: list[str]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for raw in items:
        s = raw.strip()
        if not s:
            continue
        m = TIMELINE_LINE.match(s)
        if m:
            result.append({"title": m.group(1).strip(), "body": m.group(2).strip()})
            continue
        if "—" in s:
            title, _, body = s.partition("—")
            result.append({"title": title.strip(), "body": body.strip()})
        else:
            result.append({"title": s[:48], "body": s})
    return result


def _parse_timeline_from_paragraphs(paragraphs: list[str]) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    i = 0
    while i < len(paragraphs):
        p = paragraphs[i].strip()
        if not p or p in STRUCTURAL_LABELS:
            i += 1
            continue
        if re.match(r"^(Dag|Månad)\s", p, re.I):
            body = ""
            if i + 1 < len(paragraphs):
                nxt = paragraphs[i + 1].strip()
                if nxt and not re.match(r"^(Dag|Månad)\s", nxt, re.I):
                    body = nxt
                    i += 1
            items.append({"title": p, "body": body})
        i += 1
    return items


def _extract_timeline(sections: dict[str, dict]) -> list[dict[str, str]]:
    saf = sections.get("Så fungerar det") or {}
    from_items = _parse_timeline_from_items(saf.get("items") or [])
    if from_items:
        return from_items

    rt = sections.get("Resultat över tid") or {}
    from_rt = _cards_from_section(rt)
    if from_rt:
        return [{"title": c["title"], "body": c["body"]} for c in from_rt]

    paras = saf.get("paragraphs") or []
    try:
        idx = next(i for i, p in enumerate(paras) if p.strip() == "Resultat över tid")
        return _parse_timeline_from_paragraphs(paras[idx + 1 :])
    except StopIteration:
        return []


def _extract_how_body(sections: dict[str, dict]) -> str:
    for key in (
        "Så fungerar det",
        "Hur fungerar det?",
        "Ingreppssteg",
        "Behandlingsprocess",
    ):
        if key == "Så fungerar det":
            saf = sections.get(key) or {}
            body = _join_paragraphs(
                _paragraphs_until_markers(saf.get("paragraphs") or [])
            )
        else:
            body = _section_body(sections, key)
        if _enabled(body):
            return body
    return ""


def _extract_areas(sections: dict[str, dict]) -> list[dict[str, str]]:
    areas = _cards_from_section(sections.get("Vanliga behandlingsområden"))
    if areas:
        return areas
    saf = sections.get("Så fungerar det") or {}
    out: list[dict[str, str]] = []
    for title, sub in (saf.get("children") or {}).items():
        if title in JOURNEY_CHILD_TITLES or title.strip() in STRUCTURAL_LABELS:
            continue
        body = _join_paragraphs(sub.get("paragraphs") or [])
        if title and body:
            out.append({"title": title, "body": body})
    return out


def _extract_journey_steps(sections: dict[str, dict]) -> list[dict[str, str]]:
    saf = sections.get("Så fungerar det") or {}
    out: list[dict[str, str]] = []
    for title in JOURNEY_CHILD_TITLES:
        sub = (saf.get("children") or {}).get(title)
        if not sub:
            continue
        paras = [
            p
            for p in (sub.get("paragraphs") or [])
            if p.strip() not in STRUCTURAL_LABELS
        ]
        body = _join_paragraphs(paras)
        if body:
            out.append({"title": title, "body": body})
    return out


def _care_side(sec: dict[str, Any]) -> tuple[str, list[str]]:
    """Intro line + bullet list from Railway Före/Efter section (items or paragraphs)."""
    items = [i.strip() for i in (sec.get("items") or []) if i.strip()]
    paras = [p.strip() for p in (sec.get("paragraphs") or []) if p.strip()]
    if items:
        intro = paras[0] if len(paras) == 1 else (_join_paragraphs(paras).split("\n\n")[0] if paras else "")
        return intro, items
    if not paras:
        return "", []
    if len(paras) == 1:
        return paras[0], []
    return paras[0], paras[1:]


def _extract_before_after(sections: dict[str, dict]) -> dict[str, Any]:
    before_sec = sections.get("Före behandling") or {}
    after_sec = sections.get("Efter behandling") or {}
    care = sections.get("Före & eftervård") or {}

    intro_b, before_items = _care_side(before_sec)
    intro_a, after_items = _care_side(after_sec)

    if (
        not before_items
        and not after_items
        and not intro_b
        and not intro_a
    ):
        paras = [p.strip() for p in (care.get("paragraphs") or []) if p.strip()]
        intro = paras[0] if paras else ""
        rest = paras[1:] if len(paras) > 1 else []
        return {
            "introBefore": intro,
            "before": rest,
            "introAfter": "",
            "after": [],
        }

    if not intro_a:
        intro_a = intro_b

    return {
        "introBefore": intro_b,
        "before": before_items,
        "introAfter": intro_a,
        "after": after_items,
    }


def _production_headings(doc: dict[str, Any]) -> set[str]:
    return {h.strip() for h in (doc.get("rawSectionHeadings") or []) if h and h.strip()}


MIN_BENEFIT_ITEMS = 3

GENERIC_TREATMENT_BENEFIT_TEMPLATES: list[tuple[str, str]] = [
    (
        "Medicinsk expertis",
        "Behandlingen utförs av legitimerad personal med erfarenhet inom estetisk medicin.",
    ),
    (
        "Skräddarsydd plan",
        "Vi anpassar upplägget efter dina mål och förutsättningar — med tydliga förväntningar från start.",
    ),
    (
        "Trygg klinikmiljö",
        "Du möter oss i en lugn, exklusiv miljö i Solna där vi går igenom varje steg innan behandling.",
    ),
    (
        "Uppföljning",
        "Vi följer upp resultatet och finns till när du har frågor efter behandlingen.",
    ),
]

SUPPLEMENTAL_BENEFIT_SOURCES: tuple[tuple[str, str], ...] = (
    ("Hur känns det?", "Behaglig upplevelse"),
    ("Rekommenderade sessioner", "Rekommenderat upplägg"),
    ("Behandlingsprocess", "Strukturerad process"),
    ("Är denna behandling rätt för mig?", "Individuell bedömning"),
    ("Hur fungerar det?", "Så fungerar behandlingen"),
)


def _derive_benefit_title(body: str) -> str:
    text = body.strip()
    if not text:
        return "Fördel"
    first = text.split(".")[0].strip()
    if not first:
        first = text
    for sep in (" och ", ", "):
        if sep in first and len(first.split(sep)[0].strip()) >= 8:
            return first.split(sep)[0].strip()
    if len(first) <= 52:
        return first
    trimmed = first[:49].rsplit(" ", 1)[0]
    return trimmed + "…" if trimmed else first[:52]


def _normalize_benefit_item(item: dict[str, str]) -> dict[str, str] | None:
    body = (item.get("body") or "").strip()
    if not body:
        return None
    title = (item.get("title") or "").strip()
    if not title:
        title = _derive_benefit_title(body)
    return {"title": title, "body": body}


def _supplemental_benefit_cards(sections: dict[str, Any]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for h2, heading in SUPPLEMENTAL_BENEFIT_SOURCES:
        body = _section_body(sections, h2)
        if not _enabled(body):
            continue
        normalized = _normalize_benefit_item({"title": heading, "body": body})
        if normalized:
            out.append(normalized)
    return out


def ensure_benefit_items(
    items: list[dict[str, str]],
    sections: dict[str, Any],
    *,
    treatment_title: str = "",
) -> list[dict[str, str]]:
    """Every treatment page: titled benefit cards, at least MIN_BENEFIT_ITEMS."""
    out: list[dict[str, str]] = []
    seen: set[str] = set()

    def add(item: dict[str, str] | None) -> None:
        if not item:
            return
        key = (item.get("body") or "").strip().lower()
        if not key or key in seen:
            return
        seen.add(key)
        out.append(item)

    for raw in items:
        add(_normalize_benefit_item(raw))

    if len(out) < MIN_BENEFIT_ITEMS:
        for extra in _supplemental_benefit_cards(sections):
            add(extra)
            if len(out) >= MIN_BENEFIT_ITEMS:
                break

    if len(out) < MIN_BENEFIT_ITEMS:
        for title, body in GENERIC_TREATMENT_BENEFIT_TEMPLATES:
            if treatment_title and title == "Skräddarsydd plan":
                body = (
                    f"Vi anpassar {treatment_title} efter dina mål och förutsättningar — "
                    "med tydliga förväntningar från start."
                )
            add({"title": title, "body": body})
            if len(out) >= MIN_BENEFIT_ITEMS:
                break

    return out


MIN_FAQ_ITEMS = 5


def _dedupe_faqs(items: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    out: list[dict[str, str]] = []
    for row in items:
        q = (row.get("question") or "").strip()
        a = (row.get("answer") or "").strip()
        if not q or not a:
            continue
        key = q.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append({"question": q, "answer": a})
    return out


def _generic_faq_templates(title: str, category: str) -> list[dict[str, str]]:
    name = title.strip() if title else "behandlingen"
    if category == "problem":
        return [
            {
                "question": f"Vad är {name}?",
                "answer": (
                    f"{name} är ett tillstånd som många söker hjälp för. "
                    "Vid en kostnadsfri konsultation på Vivaci Klinik går vi igenom dina symtom, "
                    "hud/historik och vilka behandlingsvägar som är realistiska."
                ),
            },
            {
                "question": f"Hur bedömer ni {name.lower()}?",
                "answer": (
                    "Vi gör en medicinsk och estetisk bedömning utifrån ditt utgångsläge och dina mål. "
                    "Du får tydlig information om vad som kan förbättras och vilket upplägg som passar."
                ),
            },
            {
                "question": "Vilka behandlingar kan hjälpa?",
                "answer": (
                    "Det beror på orsak och allvarlighetsgrad. Vi rekommenderar ofta en kombination av "
                    "kliniska behandlingar och hemmavård — alltid anpassat efter dig."
                ),
            },
            {
                "question": "När ser jag resultat?",
                "answer": (
                    "Tidslinjen varierar mellan behandlingar och personer. "
                    "Vi sätter realistiska förväntningar redan vid första besöket."
                ),
            },
            {
                "question": "Hur bokar jag konsultation?",
                "answer": (
                    "Kontakta Vivaci Klinik i Solna eller boka via webbplatsen. "
                    "Första steget är alltid en kostnadsfri konsultation utan köptvång."
                ),
            },
            {
                "question": "Vad kostar det att behandla?",
                "answer": (
                    "Kostnaden beror på vald behandlingsplan. "
                    "Efter bedömningen får du ett tydligt prisförslag innan du bestämmer dig."
                ),
            },
            {
                "question": "Kan jag kombinera behandlingar?",
                "answer": (
                    "Ofta ja — vi planerar stegvis så att huden hinner stabilisera sig mellan insatser. "
                    "Det går igenom vid konsultationen."
                ),
            },
        ]
    return [
        {
            "question": f"Hur bokar jag {name}?",
            "answer": (
                f"Kontakta Vivaci Klinik i Solna eller boka via webbplatsen. "
                f"Vi börjar med en kostnadsfri konsultation där vi går igenom om {name} "
                "passar dina mål och förutsättningar."
            ),
        },
        {
            "question": f"Hur lång tid tar {name}?",
            "answer": (
                "Behandlingstiden varierar beroende på område och omfattning. "
                "Vid konsultationen får du en tydlig tidsuppskattning för just ditt upplägg."
            ),
        },
        {
            "question": "När ser jag resultat?",
            "answer": (
                "Tidslinjen beror på behandlingstyp och individuella förutsättningar. "
                "Vi sätter realistiska förväntningar redan vid första besöket."
            ),
        },
        {
            "question": "Finns det återhämtningstid?",
            "answer": (
                "Det varierar mellan behandlingar. Vi informerar om eventuell rodnad, "
                "svullnad eller vila och ger konkret eftervård så att du vet vad som gäller efteråt."
            ),
        },
        {
            "question": f"Vad kostar {name}?",
            "answer": (
                "Priset beror på omfattning och individuell plan. "
                "Efter konsultationen får du ett tydligt prisförslag innan du bokar behandling."
            ),
        },
        {
            "question": f"Är {name} säker?",
            "answer": (
                "Behandlingen utförs av legitimerad personal enligt etablerade rutiner. "
                "Vi går igenom medicinsk historik och eventuella risker innan vi startar."
            ),
        },
        {
            "question": "Hur många behandlingar behövs?",
            "answer": (
                "Antal sessioner beror på mål och utgångsläge. "
                "Du får en rekommenderad plan vid konsultationen — ofta med möjlighet att justera längs vägen."
            ),
        },
    ]


def ensure_faq_items(
    items: list[dict[str, str]],
    *,
    treatment_title: str,
    category: str,
) -> list[dict[str, str]]:
    out = _dedupe_faqs(items)
    if len(out) >= MIN_FAQ_ITEMS:
        return out
    seen = {(row.get("question") or "").strip().lower() for row in out}
    for template in _generic_faq_templates(treatment_title, category):
        if len(out) >= MIN_FAQ_ITEMS:
            break
        q = (template.get("question") or "").strip()
        if not q or q.lower() in seen:
            continue
        seen.add(q.lower())
        out.append(
            {
                "question": q,
                "answer": (template.get("answer") or "").strip(),
            }
        )
    return out


def benefits_from_production(sections: dict[str, Any]) -> list[dict[str, str]]:
    cards = _cards_from_section(sections.get("Fördelar"))
    if cards:
        normalized: list[dict[str, str]] = []
        for card in cards:
            item = _normalize_benefit_item(card)
            if item:
                normalized.append(item)
        return normalized
    body = _section_body(sections, "Fördelar")
    if not _enabled(body):
        return []
    return [
        item
        for p in body.split("\n\n")
        if p.strip()
        for item in [_normalize_benefit_item({"title": "", "body": p.strip()})]
        if item
    ]


def _load_global_before_after_items() -> list[dict[str, Any]]:
    path = FROM_PRODUCTION / "before-after-gallery.json"
    if not path.is_file():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return list(data.get("items") or [])


def _placeholder_before_after_items(count: int = 6) -> list[dict[str, str]]:
    """Photoshoot frames for layout preview until real case imagery is wired."""
    frames = [f"/images/photoshoot/frame-{i:02d}.jpg" for i in range(1, 7)]
    out: list[dict[str, str]] = []
    for i in range(count):
        before = frames[i % len(frames)]
        after = frames[(i + 1) % len(frames)]
        out.append(
            {
                "title": f"Exempel {i + 1}",
                "beforeImage": before,
                "afterImage": after,
            }
        )
    return out


def _pad_before_after_items(items: list[dict[str, str]], minimum: int = 6) -> list[dict[str, str]]:
    if len(items) >= minimum:
        return items
    padded = list(items)
    placeholders = _placeholder_before_after_items(minimum)
    idx = 0
    while len(padded) < minimum:
        padded.append(dict(placeholders[idx % len(placeholders)]))
        idx += 1
    return padded


def _before_after_items_for_doc(doc: dict[str, Any]) -> list[dict[str, str]]:
    path = doc.get("path") or ""
    parts = path.strip("/").split("/")
    category = parts[0] if parts else doc.get("category") or ""
    slug = parts[-1] if parts else doc.get("slug") or ""
    out: list[dict[str, str]] = []
    for row in _load_global_before_after_items():
        title = (row.get("title") or "").strip()
        before = (row.get("beforeImage") or "").strip()
        after = (row.get("afterImage") or "").strip()
        if not title or not before or not after:
            continue
        treatment_slug = (row.get("treatmentSlug") or "").strip()
        problem_slug = (row.get("problemSlug") or "").strip()
        match = False
        if category == "behandlingar" and slug == treatment_slug:
            match = True
        elif category == "plastikkirurgi" and slug == treatment_slug:
            match = True
        elif category == "problem" and slug == problem_slug:
            match = True
        if not match:
            continue
        out.append(
            {
                "title": title,
                "beforeImage": before,
                "afterImage": after,
            }
        )
    return out


def _before_after_gallery_block(
    doc: dict[str, Any], sections: dict[str, Any]
) -> dict[str, Any]:
    headings = _production_headings(doc)
    items = _before_after_items_for_doc(doc)
    has_h2 = RAILWAY_BEFORE_AFTER_GALLERY_H2 in headings
    if not items and has_h2:
        items = _placeholder_before_after_items(6)
    elif items and has_h2:
        items = _pad_before_after_items(items, 6)
    intro = _section_body(sections, "Före & Efter")
    intro_line = intro.split("\n\n")[0].strip() if intro else ""
    if not intro_line or intro_line == (doc.get("title") or "").strip():
        intro_line = "Se resultat från våra behandlingar."
    return {
        "enabled": _enabled_list(items),
        "heading": "Före & Efter",
        "intro": intro_line,
        "disclaimer": "Varje resultat är unikt och baserat på individuella förutsättningar.",
        "items": items,
    }


# Present on every treatment / problem / plastikkirurgi page on Railway (layout shell).
# Copy inside FAQ may be empty on some URLs; the section still exists in the template.
ALWAYS_ON_SHELL_KEYS = (
    "method",
    "faq",
    "quizCta",
    "bottomCta",
    "experts",
    "trust",
)


def shared_shell_sections(doc: dict[str, Any]) -> dict[str, Any]:
    """Shared template tail — always on (matches Railway page shell)."""
    quiz = dict(DEFAULT_QUIZ_CTA)
    quiz["enabled"] = True
    bottom = dict(DEFAULT_BOTTOM_CTA)
    bottom["enabled"] = True
    return {
        "method": {"enabled": True},
        "experts": {"enabled": True},
        "trust": {"enabled": True},
        "quizCta": quiz,
        "bottomCta": bottom,
    }


def _related_from_production(doc: dict) -> list[dict[str, str]]:
    by_href: dict[str, dict[str, str]] = {}
    for item in doc.get("related") or []:
        href = item.get("href") or ""
        if href:
            by_href[href] = {
                "title": (item.get("title") or "").strip(),
                "href": href,
            }

    rel = (doc.get("sections") or {}).get("Relaterat") or {}
    out: list[dict[str, str]] = []
    for title, sub in (rel.get("children") or {}).items():
        if title.strip() in STRUCTURAL_LABELS:
            continue
        href = ""
        title_l = title.lower()
        for item in doc.get("related") or []:
            t = (item.get("title") or "").lower()
            if t == title_l or t.startswith(title_l + " "):
                href = item.get("href") or ""
                break
        if not href:
            for candidate in by_href.values():
                if title_l in candidate["title"].lower():
                    href = candidate["href"]
                    break
        if not href:
            slug_guess = title.lower().replace(" ", "-").replace("&", "").replace("å", "a")
            slug_guess = re.sub(r"[^a-z0-9-]", "", slug_guess)
            href = f"/problem/{slug_guess}"
        out.append({"title": title, "href": href})

    if out:
        return out[:12]
    return list(by_href.values())[:12]


def problem_to_template(doc: dict) -> dict:
    category = "problem"
    slug = doc["slug"]
    title = doc.get("name") or slug
    labels = OVERVIEW_BLOCK_LABELS
    blocks = [
        {
            "id": "whatIsIt",
            "heading": labels["whatIsIt"],
            "body": _clean_overview_body(doc.get("whatIsIt")),
            "enabled": _enabled(_clean_overview_body(doc.get("whatIsIt"))),
        },
        {
            "id": "symptoms",
            "heading": labels["symptoms"],
            "body": _clean_overview_body(doc.get("symptoms")),
            "enabled": _enabled(_clean_overview_body(doc.get("symptoms"))),
        },
        {
            "id": "causes",
            "heading": labels["causes"],
            "body": _clean_overview_body(doc.get("causes")),
            "enabled": _enabled(_clean_overview_body(doc.get("causes"))),
        },
        {
            "id": "assessment",
            "heading": labels["assessment"],
            "body": _clean_overview_body(doc.get("assessment")),
            "enabled": _enabled(_clean_overview_body(doc.get("assessment"))),
        },
    ]
    related = doc.get("recommendedTreatments") or []
    return {
        "version": 1,
        "category": category,
        "slug": slug,
        "path": f"/problem/{slug}",
        "sourceUrl": doc.get("sourceUrl"),
        "title": title,
        "sections": {
            "hero": {
                "enabled": True,
                "title": title,
                "intro": doc.get("heroIntro") or "",
                **DEFAULT_HERO_CTAS,
            },
            "facts": {
                "enabled": True,
                "title": "Snabba fakta",
                "summary": "Det första steget är att boka en kostnadsfri konsultation hos oss.",
                "items": ensure_facts_items(None, category, doc),
            },
            "overview": {
                "enabled": any(b["enabled"] for b in blocks),
                "tagline": "Hudproblem",
                "heading": f"Fakta om {title}",
                "blocks": blocks,
            },
            "suitability": {"enabled": False, "goodFor": [], "needsAssessment": []},
            "howItWorks": {"enabled": False, "heading": "", "body": "", "steps": []},
            "resultsTimeline": {"enabled": False, "items": []},
            "benefits": {"enabled": False, "items": []},
            "treatmentAreas": {"enabled": False, "items": []},
            "faq": {
                "enabled": True,
                "intro": (
                    f"Här hittar du svar på vanliga frågor om {title}. "
                    "Boka gärna en kostnadsfri konsultation om du vill gå igenom dina förutsättningar."
                ),
                "methodCta": dict(DEFAULT_FAQ_CTA_PROBLEM),
                "items": ensure_faq_items(
                    doc.get("faqs") or [],
                    treatment_title=title,
                    category=category,
                ),
            },
            "related": {
                "enabled": _enabled_list(related),
                "heading": "Relaterade behandlingar",
                "items": [
                    {
                        "title": r.get("name") or r.get("slug"),
                        "href": r.get("url") or f"/behandlingar/{r.get('slug')}",
                    }
                    for r in related
                ],
            },
            **shared_shell_sections(doc),
            "beforeAfterGallery": _before_after_gallery_block(doc, {}),
            "beforeAfterCare": {"enabled": False},
        },
    }


def procedure_to_template(doc: dict) -> dict:
    path = doc.get("path") or ""
    parts = path.strip("/").split("/")
    category = parts[0] if parts else "behandlingar"
    slug = parts[-1] if parts else doc.get("slug", "unknown")
    title = doc.get("title") or slug
    sections = doc.get("sections") or {}

    def body(h2: str) -> str:
        sec = sections.get(h2) or {}
        paras = [p for p in (sec.get("paragraphs") or []) if p.strip() not in STRUCTURAL_LABELS]
        return _join_paragraphs(paras)

    def list_items(h2: str) -> list[str]:
        sec = sections.get(h2, {})
        items = list(sec.get("items") or [])
        for sub in (sec.get("children") or {}).values():
            items.extend(sub.get("items") or [])
        return [i for i in items if i.strip()]

    def child_items(h2: str, h3: str) -> list[str]:
        ch = (sections.get(h2, {}).get("children") or {}).get(h3) or {}
        return [i for i in (ch.get("items") or []) if i.strip()]

    good_for = list_items("Passar bra för dig som") + child_items(
        "Om behandlingen", "Passar bra för dig som"
    )
    needs_assessment = list_items("Kräver individuell bedömning") + child_items(
        "Om behandlingen", "Kräver individuell bedömning"
    )
    blocks = build_procedure_overview_blocks(
        sections,
        good_for=good_for,
        needs_assessment=needs_assessment,
        category=category,
    )

    benefits = ensure_benefit_items(
        benefits_from_production(sections),
        sections,
        treatment_title=title,
    )
    shell = shared_shell_sections(doc)
    how_body = _extract_how_body(sections)
    journey_steps = _extract_journey_steps(sections)
    timeline = _extract_timeline(sections)
    areas = _extract_areas(sections)
    care = _extract_before_after(sections)
    related_items = _related_from_production(doc)
    faqs = ensure_faq_items(
        doc.get("faqs") or [],
        treatment_title=title,
        category=category,
    )

    return {
        "version": 1,
        "category": category,
        "slug": slug,
        "path": path if path.startswith("/") else f"/{path}",
        "sourceUrl": doc.get("sourceUrl"),
        "title": title,
        "sections": {
            "hero": {
                "enabled": True,
                "title": title,
                "intro": doc.get("heroIntro") or "",
                **DEFAULT_HERO_CTAS,
            },
            "facts": {
                "enabled": True,
                "title": "Snabba fakta",
                "summary": doc.get("factsSummary")
                or "Det första steget är att boka en kostnadsfri konsultation hos oss.",
                "items": ensure_facts_items(doc.get("facts") or [], category, doc),
            },
            "overview": {
                "enabled": any(b["enabled"] for b in blocks),
                "tagline": "Om behandlingen",
                "heading": title,
                "blocks": blocks,
            },
            "suitability": {
                # Railway: only premium behandlingar (h3 under Om behandlingen), not plastik/generic.
                "enabled": _enabled_list(good_for)
                and _enabled_list(needs_assessment),
                "goodFor": good_for,
                "needsAssessment": needs_assessment,
            },
            "benefits": {"enabled": _enabled_list(benefits), "items": benefits},
            "howItWorks": {
                "enabled": _enabled(how_body) or _enabled_list(journey_steps),
                "heading": "Så fungerar det",
                "body": how_body,
                "steps": journey_steps,
            },
            "resultsTimeline": {
                "enabled": _enabled_list(timeline),
                "heading": "Resultat över tid",
                "items": timeline,
            },
            "treatmentAreas": {"enabled": _enabled_list(areas), "items": areas},
            "faq": {
                "enabled": True,
                "intro": (
                    f"Här hittar du svar på vanliga frågor om {title}. "
                    "Boka gärna en kostnadsfri konsultation om du vill gå igenom dina förutsättningar."
                ),
                "methodCta": dict(DEFAULT_FAQ_CTA_TREATMENT),
                "items": faqs,
            },
            "related": {
                "enabled": _enabled_list(related_items),
                "heading": "Relaterat",
                "items": related_items,
            },
            "beforeAfterCare": {
                "enabled": _enabled_list(care.get("before"))
                or _enabled_list(care.get("after")),
                **care,
            },
            **_shell_without_gallery(shell),
            "beforeAfterGallery": _before_after_gallery_block(doc, sections),
        },
    }


def _shell_without_gallery(shell: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in shell.items() if k != "beforeAfterGallery"}


def sync_section_enabled(sections: dict[str, Any]) -> None:
    """Set sections.*.enabled from content — template conditional visibility."""
    overview = sections.get("overview") or {}
    blocks = overview.get("blocks") or []
    for block in blocks:
        body = (block.get("body") or "").strip()
        block["enabled"] = bool(block.get("enabled")) and bool(body)
    overview["blocks"] = blocks
    overview["enabled"] = any(b.get("enabled") for b in blocks)
    sections["overview"] = overview

    suit = sections.get("suitability") or {}
    suit["enabled"] = _enabled_list(suit.get("goodFor")) and _enabled_list(
        suit.get("needsAssessment")
    )
    sections["suitability"] = suit

    benefits = sections.get("benefits") or {}
    benefits["enabled"] = _enabled_list(benefits.get("items"))
    sections["benefits"] = benefits

    how = sections.get("howItWorks") or {}
    how["enabled"] = _enabled(how.get("body")) or _enabled_list(how.get("steps"))
    sections["howItWorks"] = how

    timeline = sections.get("resultsTimeline") or {}
    timeline["enabled"] = _enabled_list(timeline.get("items"))
    sections["resultsTimeline"] = timeline

    areas = sections.get("treatmentAreas") or {}
    areas["enabled"] = _enabled_list(areas.get("items"))
    sections["treatmentAreas"] = areas

    care = sections.get("beforeAfterCare") or {}
    care["enabled"] = (
        _enabled_list(care.get("before"))
        or _enabled_list(care.get("after"))
        or _enabled(care.get("introBefore"))
        or _enabled(care.get("introAfter"))
    )
    sections["beforeAfterCare"] = care

    faq = sections.get("faq") or {}
    if faq.get("enabled") is not False:
        faq["enabled"] = True
    sections["faq"] = faq

    related = sections.get("related") or {}
    related["enabled"] = _enabled_list(related.get("items"))
    sections["related"] = related

    facts = sections.get("facts") or {}
    facts["enabled"] = _enabled_list(facts.get("items"))
    sections["facts"] = facts

    hero = sections.get("hero") or {}
    hero["enabled"] = bool(
        (hero.get("title") or "").strip() or (hero.get("intro") or "").strip()
    )
    sections["hero"] = hero

    method = sections.get("method") or {}
    method["enabled"] = True
    sections["method"] = method

    for key in ("experts", "trust"):
        block = sections.get(key) or {}
        block["enabled"] = True
        sections[key] = block

    gallery = sections.get("beforeAfterGallery") or {}
    gallery["enabled"] = _enabled_list(gallery.get("items"))
    sections["beforeAfterGallery"] = gallery

    quiz = sections.get("quizCta") or {}
    if quiz.get("enabled") is not False:
        quiz.setdefault("heading", DEFAULT_QUIZ_CTA["heading"])
        quiz.setdefault("intro", DEFAULT_QUIZ_CTA["intro"])
        quiz.setdefault("primaryCta", dict(DEFAULT_QUIZ_CTA["primaryCta"]))
        quiz.setdefault("quizLink", dict(DEFAULT_QUIZ_CTA["quizLink"]))
        quiz["enabled"] = True
    sections["quizCta"] = quiz

    bottom = sections.get("bottomCta") or {}
    if bottom.get("enabled") is not False:
        bottom.setdefault("heading", DEFAULT_BOTTOM_CTA["heading"])
        bottom.setdefault("intro", DEFAULT_BOTTOM_CTA["intro"])
        bottom.setdefault("primaryCta", dict(DEFAULT_BOTTOM_CTA["primaryCta"]))
        bottom["enabled"] = True
    sections["bottomCta"] = bottom


def write_template(doc: dict) -> Path:
    sync_section_enabled(doc.get("sections") or {})
    category = doc["category"]
    slug = doc["slug"]
    out = OUT_DIR / category / f"{slug}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return out
