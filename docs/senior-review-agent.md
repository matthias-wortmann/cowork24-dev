# Senior Review Agent Gate

Dieses Projekt erzwingt einen automatischen Senior-Review-Check fuer alle Codeaenderungen.

## Ziel

- Jede Aenderung wird durch einen standardisierten Gate-Check validiert.
- Sharetribe- und Stripe-kritische Bereiche muessen explizit in der Commit-Beschreibung
  dokumentiert werden.
- i18n-Konventionen fuer Sharetribe (`en`, `de`, `es`, `fr`) bleiben konsistent.

## Wie der Gate-Check ausgeloest wird

- Automatisch in GitHub Actions bei:
  - Push auf `main`
  - Pull Requests nach `main`
- Lokal per:

```bash
yarn review:senior-agent
```

## Gate-Regeln

1. **Bei geaenderten Dateien in `src/translations/*.json`**:
   - Es muessen alle vier Locale-Dateien betroffen sein (`en`, `de`, `es`, `fr`).

2. **Bei geaenderten Dateien in kritischen Bereichen**:
   - `src/transactions/**`
   - `src/util/sdk.js`
   - `src/util/api.js`
   - `server/**`
   - Dann muss im Commit-Body oder in der Commit-Description ein Tag gesetzt sein:
     - `[senior-reviewed]`
   - Wenn das Tag fehlt, blockiert der Gate-Check.

3. **Keine Codeaenderung erkannt**:
   - Der Check ist erfolgreich (Dokumentations- oder Meta-Lauf).

## Empfohlenes Commit-Muster

```text
feat(checkout): stripe edge-case im payout flow beheben

[senior-reviewed]
- Verified Sharetribe transaction assumptions
- Verified Stripe API payload and error handling
```

