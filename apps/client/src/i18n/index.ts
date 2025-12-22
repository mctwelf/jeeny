/**
 * i18n Configuration for GoCap Client App
 * Supports Arabic (RTL), French, and English
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import en from './locales/en.json';

// Storage key for persisted language
const LANGUAGE_STORAGE_KEY = '@gocap/language';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  ar: {
    code: 'ar',
    name: 'العربية',
    englishName: 'Arabic',
    isRTL: true,
    flag: '🇲🇷',
  },
  fr: {
    code: 'fr',
    name: 'Français',
    englishName: 'French',
    isRTL: false,
    flag: '🇫🇷',
  },
  en: {
    code: 'en',
    name: 'English',
    englishName: 'English',
    isRTL: false,
    flag: '🇺🇸',
  },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Default language is Arabic
export const DEFAULT_LANGUAGE: LanguageCode = 'ar';

// Resources for i18next
const resources = {
  ar: { translation: ar },
  fr: { translation: fr },
  en: { translation: en },
};

/**
 * Get the stored language from AsyncStorage
 */
export const getStoredLanguage = async (): Promise<LanguageCode | null> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage && storedLanguage in SUPPORTED_LANGUAGES) {
      return storedLanguage as LanguageCode;
    }
    return null;
  } catch (error) {
    console.error('Error getting stored language:', error);
    return null;
  }
};

/**
 * Store the selected language to AsyncStorage
 */
export const setStoredLanguage = async (language: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error storing language:', error);
  }
};

/**
 * Get the device's preferred language
 */
export const getDeviceLanguage = (): LanguageCode => {
  const deviceLocale = Localization.locale;
  const languageCode = deviceLocale.split('-')[0];

  // Check if the device language is supported
  if (languageCode in SUPPORTED_LANGUAGES) {
    return languageCode as LanguageCode;
  }

  // Default to Arabic if device language is not supported
  return DEFAULT_LANGUAGE;
};

/**
 * Check if the current language is RTL
 */
export const isRTL = (languageCode?: LanguageCode): boolean => {
  const code = languageCode || (i18n.language as LanguageCode);
  return SUPPORTED_LANGUAGES[code]?.isRTL || false;
};

/**
 * Apply RTL/LTR layout based on language
 */
export const applyRTL = (languageCode: LanguageCode): void => {
  const shouldBeRTL = SUPPORTED_LANGUAGES[languageCode].isRTL;
  const currentRTL = I18nManager.isRTL;

  if (shouldBeRTL !== currentRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);

    // Note: On Android, forceRTL requires app restart to take effect
    // You may need to handle this in your app's main component
  }
};

/**
 * Change the app language
 * @param languageCode - The language code to change to
 * @param persist - Whether to persist the language choice
 */
export const changeLanguage = async (
  languageCode: LanguageCode,
  persist: boolean = true
): Promise<void> => {
  if (!(languageCode in SUPPORTED_LANGUAGES)) {
    console.error(`Language ${languageCode} is not supported`);
    return;
  }

  // Change i18n language
  await i18n.changeLanguage(languageCode);

  // Apply RTL settings
  applyRTL(languageCode);

  // Persist the language choice
  if (persist) {
    await setStoredLanguage(languageCode);
  }
};

/**
 * Get the current language
 */
export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language as LanguageCode) || DEFAULT_LANGUAGE;
};

/**
 * Get the current language info
 */
export const getCurrentLanguageInfo = () => {
  const code = getCurrentLanguage();
  return SUPPORTED_LANGUAGES[code];
};

/**
 * Get all supported languages as an array
 */
export const getSupportedLanguagesArray = () => {
  return Object.values(SUPPORTED_LANGUAGES);
};

/**
 * Initialize i18n
 * Should be called at app startup
 */
export const initializeI18n = async (): Promise<void> => {
  // Get stored language or use device language
  let initialLanguage = await getStoredLanguage();

  if (!initialLanguage) {
    initialLanguage = getDeviceLanguage();
  }

  // Apply RTL settings before i18n initialization
  applyRTL(initialLanguage);

  // Initialize i18next
  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    compatibilityJSON: 'v3',

    interpolation: {
      escapeValue: false, // React Native already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for React Native
    },

    // Debugging (disable in production)
    debug: __DEV__,

    // Return key if translation is missing
    returnEmptyString: false,
    returnNull: false,

    // Key separator for nested translations
    keySeparator: '.',

    // Namespace separator
    nsSeparator: ':',

    // Default namespace
    defaultNS: 'translation',
  });
};

/**
 * Hook to check if i18n needs a restart (for RTL changes on Android)
 */
export const needsRestart = (newLanguage: LanguageCode): boolean => {
  if (Platform.OS !== 'android') {
    return false;
  }

  const currentRTL = I18nManager.isRTL;
  const newRTL = SUPPORTED_LANGUAGES[newLanguage].isRTL;

  return currentRTL !== newRTL;
};

// Export the i18n instance
export default i18n;

// Re-export useTranslation hook for convenience
export { useTranslation } from 'react-i18next';

// Type for translation keys (useful for type-safe translations)
export type TranslationKeys = keyof typeof ar;
