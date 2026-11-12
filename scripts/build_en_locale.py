#!/usr/bin/env python3
"""Generate English locale content under content/locales/en/."""

from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
OUT = CONTENT / "locales" / "en"
SITE_URLS = CONTENT / "site-urls.json"
CONTENT_ADMIN_URL = json.loads(SITE_URLS.read_text(encoding="utf-8")).get(
    "contentAdminUrl", "/content-admin"
)

LABELS = {
    "Acne": "Acne",
    "Acnärr": "Acne scars",
    "All plastikkirurgi": "All plastic surgery",
    "Alopecia": "Alopecia",
    "Ansiktskonturering": "Facial contouring",
    "Behandlingar": "Treatments",
    "Brutna kapillärer": "Broken capillaries",
    "Bukfettborttagning": "Buccal fat removal",
    "Cellulite": "Cellulite",
    "Dubbelhaka": "Double chin",
    "EN": "EN",
    "Envis fett": "Stubborn fat",
    "Fettsugning": "Liposuction",
    "Fina linjer & rynkor": "Fine lines & wrinkles",
    "Förstorade porer": "Enlarged pores",
    "Gropbildning (kindergropar)": "Dimple creation",
    "Gummy smile": "Gummy smile",
    "Hud": "Skin",
    "Hudförändringar": "Skin lesions",
    "Hudkvalitet & hydrering": "Skin quality & hydration",
    "Hår": "Hair",
    "Håravfall": "Hair loss",
    "Hårtransplantation": "Hair transplant",
    "Injektion": "Injectables",
    "Kontakta oss": "Contact us",
    "Kropp": "Body",
    "Kroppsskulptering": "Body sculpting",
    "Känslig hud": "Sensitive skin",
    "Läppförstoring": "Lip enhancement",
    "Melasma": "Melasma",
    "Mörka ringar": "Dark circles",
    "Ojämn hudton": "Uneven skin tone",
    "Om oss": "About us",
    "Otoplastik (öronkorrigering)": "Otoplasty (ear correction)",
    "Oönskat hår": "Unwanted hair",
    "Pigmentering": "Pigmentation",
    "Plastikkirurgi": "Plastic surgery",
    "Påsar under ögonen": "Under-eye bags",
    "Rosacea": "Rosacea",
    "Rynkor": "Wrinkles",
    "Slapp hud": "Loose skin",
    "Stretchmärken": "Stretch marks",
    "Svullnad & lymfdränage": "Swelling & lymphatic drainage",
    "Torr hud": "Dry skin",
    "Tråkig hud": "Dull skin",
    "Tunnare hår": "Thinning hair",
    "Volymförlust": "Volume loss",
    "Ärr": "Scars",
    "Ögonbrynslyft": "Brow lift",
    "Ögonlocksplastik": "Eyelid surgery",
    "Överdriven svettning": "Excessive sweating",
    "Övervikt & viktnedgång": "Overweight & weight loss",
}

