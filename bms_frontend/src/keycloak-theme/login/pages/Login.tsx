import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "keycloakify/login/KcContext";
import type { I18n } from "keycloakify/login/i18n";

export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
  const { kcContext, doUseDefaultCss } = props;
  const { url, messagesPerField } = kcContext;

  // We use our Tailwind, not Keycloak CSS
  if (doUseDefaultCss) {
    // noop
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="font-bold">Q</span>
          </div>
          <div>
            <div className="text-lg font-semibold">QbitLab BMS</div>
            <div className="text-sm text-white/60">Sign in to continue</div>
          </div>
        </div>

        {messagesPerField.existsError("username", "password") && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            {messagesPerField.getFirstError("username", "password")}
          </div>
        )}

        <form action={url.loginAction} method="post" className="space-y-4">
          <div>
            <label className="text-sm text-white/70">Username or email</label>
            <input
              name="username"
              defaultValue={kcContext.login.username ?? ""}
              className="mt-1 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Password</label>
            <input
              type="password"
              name="password"
              className="mt-1 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-white text-slate-950 font-semibold py-2 hover:bg-white/90 transition"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-xs text-white/50">
          © {new Date().getFullYear()} QbitLab. All rights reserved.
        </div>
      </div>
    </div>
  );
}
