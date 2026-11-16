import { Body, Screen } from "../../components/ui";
import { t } from "../../i18n";

// Placeholder: wordt in een volgende stap gebouwd.
export default function Placeholder() {
  return (
    <Screen>
      <Body>{t("placeholders.week")}</Body>
      <Body muted>{t("common.comingSoon")}</Body>
    </Screen>
  );
}