DESCRIPTIONS = {
    "Balansera leendet så tandköttet syns mindre.": "Balance your smile so less gum shows.",
    "Balansera pigmentfläckar för en mer enhetlig hudton.": "Balance pigmentation for a more even skin tone.",
    "Definiera haka och käklinje utan kirurgi.": "Define chin and jawline without surgery.",
    "Definiera kindben, haka och ansiktslinjer med fyllmedel.": "Define cheekbones, chin and facial contours with fillers.",
    "Dämpa rodnad och lindra inflammerad, känslig hud.": "Reduce redness and soothe inflamed, sensitive skin.",
    "Dämpa ärr och förbättra hudens struktur och färg.": "Soften scars and improve skin texture and tone.",
    "Finare porer och en jämnare, mer polerad hudton.": "Refined pores and a smoother, more polished complexion.",
    "Forma kroppen genom selektiv borttagning av fettvävnad.": "Shape the body by selectively removing fat tissue.",
    "Forma läpparna med volym och naturlig symmetri.": "Shape lips with volume and natural symmetry.",
    "Forma silhuett och kontur efter dina mål.": "Sculpt silhouette and contour to match your goals.",
    "Förbättra spänst, fukt och hudens totala kvalitet.": "Improve firmness, hydration and overall skin quality.",
    "Individuell plan vid håravfall och fläckvis tunning.": "Personalised plan for hair loss and patchy thinning.",
    "Jämna ut färg och få huden att se mer harmonisk ut.": "Even out tone for a more harmonious complexion.",
    "Jämna ut gropig hud och förbättra kontur på lår och rumpa.": "Smooth dimpled skin and improve contour on thighs and buttocks.",
    "Jämnare hudtextur och mindre synliga märken efter acne.": "Smoother texture and less visible marks after acne.",
    "Korrigera utstickande öron för bättre balans i profil.": "Correct prominent ears for better profile balance.",
    "Ljusna mörka ringar och ge ögonområdet mer vila.": "Brighten dark circles and refresh the eye area.",
    "Lyft ögonbryn för ett piggare, mer vaket uttryck.": "Lift brows for a brighter, more awake look.",
    "Medicinskt stöd mot hållbar viktnedgång.": "Medical support for sustainable weight loss.",
    "Minska bristningar på mage, lår och andra områden.": "Reduce stretch marks on abdomen, thighs and other areas.",
    "Minska fläckar och ojämn pigmentering i huden.": "Reduce spots and uneven pigmentation.",
    "Minska svett i armhålor, händer eller panna.": "Reduce sweating in underarms, hands or forehead.",
    "Minska svullnad och påsar för ett utvilat intryck.": "Reduce puffiness and bags for a rested look.",
    "Minska svullnad och stöd kroppens lymfflöde.": "Reduce swelling and support lymphatic flow.",
    "Minska synliga blodkärl och rodnad i huden.": "Reduce visible blood vessels and redness.",
    "Minska synligheten av bristningar i huden.": "Reduce the visibility of stretch marks.",
    "Minska tunga ögonlock och förbättra sikt och utseende.": "Reduce heavy eyelids and improve vision and appearance.",
    "Minska utbrott och återfå klarare, mer balanserad hud.": "Reduce breakouts and restore clearer, balanced skin.",
    "Mjukt upp rynkor och fina linjer i ansiktet.": "Soften wrinkles and fine lines in the face.",
    "Målriktad reducering av fett som sitter kvar trots livsstil.": "Targeted reduction of fat that persists despite lifestyle.",
    "Permanent hårminskning på valda områden.": "Permanent hair reduction in selected areas.",
    "Permanent kindgrop för ett naturligt, uttrycksfullt leende.": "Permanent dimples for a natural, expressive smile.",
    "Slätare linjer och ett fräschare, ungdomligare utseende.": "Smoother lines and a fresher, more youthful look.",
    "Smalare kindkontur genom avlägsnande av buccalt fett.": "Slimmer cheek contour by removing buccal fat.",
    "Stramare hud och bättre kontur efter viktförändring.": "Firmer skin and better contour after weight change.",
    "Stramare hud och mer definierad kontur i ansiktet.": "Firmer skin and more defined facial contour.",
    "Stärk hudbarriären och lindra irritation och rodnad.": "Strengthen the skin barrier and ease irritation and redness.",
    "Stärk hårbottnen och bromsa eller återfå förlorat hår.": "Strengthen the scalp and slow or restore lost hair.",
    "Säker bedömning och behandling av hudförändringar.": "Safe assessment and treatment of skin lesions.",
    "Tätare intryck och förbättrad hårtjocklek över tid.": "Fuller appearance and improved hair thickness over time.",
    "Återfukta och ge huden smidighet och komfort.": "Rehydrate for supple, comfortable skin.",
    "Återfå lyster och ett friskare, mer levande utseende.": "Restore radiance and a fresher, more vibrant look.",
    "Återställ hårlinjen med avancerad transplantationsmetod.": "Restore the hairline with advanced transplant techniques.",
    "Återställ volym och konturer där tiden tagit uttryck.": "Restore volume and contours where time has shown.",
    "Överblick över våra kirurgiska ingrepp och erfarna specialister.": "Overview of our surgical procedures and experienced specialists.",
}


