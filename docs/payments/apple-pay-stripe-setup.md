# Apple Pay / Google Pay (Stripe Payment Request) – Betrieb

Die Checkout-Seite nutzt den Stripe **Payment Request Button** (Apple Pay, Google Pay wo verfügbar). Zusätzlich zur Code-Integration sind folgende Schritte nötig.

## Stripe Dashboard

- Apple Pay / Wallets für die Plattform aktivieren.
- Jede **Checkout-Domain** (Staging und Produktion) unter **Settings → Payment methods → Apple Pay** registrieren.
- Die angebotene Datei `apple-developer-merchantid-domain-association` nach `public/.well-known/` legen (siehe `public/.well-known/README.txt`) und deployen; die URL muss öffentlich unter `https://<domain>/.well-known/apple-developer-merchantid-domain-association` erreichbar sein.

## Apple Developer

- **Merchant ID** anlegen und mit Stripe verknüpfen (laut Stripe-Dokumentation).
- Agreements/Capabilities für Apple Pay prüfen.

## Sharetribe

- Transaktionsprozesse müssen weiterhin `stripe-create-payment-intent` und den üblichen Confirm-Pfad verwenden (Standard-Prozesse).

## Tests (manuell)

- Safari (macOS/iOS) mit verifizierter Domain und echtem Gerät.
- Formularpflichtfelder vor Wallet-Zahlung ausfüllen.
- Gespeicherte Karte vs. Einmalkarte; Negotiation-/Inquiry-Flow falls genutzt.
