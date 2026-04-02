---
name: cowork24-sharetribe-template
description: >-
  Cowork24 marketplace fork based on Sharetribe Web Template. Use when editing
  React containers, config, translations, Page Builder sections, or Sharetribe
  SDK usage; read AGENTS.md and CLAUDE.md for conventions and landing listing rows.
---

# cowork24 Sharetribe Template

## Zuerst

1. **`AGENTS.md`** (Root) – vollständige Konventionen.
2. **`CLAUDE.md`** – Kurzüberblick, cowork24-spezifische Pfade.

## Typische Aufgaben

| Aufgabe | Wo |
|--------|-----|
| Neue Seite + API-Daten | `containers/<Page>/`, `*.duck.js`, `pageDataLoadingAPI.js`, `routeConfiguration.js` |
| Marktplatz-Konfiguration | `src/config/`, hosted assets bevorzugt |
| UI-Texte | `src/translations/*.json` (alle 4 Sprachen) |
| Landing-Horizontal-Listings | `configLandingPage.js`, `landingPageListings.js`, `LandingPage.duck.js`, `SectionLandingListingRows`, `FallbackPage.js` (`rowIds`) |
| Wiederverwendbare UI | `src/components/` (Export-Reihenfolge in `components/index.js`) |

## Qualität

- Import-Reihenfolge wie in `CheckoutPage.js`.
- CSS Modules, Klassen-Selektoren, Breakpoints aus `customMediaQueries.css`.
- Keine Transaktionsprozess-Änderungen ohne Nutzer-Freigabe.
