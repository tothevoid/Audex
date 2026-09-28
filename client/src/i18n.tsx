import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationEN from "@/locales/en";
import translationRU from "@/locales/ru";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "en-US": { translation: translationEN },
      "ru-RU": { translation: translationRU },
    },
    fallbackLng: "en-US",
    lng: localStorage.getItem("lang") ?? "en-US",
    interpolation: { escapeValue: false }
  });

export default i18n;