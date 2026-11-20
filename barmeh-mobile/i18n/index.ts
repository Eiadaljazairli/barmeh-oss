import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from '../utils/storage';
import { I18nManager } from 'react-native';

import en from './en.json';
import ar from './ar.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const LANGUAGE_KEY = 'user-language';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

try {
  if (I18nManager.isRTL) {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
  }
} catch (e) {
  console.warn('Failed to reset RTL state', e);
}

export const loadSavedLanguage = async () => {
  try {
    const savedLang = await SecureStore.getItemAsync(LANGUAGE_KEY);
    const targetLang = savedLang || 'ar';

    if (targetLang !== i18n.language) {
      await i18n.changeLanguage(targetLang);
    }

    if (I18nManager.isRTL) {
      try {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
        const reloadedKey = 'rtl-undo-reloaded-once';
        const alreadyReloaded = await SecureStore.getItemAsync(reloadedKey);
        if (!alreadyReloaded) {
          await SecureStore.setItemAsync(reloadedKey, '1');
          try {
            const Updates = require('expo-updates');
            if (Updates && typeof Updates.reloadAsync === 'function' && !__DEV__) {
              await Updates.reloadAsync();
            }
          } catch {}
        }
      } catch {}
    }
  } catch (error) {
    console.warn('Failed to load language', error);
  }
};

export default i18n;