def translate_nav(node):
    if isinstance(node, dict):
        out = {}
        for k, v in node.items():
            if k == "label" and isinstance(v, str):
                out[k] = LABELS.get(v, v)
            elif k == "description" and isinstance(v, str):
                out[k] = DESCRIPTIONS.get(v, v)
            else:
                out[k] = translate_nav(v)
        return out
    if isinstance(node, list):
        return [translate_nav(x) for x in node]
    return node


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    nav = json.loads((CONTENT / "from-production" / "nav.json").read_text(encoding="utf-8"))
    write_json(OUT / "from-production" / "nav.json", translate_nav(nav))

    footer = json.loads((CONTENT / "from-production" / "footer.json").read_text(encoding="utf-8"))
    footer_en = {
        **footer,
        "linkColumns": [
            {
                "title": "Explore",
                "links": [
                    {"label": "Before & After", "href": "/behandlingar/hydrafacial#results"},
                    {"label": "Patient reviews", "href": "/#vivaci-home-why"},
                    {"label": "Brands", "href": "/#vivaci-home-brands"},
                    {"label": "FAQ", "href": "/#vivaci-home-faq"},
                    {"label": "News & tips", "href": "/nyheter"},
                    {"label": "Payment options", "href": "/#vivaci-home-faq"},
                ],
            },
            {
                "title": "About Vivaci",
                "links": [
                    {"label": "About us", "href": "/#vivaci-home-hero"},
                    {"label": "Meet our experts", "href": "/#vivaci-home-team"},
                    {"label": "Our method", "href": "/#vivaci-home-method"},
                    {"label": "Why Vivaci", "href": "/#vivaci-home-why"},
                    {"label": "Patient safety", "href": "/#vivaci-home-why"},
                    {"label": "Careers", "href": "https://www.bokadirekt.se/places/vivaci-klinik-51774"},
                ],
            },
        ],
        "newsletter": {
            "sectionTitle": "Newsletter",
            "title": "Stay updated",
            "description": "Get news, treatment tips and exclusive offers from Vivaci Clinic.",
            "placeholder": "Your email address",
            "submitLabel": "Subscribe",
        },
        "legal": [
            {"label": "Privacy policy", "href": "/integritetspolicy"},
            {"label": "Cookie policy", "href": "/cookies"},
            {"label": "Terms of purchase", "href": "/villkor"},
            {"label": "Cancellation & refunds", "href": "/avbokning"},
            {"label": "Temporary admin link", "href": CONTENT_ADMIN_URL},
        ],
        "copyright": "© 2026 Vivaci Clinic. All rights reserved.",
    }
    write_json(OUT / "from-production" / "footer.json", footer_en)

    faq_en = {
        "sourceUrl": footer.get("sourceUrl", ""),
        "tagline": "FAQ",
        "heading": "Frequently asked questions",
        "intro": "Answers to common questions about booking, treatments and visits.",
        "cta": {"label": "See all questions", "href": "/faq"},
        "items": [
            {
                "question": "How do I book a consultation?",
                "answer": "Contact us by phone, email or the contact page. The consultation is free of charge.",
            },
            {
                "question": "What payment options do you offer?",
                "answer": "We accept card, Swish and offer instalment plans.",
            },
            {
                "question": "Where is the clinic?",
                "answer": "Solna Torg 3, Plan 2, 171 45 Solna — in the heart of Solna Centrum.",
            },
            {
                "question": "Do treatments hurt?",
                "answer": "Most treatments feel like mild discomfort. We use numbing when needed for comfort.",
            },
            {
                "question": "How soon will I see results?",
                "answer": "It depends on the treatment. Some results are immediate; others develop over days or weeks.",
            },
            {
                "question": "Do I need time off work after treatment?",
                "answer": "Usually not. Many return to daily life the same day. We always give individual advice at your visit.",
            },
            {
                "question": "Are treatments safe?",
                "answer": "We follow medical guidelines with approved products and experienced specialists.",
            },
            {
                "question": "Can I reschedule or cancel?",
                "answer": "Yes. See our cancellation and refund page for timings, fees and terms.",
            },
        ],
    }
    write_json(OUT / "from-production" / "home-faq.json", faq_en)

    homepage_en = {
        "hero": {
            "tagline": "Medical aesthetics · Solna · Stockholm",
            "title": "Premium aesthetic medicine in Solna",
            "intro": "Discover tailored treatments in a calm, exclusive setting.",
            "primaryCta": {"label": "Book a free consultation", "href": "https://www.bokadirekt.se/places/vivaci-klinik-51774"},
            "secondaryCta": {"label": "Explore treatments", "href": "/behandlingar"},
        },
        "problems": {
            "tagline": "Concerns",
            "heading": "Skin concerns",
            "intro": "From acne and rosacea to pigmentation and enlarged pores — explore common skin concerns and how we assess and treat them at Vivaci.",
            "cta": {"label": "See all concerns", "href": "/problem?kategori=hud"},
        },
        "treatmentFinder": {
            "heading": "Find the right treatment for you",
            "intro": "Browse by category and find treatments based on your needs.",
            "searchPlaceholder": "Search treatments",
            "quizHint": "Not sure what you need?",
            "quizCta": "Take our free quiz",
        },
        "featuredTreatments": {
            "tagline": "Treatments",
            "heading": "Featured treatments",
            "intro": "Gentle, effective treatments designed for natural results — in a calm clinic environment.",
            "cta": {"label": "See all treatments", "href": "/behandlingar"},
        },
        "method": {
            "tagline": "Our method",
            "heading": "Advanced diagnostics. Personal treatments. Better results.",
            "intro": "At Vivaci every journey starts with a consultation. We take time to understand your concerns, assess your needs and find the most suitable approach for you.",
            "cta": {"label": "Learn about our method", "href": "/om-oss"},
            "steps": [
                {
                    "title": "Identify",
                    "body": "Every journey begins with a personal consultation. We listen to your concerns, review your goals and assess the treatment area. When appropriate we use advanced diagnostics and clinical photography to understand more deeply and establish a clear baseline — not only what is visible but underlying factors affecting skin, hair, face or body.",
                },
                {
                    "title": "Treat",
                    "body": "Your treatment is chosen and tailored specifically for you. Based on consultation and assessment our specialists select the most suitable treatment, technique and protocol. Every procedure is performed with strong focus on safety, precision, comfort and natural results.",
                },
                {
                    "title": "Optimise",
                    "body": "The best outcomes often come from combining the right treatments. Vivaci offers advanced technology, medical treatments and specialist expertise to create carefully planned combination protocols. We follow your progress and adjust the plan when needed.",
                },
                {
                    "title": "Maintain",
                    "body": "Long-term results need the right follow-up and maintenance. After treatment we give personal recommendations — follow-up visits, maintenance treatments, professional skincare or lifestyle advice — to help you preserve and support your results over time.",
                },
            ],
        },
    }
    write_json(OUT / "homepage-copy.json", homepage_en)

    i18n_en = json.loads((CONTENT / "i18n" / "sv.json").read_text(encoding="utf-8"))
    i18n_en = {
        "nav": {
            "language": "Language",
            "search": "Search",
            "searchTitle": "Search",
            "searchPlaceholder": "Search treatments or pages",
            "searchEmpty": "No results.",
            "close": "Close",
            "cart": "Cart",
            "popularTreatments": "Popular treatments",
        },
        "cart": {
            "title": "Cart",
            "empty": "Your cart is empty.",
            "shippingNote": "Shipping is calculated at checkout.",
            "subtotal": "Subtotal",
            "checkout": "Checkout",
            "continueShopping": "Continue shopping",
            "decrease": "Decrease quantity",
            "increase": "Increase quantity",
            "payments": "Payment options",
        },
        "footer": {"contact": "Contact"},
        "page404": {
            "title": "Page not found",
            "lead": "The page you are looking for does not exist or has moved.",
            "homeCta": "Back to home",
        },
    }
    write_json(CONTENT / "i18n" / "en.json", i18n_en)

    print("Wrote English locale files to", OUT)


if __name__ == "__main__":
    main()
