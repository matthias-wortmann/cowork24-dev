---
name: sharetribe-i18n-four-locales
description: >-
  Adds or updates React Intl strings in the Sharetribe Web Template. Use when
  adding FormattedMessage keys, translation IDs, or locale-specific copy; en, de,
  es, and fr JSON files must stay aligned.
---

# Vier Sprachen (en, de, es, fr)

## Pflicht

- Jeder neue Key in **`src/translations/en.json`**, **`de.json`**, **`es.json`**, **`fr.json`**.
- Muster: `"ComponentName.key": "Text mit {variable}"`.
- Im Code: `<FormattedMessage id="ComponentName.key" />` oder `intl.formatMessage({ id: '...' })`.

## Ablauf

1. Key in allen vier Dateien an derselben logischen Stelle einfügen (alphabetisch nach Prefix wie im File üblich).
2. Platzhalter `{name}` in allen Sprachen identisch benennen.
3. Hosted translations in der Console können lokale Defaults überschreiben – lokale Werte bleiben Fallback.
