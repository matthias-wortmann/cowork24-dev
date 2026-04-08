# Spec: SEO-Footer (Tabs/Accordion) + FAQ-Landingpage (`/p/faq`)

Datum: 2026-04-08  
Projekt: cowork24 (Sharetribe Web Template Fork)  
Scope: Footer-Überarbeitung (SEO) + dedizierte FAQ Landingpage

## Ziele

- **SEO-optimierter Footer-Bereich** mit klarer Informationsarchitektur, interner Verlinkung und sauberer Semantik.
- **Nicht redundant** zum bestehenden hosted Footer (Page-Builder `footer` Asset).
- **Tabs (Desktop) / Accordion (Mobile)** für Linkgruppen, inklusive **Städte-Direktlinks** auf City-Landingpages.
- **Footer Copyright** mit **Jahreszahl 2026**.
- **Dedizierte FAQ Landingpage** unter **`/p/faq`** (Option B), die bestehende FAQ-Inhalte wiederverwendet.
- **i18n**: neue Footer-Strings in **en/de/es/fr**; vorhandene FAQ-Strings werden wiederverwendet.

## Nicht-Ziele

- Keine Änderung an Transaktionsprozessen (`src/transactions/`).
- Keine neuen npm-Abhängigkeiten.
- Kein Redesign des hosted Footer Assets (wird weiterhin gerendert), außer dass wir Redundanz durch klare Aufgabentrennung vermeiden.

## Aktueller Stand (Ist)

- `src/containers/FooterContainer/FooterContainer.js` rendert aktuell:
  - `FooterCityDestinations` (eigener „Destination Strip“)
  - optional `SectionBuilder` für hosted Footer (`footer` Asset aus `useConfiguration()`).
- `FooterCityDestinations` nutzt `CITY_LANDING_SLUGS` und verlinkt auf Route `CityLandingPage` (`/coworking/:citySlug`).

## Zielbild (Soll)

### 1) Hybrid-Footer (Ansatz B) – „SEO Footer Navigation“ + hosted Footer

Reihenfolge:

1. **SEO Footer Navigation (neu, im Code)** – fokussiert auf „Explore/SEO“:
   - **Tab/Accordion Gruppe „Städte“**: Links auf alle City Landingpages.
   - **Tab/Accordion Gruppe „Entdecken“**: genau drei Links:
     - **Kategorien/Collections** (kuratiert, nicht redundant)
     - **Anbieter / Space Owner** → Route `SpaceOwnerLandingPage` (`/p/space_owner`)
     - **FAQ** → neue Route `FAQLandingPage` (`/p/faq`)
   - **Bottom-Bar**: `© 2026 cowork24` (i18n)
2. **Hosted Footer** (bestehend): wird weiterhin über `SectionBuilder` gerendert.

Wichtig: Der neue SEO-Block enthält keine Legal-/Company-Links, wenn diese bereits im hosted Footer vorhanden sind, um Redundanz zu vermeiden.

### 2) Tabs/Accordion Verhalten

- **Desktop**: Tabs (2 Tabs)
  - Tab 1: Städte
  - Tab 2: Entdecken
- **Mobile**: Accordion mit denselben 2 Gruppen.

### 3) Städte-Direktlinks

- Quelle: `CITY_LANDING_SLUGS` (bestehend).
- Ziel: `NamedLink name="CityLandingPage" params={{ citySlug }}`.

### 4) Kategorien/Collections Link (Footer)

Anforderung: „Kategorien/Collections“ soll SEO-sinnvoll sein, aber nicht zu einer Link-Farm werden.

Vorgehen:
- Verwendung der bestehenden `categoryConfiguration` (wie `SectionCategoryShortcuts`) und Links zu `SearchPage` mit dem passenden Kategorie-Queryparam.
- Im Footer wird **kuratiert** (z. B. Top 6–10 Kategorien) statt „alle“, um Redundanz/Spam zu vermeiden.
- Falls keine Kategorie-Konfiguration vorhanden ist, wird der Block ausgeblendet oder durch einen einzelnen „Alle Kategorien“ Link ersetzt (je nach bestehender UX/Routes).

### 5) FAQ Landingpage (`/p/faq`)

#### Route

- Neue Route in `src/routing/routeConfiguration.js`:
  - `path: '/p/faq'`
  - `name: 'FAQLandingPage'`
  - `component: FAQLandingPage`
  - `loadData: pageDataLoadingAPI.FAQLandingPage.loadData`

#### SSR / loadData

- `src/containers/FAQLandingPage/FAQLandingPage.duck.js` lädt ein hosted Page-Asset:
  - Asset-Name: `faq-page`
  - Asset-Pfad: `content/pages/faq-page.json`
  - Pattern analog `TermsOfServicePage` / `PrivacyPolicyPage`.

#### Rendering / Inhalt

- Page rendert über `PageBuilder` und `FallbackPage` (wie TOS/Privacy).
- Für FAQ-Inhalte wird **vorhandener** FAQ-Accordion-Block wiederverwendet:
  - Basis-FAQ: `SectionFaq` nutzt `LandingPage.faq1Question/Answer` … `LandingPage.faq4Question/Answer`.
  - Diese Keys werden **1:1** übernommen (keine neuen FAQ-Texte erforderlich).
- SEO: `SectionFaq` enthält `FAQPage` JSON-LD.

#### Meta

- Primary: aus hosted asset (`meta.pageTitle`, `meta.pageDescription`) wenn vorhanden.
- Fallback: definierte Meta-Daten im FallbackPage (dezent SEO-fokussiert, i18n optional in späterem Schritt).

## Accessibility (A11y)

- Navigation:
  - `<nav aria-label="…">` für den SEO Footer Navigation Block.
  - Links als `<ul><li>…`.
- Tabs (Desktop):
  - `role="tablist"`, Tabs als Buttons mit `aria-selected`, `aria-controls`.
  - Panels mit `role="tabpanel"`, `aria-labelledby`.
  - Tastatur: Pfeiltasten für Tab-Wechsel; Enter/Space aktiviert.
- Accordion (Mobile):
  - Buttons mit `aria-expanded`, `aria-controls`.
  - Panels mit stabilen IDs.

## i18n

- Neue Keys für Footer-UI (Tabtitel, Überschriften, Aria-Labels, Copyright).
- Pflicht: **en/de/es/fr**.
- FAQ-Landingpage nutzt primär bereits vorhandene `LandingPage.faq*` Strings; nur Seitentitel/Meta und ggf. H1 benötigt neue Keys, sofern nicht vollständig aus hosted asset kommt.

## Umsetzungsschritte (High Level)

1. Footer: Neue „SEO Footer Navigation“ Komponente erstellen und `FooterCityDestinations` darin aufgehen lassen (oder ersetzen).
2. Footer: `FooterContainer` so anpassen, dass Reihenfolge „SEO Block“ → hosted Footer SectionBuilder bleibt.
3. Neue `FAQLandingPage` (Route `/p/faq`) analog zu `TermsOfServicePage`/`PrivacyPolicyPage`.
4. Footer-Link „FAQ“ auf `FAQLandingPage` setzen.
5. i18n Keys ergänzen (4 Sprachen).
6. Lokal testen auf `localhost:3000` (Desktop/Mobile Breakpoints).

## Offene Punkte / Annahmen

- „Kategorien/Collections“ wird im Footer als kuratierte Liste umgesetzt (Top-N), um Redundanz zu vermeiden.
- Hosted Footer bleibt unverändert; Redundanz wird durch strikte Aufgabentrennung vermieden.

