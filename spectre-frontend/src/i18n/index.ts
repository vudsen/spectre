import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh_CN from './zh-CN/translation.json'
import en from './en/translation.json'

const resources = {
  'zh-CN': {
    translation: zh_CN,
  },
  en: {
    translation: en,
  },
}

export const LANGUAGE_CACHE_KEY = 'locale'

let lng: string
const cachedLng = localStorage.getItem(LANGUAGE_CACHE_KEY)
if (cachedLng) {
  lng = cachedLng
} else {
  lng = navigator.language
}
console.log(resources)
console.log(lng)
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng, // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option
    fallbackLng: {
      zh: ['zh-CN'],
      default: ['en'],
    },
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })

export default i18n
