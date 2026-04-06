import { i18nBuilder } from "keycloakify/login";

const { useI18n, ofTypeI18n } = i18nBuilder
    .withCustomTranslations({
        en: {
        loginTitle: "Sign in",
        doLogIn: "Sign in",
        noAccount: "Don’t have an account?"
        }
    })
    .build();

    type I18n = typeof ofTypeI18n;
    export { useI18n, type I18n };