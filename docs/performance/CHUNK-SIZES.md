# Produktions-Build – größte JS-Chunks (gzip)

Erzeugt mit `yarn build` (Web-Build). Die genauen Hash-Namen wechseln pro Build; die **Größenordnungen** bleiben vergleichbar.

## Größte Einträge (Auszug, gzip)

| Größe (ca.) | Rolle |
|-------------|--------|
| **~543 kB** | `main.*.js` – Redux, Router, Kern-UI; Haupttreiber für **TBT** / „unused JavaScript“ in Lighthouse |
| **~90 kB** | Numerischer Shared-Chunk (`5762.*`) |
| **~63 kB** | `StyleguidePage` (nur bei Aufruf `/styleguide`) |
| **~58 kB** | `locales` (Moment/Locale) |
| **~34 kB** | Shared-Chunk `5515` (u. a. PageBuilder-Abhängigkeiten) |
| **~32 kB** | Shared-Chunk `2391` |
| **~22 kB** | Shared-Chunk `8340` |
| **~19 kB** | Shared-Chunk `5058` |
| **~16 kB** | `EditListingPage` |
| **~13 kB** | `TransactionPage` |
| **~12 kB** | Shared-Chunk `3743` (Landing + PageBuilder + CategoryBar/CSS-Gruppe; siehe Build-Warnung zu CSS-Reihenfolge) |
| **~801 B** | `LandingPage.*.chunk.js` – dünner Einstieg; untere Sektionen (Logo-Slider, Standorte, Space Owner, FAQ) als **eigene Lazy-Chunks** (`SectionLogoSlider`, `SectionLocations`, …) |

## Hinweise für weitere Arbeit

- Ohne neue npm-Abhängigkeit: **Chunk-Liste** wie oben reicht zur Priorisierung; detaillierte Modul-Aufschlüsselung erst mit Freigabe z. B. für `source-map-explorer` / `webpack-bundle-analyzer`.
- **Landing:** Zusätzliches Splitting für unterhalb des Hero-Bereichs reduziert initiales Parsing leicht; der Großteil der Masse bleibt in **`main`** (Sharetribe-Template-typisch).
