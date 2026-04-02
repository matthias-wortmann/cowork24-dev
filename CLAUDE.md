# CLAUDE.md – AI-Arbeitsgrundlage (cowork24 / Sharetribe Web Template)

Diese Datei ergänzt [`AGENTS.md`](./AGENTS.md). **Zuerst `AGENTS.md` lesen** – dort stehen Architektur, Konventionen und Sharetribe-Spezifika vollständig.

## Projekt

- **Basis:** [Sharetribe Web Template](https://github.com/sharetribe/web-template) (React 18, Redux Toolkit, Final Form, Express, SSR).
- **Fork / Produkt:** cowork24 – Anpassungen in `src/config/`, `src/containers/`, Übersetzungen und Page-Builder-Sektionen.

## Prioritäten für Änderungen

1. **SSR:** Seitendaten über `loadData` in `*.duck.js` laden; in [`src/containers/pageDataLoadingAPI.js`](./src/containers/pageDataLoadingAPI.js) und [`src/routing/routeConfiguration.js`](./src/routing/routeConfiguration.js) registrieren. Keine API-Ladung nur in `useEffect`, wenn die Seite SSR-relevant ist.
2. **Konfiguration:** Bevorzugt **Hosted Assets** (Sharetribe Console); lokale Defaults in `src/config/` nur, wenn nötig. Merge/Validierung: `src/util/configHelpers.js`.
3. **i18n:** Neue Strings in **`en.json`, `de.json`, `es.json`, `fr.json`**; Muster `ComponentName.key`. `FormattedMessage` / `useIntl()`.
4. **Abhängigkeiten:** Keine neuen npm-Pakete ohne ausdrückliche Freigabe; lieber `src/util/` erweitern.
5. **Transaktionsprozesse:** Änderungen an `src/transactions/` nur mit Nutzer-Freigabe und Backend-Anpassung.

## cowork24-spezifische Erweiterungen

- **Landing-Listing-Zeilen:** Konfiguration in [`src/config/configLandingPage.js`](./src/config/configLandingPage.js), eingebunden über `configDefault.js` → `landingPage`. Logik: [`src/util/landingPageListings.js`](./src/util/landingPageListings.js), Redux: [`src/containers/LandingPage/LandingPage.duck.js`](./src/containers/LandingPage/LandingPage.duck.js), UI: `SectionLandingListingRows`. Fallback-Sections: [`src/containers/LandingPage/FallbackPage.js`](./src/containers/LandingPage/FallbackPage.js) (`rowIds` pro Section).
- **Page Builder:** Sektionen unter `src/containers/PageBuilder/SectionBuilder/`; neue Sektionstypen in `LandingPage.js` / `FallbackPage.js` unter `sectionComponents` registrieren.

## Formatierung

- Prettier: einfache Anführungszeichen, 2 Spaces, trailing commas, max. 100 Zeichen.

## Cursor / Skills

- Projekt-Rules: `.cursor/rules/*.mdc`
- Projekt-Skills: `.cursor/skills/*/SKILL.md`

## Nützliche Docs

- [Sharetribe Template-Docs](https://www.sharetribe.com/docs/)
- [Marketplace API](https://www.sharetribe.com/api-reference/marketplace.html)
