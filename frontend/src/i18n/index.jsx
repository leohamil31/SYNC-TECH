import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en';
import ptBR from './pt-BR';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', messages: en },
  { code: 'pt-BR', label: 'Português (BR)', short: 'PT', messages: ptBR },
];

const STORAGE_KEY = 'course-manager-language';

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const detectLanguage = () => {
  const stored = readStored();
  if (LANGUAGES.some((l) => l.code === stored)) return stored;
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
};

const lookup = (messages, key) => key.split('.').reduce((node, part) => node?.[part], messages);

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(detectLanguage);

  const setLanguage = useCallback((code) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Preference just won't persist.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => {
    const { messages } = LANGUAGES.find((l) => l.code === language);

    /** t('actions.new', { entity: 'course' }) -> "New course". Falls back to English, then to the key. */
    const t = (key, params = {}) => {
      const template = lookup(messages, key) ?? lookup(en, key) ?? key;
      return String(template).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`);
    };

    const formatDate = (value) =>
      value ? new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

    /** Translates messages returned by the API (which is always in English). */
    const apiMessage = (message = '') => {
      const patterns = [
        [/expected string to have >=(\d+)/, (m) => t('errors.min', { n: m[1] })],
        [/expected string to have <=(\d+)/, (m) => t('errors.max', { n: m[1] })],
        [/Invalid email/, () => t('errors.email')],
        [/expected (number|string|positive)|received (undefined|null|NaN)|Invalid input/, () => t('errors.required')],
        [/^Validation failed/, () => t('errors.validation')],
        [/same unique value/, () => t('errors.unique')],
        [/cannot be removed/, () => t('errors.referenced')],
        [/referenced record does not exist/, () => t('errors.missingRef')],
        [/not found/i, () => t('errors.notFound')],
        [/Failed to fetch|NetworkError/, () => t('errors.network')],
      ];
      for (const [regex, translate] of patterns) {
        const match = message.match(regex);
        if (match) return translate(match);
      }
      return message;
    };

    return { language, setLanguage, t, formatDate, apiMessage };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
