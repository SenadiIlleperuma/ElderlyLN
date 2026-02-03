import i18n, { LanguageDetectorAsyncModule } from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./en.json";
import si from "./si.json";
import ta from "./ta.json";

const STORAGE_KEY = "app_language";

const languageDetector: LanguageDetectorAsyncModule = {
  type: "languageDetector",
  async: true,
  detect: (callback) => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => callback(saved || "en"))
      .catch(() => callback("en"));
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    await AsyncStorage.setItem(STORAGE_KEY, lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    resources: {
      en: { translation: en },
      si: { translation: si },
      ta: { translation: ta },
    },
    lng: "en",
    fallbackLng: "en",
    defaultNS: "translation",
    returnNull: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export const changeLanguage = async (lng: "en" | "si" | "ta") => {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(STORAGE_KEY, lng);
};

export default i18n;
