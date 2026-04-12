# CheckoutPage

This page handles transaction initialization with payments, if payments are used. In addition, the
default-inquiry process (which doesn't include payments) creates a new transaction when the form is
submitted.

## Different processes

This Sharetribe Web Template supports 3 processes:

- **_default-booking_**
- **_default-purchase_**
- **_default-negotiation_**
- **_default-inquiry_**

The first 3 transaction processes include Stripe payments, but the last one (**_default-inquiry_**)
does not.

## How customers navigate to CheckoutPage

There are 2 ways how customers can navigate to the checkout page:

- ListingPage
- TransactionPage

On both of those pages, there's a component called OrderPanel, which shows a correct form to collect
order data. The order data and listing entity are then passed to the CheckoutPage as initial data
for the page.

In addition, _default-booking_, _default-purchase_, and _default-negotiation_ processes have a
separate inquiry state at the beginning of the process graph (to enable discussion between customer
and provider). If the transaction entity has been created with inquire transition, the transaction
exists already and it is also passed along with order data and listing entity for the CheckoutPage.
In this scenario, the customer navigates to CheckoutPage from TransactionPage. With the negotiation
process, a negotiation phase always precedes payment, so the transaction always exists when the
customer initiates payment, and the customer always navigates to CheckoutPage from TransactionPage."

## Order data and session storage

The order data, listing, and transaction are together considered essential data for the page, and
they are also saved to the **sessionStorage** for 1 day. This means that the page data is not lost
if the customer makes a full page load on the checkout page. Relevant files for sessionStorage
handling:

- [CheckoutPageSessionHelpers.js](./CheckoutPageSessionHelpers.js)
- [CheckoutPage.js](https://github.com/sharetribe/web-template/blob/inquiry-process/src/containers/CheckoutPage/CheckoutPage.js)

### Transactions with payments

When page data contains a listing with a listing type that uses _default-booking_ and
_default-purchase_ processes, the page uses a sub-component called **CheckoutPageWithPayment**.

First, the checkout page calls `loadInitialDataForStripePayments` for these Stripe-related
processes, which calls `fetchSpeculatedTransaction` if the transaction has not made any transition
that creates _line items_ for pricing and Stripe PaymentIntent. The "speculative transaction" has 2
purposes:

- it checks if Marketplace API can execute the transition without errors
- it gets **_line items_** from the client app's server - so that the order breakdown can be shown
  correctly.

With the speculative transaction, the job of the _CheckoutPageWithPayment_ component is to show the
order breakdown and _StripePaymentForm_, which then asks for billing details and a potential
shipping address.

After the form is submitted, the checkout flow is a rather complex one. First, `getOrderParams` is
called (it's also called with _fetchSpeculatedTransaction_). You might need to customize those order
params if you customize the _OrderPanel_, _checkout form_, or _transaction process_ itself.

In addition, there's actually a sequence of XHR calls that the app needs to make:

1. First step is to kickstart the payment process through Marketplace API.  
   This call is proxied through the client app's server, where custom pricing is done by creating
   line items for the transaction.
   - Note: the negotiation process does not use proxied call since it doesn't use privileged
     transition. The line-items have been added to the transaction entity already by the time the
     customer navigates to CheckoutPage.
2. Then there's potentially 3D security verification that Stripe might show.  
   It's shown if the card issuer enforces it for the current payment intent.
3. If the Stripe verification succeeded, the payment needs to be confirmed against Marketplace API
4. If the initial message was added, that needs to be
   [sent separately](https://www.sharetribe.com/api-reference/marketplace.html#send-message)
5. If payment card details need to be saved as the default payment method, the last step is to do
   that.

Read more:

- [getOrderParams](./CheckoutPageWithPayment.js#L69)
- **processCheckoutWithPayment** function in
  [CheckoutPageTransactionHelpers.js](./CheckoutPageTransactionHelpers.js)
- [The aforementioned call sequence explained in the Docs](https://www.sharetribe.com/docs/how-to/enable-payment-intents/#3-checkoutpage-add-new-api-calls-and-call-them-in-sequence)  
  (This article is for devs who don't use Sharetribe Web Template - since the steps are already
  implemented in this codebase.)

After those API calls have been made, customer is redirected to TransactionPage, where customer can
continue messaging and view the order.

### Apple Pay, Google Pay (Stripe Payment Request Button)

The checkout form mounts Stripe’s **Payment Request Button** when a speculative (or existing)
transaction has `payinTotal` and line items. The browser shows **Apple Pay** or **Google Pay** when
the customer’s device and wallet support it; the same Sharetribe + PaymentIntent sequence as for
cards runs in `processCheckoutWithPayment` (wallet path uses `payment_method: <pm_id>` with
`confirmCardPayment`).

**How to test**

- Use **Stripe test mode** (`pk_test_…` in `REACT_APP_STRIPE_PUBLISHABLE_KEY` and matching Connect /
  marketplace setup in Sharetribe Console).
- Serve the app over **HTTPS** (required for Payment Request in production-like setups). Local HTTPS
  or a tunnel (e.g. ngrok) is enough for domain verification.
- In the [Stripe Dashboard](https://dashboard.stripe.com/) → **Settings → Payment methods**, ensure
  **Apple Pay** (and **Google Pay** if you test in Chrome) are enabled for your platform account.
- **Apple Pay on the web:** register your domain under **Settings → Payment methods → Apple Pay →
  Add domain** (Stripe walks through hosting a verification file or using their flow). Without this,
  the button often does not appear on Safari.
- **Google Pay:** Chrome with a saved card in Google Pay; on desktop you may need a real card in
  wallet—test cards behave like normal cards for the PaymentIntent, but the wallet sheet still
  depends on Google Pay availability.
- Fill **required billing (and shipping) fields** on the checkout form first; the template shows an
  error if the form is invalid when using the wallet button.

**Note:** Additional Stripe methods (e.g. iDEAL, Klarna) are not enabled by this button alone; they
typically need Stripe **Payment Element** and broader backend/marketplace changes beyond the default
Sharetribe PaymentIntent + card flow.

### Inquiry transactions

The transaction flow for inquiry transaction is much simpler. It just creates new transactions by
directly calling Marketplace API. In this process, the initial message is actually saved to the
transaction's protected data instead of sent as a
[Message entity](https://www.sharetribe.com/api-reference/marketplace.html#send-message).
