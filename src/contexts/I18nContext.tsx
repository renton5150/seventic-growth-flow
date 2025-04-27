
import React, { createContext, useState, useContext, ReactNode } from 'react';

type LanguageType = 'fr' | 'en';

interface I18nContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Translations simplifiées pour démonstration
const translations = {
  fr: {
    'app.title': 'Application Seventic',
    'dashboard.title': 'Tableau de bord',
    'login.submit': 'Se connecter',
    'register.submit': 'S\'inscrire',
    // Ajoutez d'autres traductions au besoin
  },
  en: {
    'app.title': 'Seventic App',
    'dashboard.title': 'Dashboard',
    'login.submit': 'Login',
    'register.submit': 'Register',
    // Ajoutez d'autres traductions au besoin
  }
};

export const I18nProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageType>('fr');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
