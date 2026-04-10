# Mobile Performance – Baseline (Lighthouse)

Messung: **Lighthouse 11.7.1**, Mobile-Preset, gegen die Test-URL  
`https://cowork24-test-eb8308d3a334.herokuapp.com/` (Stand der Session).  
Rohdaten: [`lighthouse-mobile-test.json`](./lighthouse-mobile-test.json).

Die **PageSpeed-Insights-API** war quota-überschritten (429); die Baseline stützt sich deshalb auf diesen Lighthouse-Lauf.

## Lab-Metriken (Auszug)

| Metrik | Wert |
|--------|------|
| **Leistung (Score)** | 0,73 (73) |
| **FCP** | 2,3 s |
| **LCP** | 2,4 s |
| **TBT** | ~300 ms |
| **CLS** | 0,304 |
| **Speed Index** | 2,8 s |
| **TTI** | ~13,6 s |
| **TTFB (Root-Dokument)** | ~200 ms |

## Top-Audits (Priorisierung)

1. **render-blocking-resources** – geschätzte Einsparung ~1000 ms (u. a. externes Mapbox-CSS, `main.*.css`, weitere CSS-Chunks).
2. **unused-javascript** – geschätzt ~497 KiB / ~4,15 s (u. a. Mapbox-GL-Bundle, Haupt-Chunk).
3. **modern-image-formats** – geschätzt ~336 KiB (AVIF/WebP).
4. **unused-css-rules** – gering (~16 KiB).
5. **bootup-time** / **mainthread-work-breakdown** – hoher JS-Anteil auf dem Main Thread.

## Kurzfazit

- **TTFB ~200 ms**: im akzeptablen Rahmen; Feintuning eher über Heroku (Dyno, Region, Kaltstart) als über Front-End.
- **LCP ~2,4 s**: knapp unter dem üblichen „gut“-Korridor für LCP; Hero/Listing-Bilder sind bereits priorisiert; stabiles `<link rel="preload">` für eine Imgix-URL ohne feste erste Variante wäre fehleranfällig – optional nur bei fester SSR-ableitbarer URL.
- **CLS 0,304**: deutlicher Hebel neben JS (Layout-Stabilität prüfen, nicht nur Bilder).
- Nächste sinnvolle Front-End-Schritte: **Third-Party (GA) nach Load/Idle**, **weiteres Entlasten von Mapbox/CSS-Blocking** wo ohne UX-Bruch möglich, **Bundle/Splitting** für nicht-first-paint-Pfade.

## LCP – Follow-up (Umsetzung)

- **Kein blindes Preload** der LCP-Bild-URL: Page-Builder-/Imgix-Varianten sind kontextabhängig; falsches Preload verschlechtert eher die Metrik.
- Bereits umgesetzt (Branch): `fetchPriority` / kein `loading="lazy"` auf LCP-relevanten Hero- und Listing-Karten-Bildern; siehe Page-Builder- und Listing-Hero-Komponenten.

## TTFB / Heroku

- Lab **~200 ms** für das Root-Dokument: kein kritischer Engpass im Lighthouse-Lauf.
- Operativ: Dyno-Typ, Region zur Zielgruppe, Kaltstarts; **`LandingPage.duck.js`** lädt nur konfigurierte Listing-Rows – keine zusätzlichen SDK-Runden nur für diese Baseline eingeführt.
