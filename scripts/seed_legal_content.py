#!/usr/bin/env python3
"""Write content/legal/*.json — Vivaci Klinik legal copy (SV)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content" / "legal"

CONTACT_BLOCK = (
    "<p><strong>Vivaci Klinik</strong><br>"
    "Solna Centrum, Torg 3, Plan 2<br>"
    "171 45 Solna<br>"
    'Telefon: <a href="tel:0850927508">08-509 275 08</a><br>'
    'E-post: <a href="mailto:info@vivaci.se">info@vivaci.se</a></p>'
)


def page(slug: str, title: str, desc: str, body: str) -> dict:
    return {
        "slug": slug,
        "title": title,
        "metaDescription": desc,
        "bodyHtml": body,
    }


PAGES: list[dict] = [
    page(
        "integritetspolicy",
        "Integritetspolicy",
        "Så hanterar Vivaci Klinik dina personuppgifter enligt GDPR.",
        f"""<h1>Integritetspolicy</h1>
<p>Senast uppdaterad: november 2026.</p>
<p>Vivaci Klinik värnar om din personliga integritet. Denna policy beskriver hur vi samlar in, använder, lagrar och skyddar personuppgifter i enlighet med EU:s dataskyddsförordning (GDPR) och tillämplig svensk lag.</p>
<h2>1. Personuppgiftsansvarig</h2>
{CONTACT_BLOCK}
<h2>2. Vilka uppgifter behandlar vi?</h2>
<ul>
<li><strong>Kontaktuppgifter:</strong> namn, telefon, e-post och adress.</li>
<li><strong>Hälso- och behandlingsuppgifter:</strong> uppgifter du lämnar vid konsultation, bokning och behandling, samt journal enligt gällande regler.</li>
<li><strong>Betalningsuppgifter:</strong> vid köp av behandlingar, utbildning eller produkter (hanteras via betalleverantör).</li>
<li><strong>Webbplatsdata:</strong> IP-adress, enhet, webbläsare och — med ditt samtycke — cookies (se vår <a href="/legal/cookies.html">cookiepolicy</a>).</li>
</ul>
<h2>3. Syfte och rättslig grund</h2>
<p>Vi behandlar uppgifter för att:</p>
<ul>
<li>boka och genomföra behandlingar och utbildning,</li>
<li>uppfylla rättsliga skyldigheter (t.ex. journalföring),</li>
<li>kommunicera med dig om tid, eftervård och viktig information,</li>
<li>hantera webshop och betalning,</li>
<li>skicka nyhetsbrev och erbjudanden när du har samtyckt,</li>
<li>förbättra webbplats och tjänster.</li>
</ul>
<p>Rättslig grund: avtal, rättslig förpliktelse, samtycke eller berättigat intresse beroende på behandling.</p>
<h2>4. Lagringstid</h2>
<ul>
<li>Journal och vårddata sparas enligt patientdatalagen och tillämpliga föreskrifter.</li>
<li>Övriga kunduppgifter sparas så länge det behövs för syftet eller tills du begär radering där det är tillåtet.</li>
<li>Nyhetsbrev: tills du avregistrerar dig.</li>
</ul>
<h2>5. Delning och biträden</h2>
<p>Vi säljer inte dina uppgifter. Uppgifter kan delas med betalleverantörer, bokningssystem, IT-leverantörer och andra personuppgiftsbiträden som endast får behandla data enligt våra instruktioner och avtal. Uppgifter kan lämnas ut om lagen kräver det.</p>
<h2>6. Dina rättigheter</h2>
<p>Du har rätt till information, rättelse, radering (i den utsträckning lagen medger), begränsning, invändning mot viss behandling och dataportabilitet. Du kan också klaga hos Integritetsskyddsmyndigheten (IMY).</p>
<h2>7. Säkerhet</h2>
<p>Vi använder tekniska och organisatoriska åtgärder för att skydda uppgifter mot obehörig åtkomst, förlust och missbruk.</p>
<h2>8. Ändringar</h2>
<p>Vi kan uppdatera denna policy. Gällande version publiceras alltid på vivaci.se.</p>
<h2>9. Kontakt</h2>
<p>För frågor om integritet, kontakta oss via uppgifterna ovan.</p>""",
    ),
    page(
        "cookies",
        "Cookiepolicy",
        "Information om cookies och liknande teknik på Vivaci Kliniks webbplats.",
        f"""<h1>Cookiepolicy</h1>
<p>Senast uppdaterad: november 2026.</p>
<p>Denna policy beskriver hur Vivaci Klinik använder cookies och liknande tekniker på vår webbplats.</p>
<h2>Vad är cookies?</h2>
<p>Cookies är små textfiler som lagras i din webbläsare. De används för att webbplatsen ska fungera, komma ihåg val och — i vissa fall — mäta användning.</p>
<h2>Typer av cookies vi kan använda</h2>
<ul>
<li><strong>Nödvändiga:</strong> krävs för grundläggande funktioner (t.ex. varukorg, språkval, säkerhet).</li>
<li><strong>Funktionella:</strong> kommer ihåg inställningar och förbättrar upplevelsen.</li>
<li><strong>Analys:</strong> hjälper oss förstå hur webbplatsen används så att vi kan förbättra innehåll och struktur (endast med samtycke där det krävs).</li>
<li><strong>Marknadsföring:</strong> används endast om du samtycker och om sådana verktyg aktiveras.</li>
</ul>
<h2>Hantera cookies</h2>
<p>Du kan blockera eller radera cookies i webbläsarens inställningar. Vissa funktioner kan då sluta fungera som avsett.</p>
<h2>Local storage</h2>
<p>Vi kan använda lokal lagring i webbläsaren för t.ex. varukorg och språkval. Detta är nödvändigt för att tjänsten ska fungera smidigt.</p>
<h2>Mer om personuppgifter</h2>
<p>Läs vår <a href="/integritetspolicy">integritetspolicy</a> för hur vi behandlar personuppgifter i övrigt.</p>
<h2>Kontakt</h2>
{CONTACT_BLOCK}""",
    ),
    page(
        "kopvillkor",
        "Allmänna villkor",
        "Köp- och bokningsvillkor för behandlingar, produkter och utbildning hos Vivaci Klinik.",
        f"""<h1>Allmänna villkor</h1>
