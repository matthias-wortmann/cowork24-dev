import React, { createContext, useContext, useState, useCallback } from 'react';

const LOCALE_STORAGE_KEY = 'locale';
const SUPPORTED_LOCALES = ['de', 'en', 'es', 'fr'];

const LocaleContext = createContext();

/**
 * Reads the persisted locale from localStorage.
 * Falls back to the provided default if none is stored or if the stored value is invalid.
 *
 * @param {string} defaultLocale - fallback locale code
 * @returns {string} locale code
 */
const getInitialLocale = defaultLocale => {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      return stored;
    }
  } catch (e) {
    // localStorage may be unavailable (e.g. private browsing in some browsers)
  }
  return defaultLocale;
};

/**
 * Provider that manages the current locale and exposes it via context.
 * Persists the user's language choice to localStorage.
 *
 * @param {Object} props
 * @param {string} props.defaultLocale - the configured default locale
 * @param {Object} props.allMessages - map of locale code to merged translation messages
 * @param {React.ReactNode} props.children
 */
export const LocaleProvider = ({ defaultLocale, allMessages, children }) => {
  const [locale, setLocaleState] = useState(() => getInitialLocale(defaultLocale));

  const setLocale = useCallback(
    newLocale => {
      if (!SUPPORTED_LOCALES.includes(newLocale)) {
        return;
      }
      setLocaleState(newLocale);
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      } catch (e) {
        // Silently ignore storage errors
      }
    },
    []
  );

  const messages = allMessages[locale] || allMessages[defaultLocale];

  const value = { locale, setLocale, messages };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

/**
 * Hook to access the current locale, the setLocale function, and the active messages.
 *
 * @returns {{ locale: string, setLocale: Function, messages: Object }}
 */
export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
};
