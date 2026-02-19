// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEN from './locales/en.json';
import translationJA from './locales/ja.json';

const resources = {
  ja: { translation: translationJA },
  en: { translation: translationEN }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // 検知の優先順位を「ブラウザ設定」第一にする
    detection: {
      order: ['navigator', 'localStorage', 'cookie', 'htmlTag'],
      // 言語を検知したら localStorage に保存して次回も使う設定
      caches: ['localStorage']
    },
    fallbackLng: 'ja', // 判定不能な時は日本語
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;