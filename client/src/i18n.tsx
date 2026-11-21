import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationEN from "@/locales/en";
import translationRU from "@/locales/ru";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: translationRU },
      en: { translation: translationEN },
    },
    fallbackLng: "en",
    lng: localStorage.getItem("lang") ?? "en",
    interpolation: { escapeValue: false }
  });

export default i18n;