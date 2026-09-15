"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SUPPORTED_LANGUAGES, translations } from './translations';

const STORAGE_KEY = 'idioma';
const LanguageContext = createContext(null);

function normalizeLanguage(raw) {
  if (!raw || typeof raw !== 'string') return 'es';
  const base = raw.toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : 'es';
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
    setLanguage(saved);
    document.documentElement.setAttribute('lang', saved);

    const onStorage = () => {
      const next = normalizeLanguage(localStorage.getItem(STORAGE_KEY));
      setLanguage(next);
      document.documentElement.setAttribute('lang', next);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('idiomaChange', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('idiomaChange', onStorage);
    };
  }, []);

  const setLang = (nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage);
    setLanguage(normalized);
    localStorage.setItem(STORAGE_KEY, normalized);
    document.documentElement.setAttribute('lang', normalized);
    window.dispatchEvent(new Event('idiomaChange'));
  };

  const toggleLanguage = () => {
    setLang(language === 'es' ? 'en' : 'es');
  };

  const t = (key, fallback = '') => {
    const value = getByPath(translations[language], key);
    if (value !== undefined) return value;
    const esValue = getByPath(translations.es, key);
    if (esValue !== undefined) return esValue;
    return fallback || key;
  };

  const value = useMemo(() => ({ language, setLanguage: setLang, toggleLanguage, t }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }
  return context;
}
