import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  resources: {
    en: {
      translation: {
        appName: "relay",
        titleHomePage: "Home Page",
        titleSecondPage: "Second Page",
        documentation: "Documentation",
        madeBy: "Made by LuanRoger",
      },
    },
    "pt-BR": {
      translation: {
        appName: "relay",
        titleHomePage: "Página Inicial",
        titleSecondPage: "Segunda Página",
        documentation: "Documentação",
        madeBy: "Feito por LuanRoger",
      },
    },
  },
});
