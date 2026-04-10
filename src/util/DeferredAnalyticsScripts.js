import { useEffect } from 'react';

const GTAG_SCRIPT_ID = 'deferred-google-gtag-js';
const PLAUSIBLE_SCRIPT_ID = 'deferred-plausible-js';

/**
 * Lädt Analytics-Skripte erst nach `window` **load** und idealerweise in einer **Idle-Phase**
 * (`requestIdleCallback`), um Main-Thread und First Paint zu entlasten.
 * Nur im **Browser** (ClientApp); erscheint nicht im SSR-HTML.
 *
 * GA4: Initial-`page_view` erfolgt nach Laden von `gtag.js` (vgl. `GoogleAnalyticsHandler` für SPA-Navigation).
 *
 * @param {Object} props
 * @param {Object} [props.analytics] – `config.analytics` (googleAnalyticsId, plausibleDomains)
 * @returns {null}
 */
const DeferredAnalyticsScripts = props => {
  const { analytics } = props;
  const googleAnalyticsId = analytics?.googleAnalyticsId;
  const plausibleDomains = analytics?.plausibleDomains;
  useEffect(() => {
    const hasGa4 = googleAnalyticsId?.indexOf('G-') === 0;
    const hasPlausible = Boolean(plausibleDomains);
    if (!hasGa4 && !hasPlausible) {
      return undefined;
    }

    let cancelled = false;

    const injectGoogleAnalytics = () => {
      if (
        cancelled ||
        document.getElementById(GTAG_SCRIPT_ID) ||
        googleAnalyticsId?.indexOf('G-') !== 0
      ) {
        return;
      }
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', googleAnalyticsId, {
        cookie_flags: 'SameSite=None;Secure',
      });

      const s = document.createElement('script');
      s.id = GTAG_SCRIPT_ID;
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    };

    const injectPlausible = () => {
      if (cancelled || document.getElementById(PLAUSIBLE_SCRIPT_ID) || !hasPlausible) {
        return;
      }
      const s = document.createElement('script');
      s.id = PLAUSIBLE_SCRIPT_ID;
      s.defer = true;
      s.src = 'https://plausible.io/js/script.js';
      s.setAttribute('data-domain', plausibleDomains);
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    };

    const run = () => {
      if (cancelled) {
        return;
      }
      const schedule =
        typeof window.requestIdleCallback === 'function'
          ? cb => window.requestIdleCallback(cb, { timeout: 4000 })
          : cb => window.setTimeout(cb, 1);
      schedule(() => {
        injectGoogleAnalytics();
        injectPlausible();
      });
    };

    if (document.readyState === 'complete') {
      run();
    } else {
      window.addEventListener('load', run, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', run);
    };
  }, [googleAnalyticsId, plausibleDomains]);

  return null;
};

export default DeferredAnalyticsScripts;
