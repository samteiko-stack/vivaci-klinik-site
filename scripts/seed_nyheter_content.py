#!/usr/bin/env python3
"""Write content/nyheter/*.json from production-aligned copy."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content" / "nyheter"

AUTHOR_MARIA = {
    "name": "Maria Ekström",
    "role": "Sjuksköterska, Vivaci Klinik",
    "image": "/images/pexels/blog-author.jpg",
    "bio": "Maria arbetar nära patienter inför och efter behandling och sammanfattar praktiska råd från klinikens team.",
}

AUTHOR_SOFIA = {
    "name": "Sofia Bergman",
    "role": "Hudterapeut, Vivaci Klinik",
    "image": "/images/pexels/team-3.jpg",
    "bio": "Sofia fokuserar på hudhälsa, produktval och skonsamma rutiner som kompletterar medicinska behandlingar.",
}

AUTHOR_ANNA = {
    "name": "Dr. Anna Lindström",
    "role": "Medicinsk direktör, Vivaci Klinik",
    "image": "/images/pexels/team-1.jpg",
    "bio": "Anna leder klinikens medicinska arbete med fokus på säkerhet, tydlig information och naturliga resultat.",
}


def p(*parts: str) -> str:
    return "".join(f"<p>{html_escape(t)}</p>" for t in parts)


def html_escape(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


POSTS: list[dict] = [
    {
        "slug": "forbered-dig-infor-behandling",
        "title": "Så förbereder du dig inför din första behandling",
        "metaDescription": "Praktiska tips från Vivaci inför konsultation och behandling — så att du känner dig trygg och förberedd.",
        "category": "Bloggartikel",
        "excerpt": "Praktiska tips från vårt team inför konsultation och behandling — så att du känner dig trygg och förberedd.",
        "date": "12 feb 2026",
        "readTime": "4 min läsning",
        "author": AUTHOR_MARIA,
        "heroImage": "/images/pexels/blog-1.jpg",
        "tags": ["Första besök", "Konsultation", "Eftervård"],
        "bodyHtml": p(
            "En första behandling behöver inte kännas osäker. Med rätt förberedelse blir besöket mer avslappnat och resultatet lättare att utvärdera tillsammans.",
            "Kom gärna utan tung makeup i behandlingsområdet, undvik alkohol dagen innan om du får injektionsbehandling, och ta med en lista över läkemedel och eventuella allergier.",
            "Under konsultationen går vi igenom förväntningar, risker, eftervård och realistiska resultat. Du ska alltid känna dig informerad innan du tar beslut.",
            "Efter behandlingen får du skriftliga råd. Planera gärna in lite lugn tid samma dag — särskilt om du har socialt program där synliga rodnader tillfälligt kan synas.",
        ),
    },
    {
        "slug": "hudforandringar-kontroll",
        "title": "Därför är det viktigare än någonsin att kontrollera dina hudförändringar",
        "metaDescription": "Nya eller förändrade leverfläckar ska tas på allvar. Vivaci förklarar när du bör söka bedömning.",
        "category": "Utbildande",
        "excerpt": "Nya eller förändrade leverfläckar ska tas på allvar. Våra hudläkare förklarar när du bör söka bedömning.",
        "date": "28 jan 2026",
        "readTime": "5 min läsning",
        "author": AUTHOR_ANNA,
        "heroImage": "/images/pexels/blog-2.jpg",
        "tags": ["Hudhälsa", "Kontroll", "Dermatoskopi"],
        "bodyHtml": p(
            "Huden förändras över tid — det är normalt. Men vissa förändringar bör bedömas av en läkare: asymmetri, ojämn kant, färgskiftningar, växande storlek eller sår som inte läker.",
            "Sol, ålder och genetik påverkar risken. Regelbundna kontroller gör att misstänkta förändringar kan upptäckas tidigt, vilket ger bättre förutsättningar för rätt åtgärd.",
            "Hos Vivaci Klinik gör vi en strukturerad bedömning. Vid behov använder vi dermatoskopi och dokumenterar fynd så att vi kan följa utvecklingen över tid.",
            "Om något kräver vidare utredning eller kirurgisk åtgärd hänvisar vi dig vidare i rätt vårdkedja. Kontakta oss om du är osäker — det är alltid bättre att fråga en gång för mycket.",
        ),
    },
    {
        "slug": "mina-sidor-digital-portal",
        "title": "Mina sidor — vår nya digitala kommunikationsportal",
        "metaDescription": "Påminnelser, eftervårdsråd och enkel kontakt med kliniken via Vivacis digitala portal.",
        "category": "Nyhet",
        "excerpt": "Få påminnelser, eftervårdsråd och enkel kontakt med kliniken via vår nya digitala portal.",
        "date": "15 jan 2026",
        "readTime": "3 min läsning",
        "author": AUTHOR_MARIA,
        "heroImage": "/images/pexels/blog-3.jpg",
        "tags": ["Mina sidor", "Digitalt", "Patient"],
        "bodyHtml": p(
            "Vi har lanserat Mina sidor — en trygg digital yta där du som patient kan följa bokningar, ta del av information efter besök och kommunicera med kliniken på ett mer strukturerat sätt.",
            "Portalen är tänkt att komplettera, inte ersätta, det personliga mötet. Känsliga medicinska frågor hanteras fortsatt enligt våra rutiner och journalsäkerhet.",
            "Du får inloggningsuppgifter i samband med ditt besök eller via den e-postadress du registrerat hos oss. Har du frågor om aktivering hjälper receptionen dig gärna.",
            "Målet är enklare vardag för dig och bättre uppföljning för oss — så att din behandlingsresa blir tydlig från första kontakt till eftervård.",
        ),
    },
    {
        "slug": "naturliga-resultat-injektioner",
        "title": "Så skapar vi naturliga resultat med injektionsbehandlingar",
        "metaDescription": "Mindre kan vara mer — dosering, anatomi och uppföljning för resultat som känns som dig.",
        "category": "Utbildande",
        "excerpt": "Mindre kan vara mer. Så tänker vi kring dosering, anatomi och uppföljning för resultat som känns som dig.",
        "date": "8 jan 2026",
        "readTime": "5 min läsning",
        "author": AUTHOR_ANNA,
        "heroImage": "/images/pexels/blog-4.jpg",
        "tags": ["Injektioner", "Naturligt resultat", "Konsultation"],
        "bodyHtml": p(
            "På Vivaci Klinik är målet aldrig ett “gjort” utseende. Vi utgår från din anatomi, dina proportioner och vad som är medicinskt lämpligt — inte trender.",
            "Under konsultationen bedömer vi ansiktet i vila och rörelse. Det hjälper oss att välja rätt produkt, teknik och mängd för just dig.",
            "Behandlingar kan ske i steg. Ibland är det bättre att börja försiktigt och utvärdera efter ett par veckor, särskilt vid filler eller kombinationsplaner.",
            "Eftervård och realistiska förväntningar är en del av resultatet. Vi berättar vad som är normalt de första dagarna och när du bör höra av dig.",
        ),
    },
    {
        "slug": "sommarkonsultationer-2026",
        "title": "Digitala videokonsultationer under sommaren",
        "metaDescription": "Boka digital konsultation när det passar dig — samma medicinska bedömning utan att besöka kliniken först.",
        "category": "Nyhet",
        "excerpt": "Boka en digital konsultation när det passar dig — även under semestern.",
        "date": "20 jun 2026",
        "readTime": "4 min läsning",
        "author": AUTHOR_SOFIA,
        "heroImage": "/images/pexels/blog-2.jpg",
        "tags": ["Videokonsultation", "Sommar", "Boka tid"],
        "bodyHtml": p(
            "Sommaren innebär ofta resa, semester och ett mer rörligt schema. På Vivaci Klinik erbjuder vi därför digitala videokonsultationer så att du kan få en professionell bedömning utan att vänta till hösten.",
            "Under samtalet går vi igenom dina mål, eventuella tidigare behandlingar och lämpliga alternativ. Du får en tydlig rekommendation och kan boka tid för behandling när du är tillbaka i Stockholm.",
            "Videokonsultationen genomförs av våra erfarna specialister och följer samma medicinska riktlinjer som ett besök på kliniken.",
            "Om vi bedömer att ett fysiskt möte behövs innan behandling, berättar vi det tydligt. Boka via vår kontaktsida eller telefon — ange gärna att du önskar digital konsultation.",
        ),
    },
    {
        "slug": "varens-hudvardspaket",
        "title": "Vårens hudvårdspaket — begränsat antal",
        "metaDescription": "Kombinera konsultation och behandling till paketpris — en nystart för huden inför sommaren.",
        "category": "Erbjudande",
        "excerpt": "Kombinera konsultation och behandling till ett förmånligt paketpris inför sommaren.",
        "date": "3 apr 2026",
        "readTime": "3 min läsning",
        "author": AUTHOR_SOFIA,
        "heroImage": "/images/pexels/blog-1.jpg",
        "tags": ["Paket", "Hudvård", "Erbjudande"],
        "bodyHtml": p(
            "Vårens hudvårdspaket är utformat för dig som vill ha en tydlig plan: konsultation, rekommenderad behandling och uppföljning — samlat till ett paketpris.",
            "Efter konsultationen tar vi fram en individuell rekommendation baserad på din hudtyp, dina mål och eventuell tidigare behandlingshistorik.",
            "Paketet kan till exempel inkludera medicinsk ansiktsbehandling eller en injektionsbehandling beroende på vad som passar dig. Antalet platser är begränsat under kampanjperioden.",
            "Vill du veta om paketet passar dig? Boka en konsultation eller kontakta oss så går vi igenom innehåll, pris och tillgängliga tider.",
        ),
    },
]

CATEGORY_ORDER = ["Nyhet", "Utbildande", "Bloggartikel", "Erbjudande"]


def _listing_json() -> dict:
    buckets: dict[str, list] = {label: [] for label in CATEGORY_ORDER}
    for post in POSTS:
        cat = post["category"]
        if cat not in buckets:
            buckets[cat] = []
        buckets[cat].append(
            {
                "href": f"/nyheter/{post['slug']}",
                "label": post["title"],
                "description": post["excerpt"],
                "image": post["heroImage"],
            }
        )
    categories = []
    seen: set[str] = set()
    for label in CATEGORY_ORDER:
        if label in buckets and buckets[label]:
            categories.append({"label": label, "items": buckets[label]})
            seen.add(label)
    for label, items in buckets.items():
        if label not in seen and items:
            categories.append({"label": label, "items": items})
    return {"source": "generated", "categories": categories}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for post in POSTS:
        slug = post["slug"]
        doc = {k: v for k, v in post.items() if k != "slug"}
        doc["slug"] = slug
        (OUT / f"{slug}.json").write_text(
            json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        index.append(
            {
                "slug": slug,
                "title": post["title"],
                "excerpt": post["excerpt"],
                "category": post["category"],
                "date": post["date"],
                "readTime": post["readTime"],
                "heroImage": post["heroImage"],
                "path": f"/nyheter/{slug}",
            }
        )
    (OUT / "index.json").write_text(
        json.dumps({"posts": index}, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    (OUT / "listing.json").write_text(
        json.dumps(_listing_json(), indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Wrote {len(POSTS)} posts + index.json + listing.json under {OUT}")


if __name__ == "__main__":
    main()
