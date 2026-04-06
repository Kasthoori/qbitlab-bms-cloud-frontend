// src/keycloak-theme/login/pages/Login.tsx


import clsx from "clsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

/**
 * Narrow the union KcContext type to the "login.ftl" page context.
 * This removes TS errors like:
 * - Property 'social' does not exist on type 'KcContext'
 * - Property 'login' does not exist on type 'KcContext'
 */
type KcContext_Login = Extract<KcContext, { pageId: "login.ftl" }>;

export default function Login(props: PageProps<KcContext_Login, I18n>) {
  const { kcContext, i18n, Template } = props;
  const { msg, msgStr } = i18n;

  // Safety: This component is only valid for the login page.
  if (kcContext.pageId !== "login.ftl") {
    return null;
  }

  const {
    url,
    realm,
    social,
    message,
    login,
    auth,
    usernameHidden,
    registrationDisabled
  } = kcContext;

  const showResetPassword = realm?.resetPasswordAllowed === true;
  const showRememberMe = realm?.rememberMe === true;
  const showRegistration =
    realm?.registrationAllowed === true && registrationDisabled !== true;

  const hasError = message?.type === "error";
  const hasMessage = !!message?.summary;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      headerNode={null}
      displayInfo={false}
      displayMessage={false}
      doUseDefaultCss={false}
    >
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <span className="text-lg font-semibold">BMS</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {msgStr("loginTitle") || "Sign in"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {realm?.displayName
                ? `Continue to ${realm.displayName}`
                : "Use your account to continue."}
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 shadow-xl">
            <div className="p-6">
              {/* Message / Error */}
              {hasMessage && (
                <div
                  className={clsx(
                    "mb-4 rounded-xl border px-4 py-3 text-sm",
                    hasError
                      ? "border-red-900/60 bg-red-950/40 text-red-200"
                      : "border-slate-800 bg-slate-950/40 text-slate-200"
                  )}
                  role={hasError ? "alert" : "status"}
                >
                  {message?.summary}
                </div>
              )}

              {/* Social providers */}
              {social?.providers?.length ? (
                <div className="mb-4">
                  <div className="grid grid-cols-1 gap-2">
                    {social.providers.map(p => (
                      <a
                        key={p.providerId}
                        href={p.loginUrl}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-sm font-medium hover:bg-slate-950/70 transition"
                      >
                        {p.displayName}
                      </a>
                    ))}
                  </div>

                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-800" />
                    <span className="text-xs text-slate-500">or</span>
                    <div className="h-px flex-1 bg-slate-800" />
                  </div>
                </div>
              ) : null}

              {/* Login form */}
              <form className="space-y-4" action={url.loginAction} method="post">
                {!usernameHidden && (
                  <div>
                    <label
                      className="block text-sm font-medium text-slate-200"
                      htmlFor="username"
                    >
                      {msg("username")}
                    </label>

                    <input
                      className={clsx(
                        "mt-1 w-full rounded-xl border bg-slate-950/40 px-3 py-2.5 text-sm outline-none transition",
                        "placeholder:text-slate-600",
                        hasError
                          ? "border-red-900/60 focus:border-red-700"
                          : "border-slate-800 focus:border-slate-600"
                      )}
                      id="username"
                      name="username"
                      defaultValue={login?.username ?? ""}
                      type="text"
                      autoComplete="username"
                      autoFocus
                      aria-invalid={hasError ? true : undefined}
                    />
                  </div>
                )}

                <div>
                  <label
                    className="block text-sm font-medium text-slate-200"
                    htmlFor="password"
                  >
                    {msg("password")}
                  </label>

                  <input
                    className={clsx(
                      "mt-1 w-full rounded-xl border bg-slate-950/40 px-3 py-2.5 text-sm outline-none transition",
                      "placeholder:text-slate-600",
                      hasError
                        ? "border-red-900/60 focus:border-red-700"
                        : "border-slate-800 focus:border-slate-600"
                    )}
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                  />
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  {showRememberMe && (
                    <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                      <input
                        id="rememberMe"
                        name="rememberMe"
                        type="checkbox"
                        defaultChecked={login?.rememberMe === "on"}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950/40"
                      />
                      {msg("rememberMe")}
                    </label>
                  )}

                  {showResetPassword && (
                    <a
                      className="text-sm text-slate-300 hover:text-white transition"
                      href={url.loginResetCredentialsUrl}
                    >
                      {msg("doForgotPassword")}
                    </a>
                  )}
                </div>

                {/* Submit */}
                <button
                  className="w-full rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-white transition disabled:opacity-60"
                  type="submit"
                  name="login"
                  value="true"
                >
                  {msgStr("doLogIn") || "Sign in"}
                </button>

                {/* Register link */}
                {showRegistration && (
                  <p className="pt-2 text-center text-sm text-slate-400">
                    {msgStr("noAccount") || "Don’t have an account?"}{" "}
                    <a
                      className="text-slate-200 hover:text-white underline underline-offset-4"
                      href={url.registrationUrl}
                    >
                      {msgStr("doRegister") || "Create one"}
                    </a>
                  </p>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>
                  {realm?.displayNameHtml ? realm.displayNameHtml : "Keycloak"}
                </span>
                {auth?.showUsername && (
                  <span className="truncate max-w-50 text-slate-400">
                    {auth.attemptedUsername}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Small legal/help */}
          <p className="mt-6 text-center text-xs text-slate-600">
            Protected by your organization’s identity provider.
          </p>
        </div>
      </div>
    </Template>
  );
}
