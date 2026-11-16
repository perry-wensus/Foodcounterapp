import { ScrollView } from "react-native";
import { Body } from "../components/ui";
import { t } from "../i18n";

export default function Privacy() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Body>{t("privacy.body")}</Body>
    </ScrollView>
  );
}