<p>Senast uppdaterad: november 2026.</p>
<p>Dessa villkor gäller när du bokar behandling, köper produkter i webshoppen eller anmäler dig till utbildning hos Vivaci Klinik (&quot;vi&quot;, &quot;oss&quot;). Genom att genomföra en bokning eller ett köp godkänner du villkoren.</p>
<h2>1. Tjänster och produkter</h2>
<p>Behandlingar och utbildning utförs av legitimerad personal enligt gällande medicinska riktlinjer. Produktinformation på webbplatsen är vägledande; vi förbehåller oss rätten att korrigera uppenbara fel.</p>
<h2>2. Bokning och konsultation</h2>
<p>Konsultationer och behandlingar bokas via vår webbplats, telefon eller på plats. Du ansvarar för att lämna korrekta kontaktuppgifter och relevant hälsinformation.</p>
<h2>3. Priser och betalning</h2>
<p>Priser anges i svenska kronor inklusive moms om inget annat anges. Betalning sker enligt valt sätt vid bokning, köp eller efter behandling enligt överenskommelse. Vi kan använda extern betalleverantör.</p>
<h2>4. Ångerrätt och digitala tjänster</h2>
<p>För konsultationer och behandlingar som utförs enligt överenskommen tid gäller särskilda regler; se även sidan <a href="/avbokning">Avbokning &amp; återbetalning</a>. För fysiska produkter i webshop gäller distansavtalslagen när den är tillämplig.</p>
<h2>5. Reklamation</h2>
<p>Upplever du att något inte stämmer med en produktleverans, kontakta oss inom skälig tid på info@vivaci.se så hjälper vi dig.</p>
<h2>6. Ansvarsbegränsning</h2>
<p>Vi ansvarar för tjänster enligt tvingande konsumentlagstiftning. Vi ansvarar inte för indirekta skador eller force majeure.</p>
<h2>7. Immateriella rättigheter</h2>
<p>Webbplatsens innehåll tillhör Vivaci Klinik eller licensgivare och får inte kopieras utan tillstånd.</p>
<h2>8. Personuppgifter</h2>
<p>Behandling av personuppgifter regleras i vår <a href="/integritetspolicy">integritetspolicy</a>.</p>
<h2>9. Tvist</h2>
<p>Svensk lag gäller. Tvist kan prövas av allmän domstol eller via ARN för konsumenttvister.</p>
<h2>10. Kontakt</h2>
{CONTACT_BLOCK}""",
    ),
    page(
        "avbokning",
        "Avbokning & återbetalning",
        "Regler för avbokning, ombokning och återbetalning hos Vivaci Klinik.",
        f"""<h1>Avbokning &amp; återbetalning</h1>
<p>Senast uppdaterad: november 2026.</p>
<p>Vi vill att du ska känna dig trygg när du bokar hos Vivaci Klinik. Nedan beskriver vi hur avbokning, ombokning och återbetalning fungerar.</p>
<h2>Ombokning</h2>
<p>Behöver du flytta tiden? Kontakta oss så snart som möjligt via telefon eller info@vivaci.se. Vi försöker hitta en ny tid som passar dig.</p>
<h2>Avbokning</h2>
<ul>
<li>Avbokning minst <strong>48 timmar</strong> före bokad tid: ingen avgift.</li>
<li>Avbokning senare än 48 timmar före eller uteblivet besök: vi kan debitera en avbokningsavgift motsvarande behandlingens ordinarie pris, om inte annat skriftligen avtalats.</li>
</ul>
<p>Utbildning och kampanjpriser kan ha särskilda avbokningsregler — dessa framgår vid anmälan.</p>
<h2>Återbetalning</h2>
<p>Har du betalat i förskott och avbokar i enlighet med reglerna ovan återbetalar vi beloppet till samma betalsätt inom rimlig tid. Del av förskottsbetalning kan enligt avtal vara icke återbetalningsbar vid sen avbokning.</p>
<h2>Produkter (webshop)</h2>
<p>Oöppnade produkter kan returneras enligt distansavtalslagen inom 14 dagar från mottagande, om inte annat anges för hygienprodukter. Kontakta oss innan retur.</p>
<h2>Force majeure</h2>
<p>Vid sjukdom, tekniska störningar eller andra oförutsedda händelser kan vi behöva omboka. Du erbjuds då ny tid eller återbetalning.</p>
<h2>Kontakt</h2>
{CONTACT_BLOCK}""",
    ),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for doc in PAGES:
        slug = doc["slug"]
        (OUT / f"{slug}.json").write_text(
            json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        routes = {
            "integritetspolicy": "/integritetspolicy",
            "cookies": "/legal/cookies.html",
            "kopvillkor": "/villkor",
            "avbokning": "/avbokning",
        }
        index.append(
            {
                "slug": slug,
                "title": doc["title"],
                "path": routes.get(slug, f"/legal/{slug}.html"),
            }
        )
    (OUT / "index.json").write_text(
        json.dumps({"pages": index}, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"Wrote {len(PAGES)} legal pages under {OUT}")


if __name__ == "__main__":
    main()
