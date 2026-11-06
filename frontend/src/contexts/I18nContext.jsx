import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';

const I18nContext = createContext(null);

const resources = {
  en,
  hi,
  mr,
};

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳' },
];

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const urlLang = new URLSearchParams(window.location.search).get('lang');
        if (urlLang && resources[urlLang]) return urlLang;
      }
      const saved = localStorage.getItem('orderwise_lang');
      if (saved && resources[saved]) return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const changeLanguage = useCallback((code) => {
    if (resources[code]) {
      setLanguageState(code);
      try {
        localStorage.setItem('orderwise_lang', code);
        localStorage.setItem('orderwise_chat_lang', code);
      } catch {
        // ignore
      }
    }
  }, []);

  // Translation function with interpolation support: t('customer.welcome', { name: 'Alice' })
  const t = useCallback(
    (key, params = {}) => {
      if (!key || typeof key !== 'string') return '';

      const keys = key.split('.');
      let current = resources[language];
      let fallback = resources.en;

      for (const k of keys) {
        current = current ? current[k] : undefined;
        fallback = fallback ? fallback[k] : undefined;
      }

      let text = current !== undefined ? current : fallback !== undefined ? fallback : key;

      if (typeof text === 'string' && Object.keys(params).length > 0) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          text = text.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramVal));
          text = text.replace(new RegExp(`%{\\s*${paramKey}\\s*}`, 'g'), String(paramVal));
        });
      }

      return text;
    },
    [language]
  );

  const formatNumber = useCallback(
    (num) => {
      try {
        const locale = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
        return new Intl.NumberFormat(locale).format(num);
      } catch {
        return String(num);
      }
    },
    [language]
  );

  const formatCurrency = useCallback(
    (amount, currency = 'USD') => {
      try {
        const locale = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
      } catch {
        return `$${Number(amount || 0).toFixed(2)}`;
      }
    },
    [language]
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        formatNumber,
        formatCurrency,
        languages: LANGUAGES,
        i18n: {
          language,
          changeLanguage,
        },
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Graceful fallback for non-provider components
    return {
      t: (k) => k,
      language: 'en',
      changeLanguage: () => {},
      languages: LANGUAGES,
      formatNumber: (n) => String(n),
      formatCurrency: (n) => `$${Number(n || 0).toFixed(2)}`,
      i18n: { language: 'en', changeLanguage: () => {} },
    };
  }
  return context;
}

export default I18nContext;

