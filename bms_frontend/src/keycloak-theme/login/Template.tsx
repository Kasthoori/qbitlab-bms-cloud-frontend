
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { ReactNode } from "react";
import type { KcContext } from "./KcContext";
import type { I18n } from "./i18n";

type ExtendedPageProps = PageProps<KcContext, I18n> & {
  children?: ReactNode;
  displayMessage?: boolean;
  displayInfo?: boolean;
  headerNode?: ReactNode;
};

export default function Template(
  props: ExtendedPageProps
) {
  const {
    children,
    kcContext,
    displayMessage,
    displayInfo,
    headerNode
  } = props;

  return (
    <div>
      {displayMessage && kcContext.message && (
        <div role="alert">
          {kcContext.message.summary}
        </div>
      )}

      {headerNode}

      {children}

      {displayInfo && kcContext.realm?.displayName && (
        <footer className="text-center text-xs text-gray-500 mt-6">
          {kcContext.realm.displayName}
        </footer>
      )}
    </div>
  );
}
