import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { Body, Button, colors, Notice } from "../components/ui";
import { t } from "../i18n";
import { CONSENT_VERSION, useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

// Expliciete toestemming (AVG art. 9) vóór er foto's of eetgegevens verwerkt worden.
export default function Consent() {
  const { session, refreshProfile } = useAuth();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function accept() {
    if (!session) return;
    setBusy(true);
    setError(false);
    const { error: err } = await supabase
      .from("profiles")
      .update({ consent_at: new Date().toISOString(), consent_version: CONSENT_VERSION })
      .eq("id", session.user.id);
    if (err) setError(true);
    else await refreshProfile();
    setBusy(false);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Body>{t("consent.body")}</Body>
      <Link href="/privacy" asChild>
        <Pressable accessibilityRole="link">
          <Text style={{ color: colors.primary, fontSize: 16, textDecorationLine: "underline" }}>
            {t("consent.readPolicy")}
          </Text>
        </Pressable>
      </Link>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Switch value={checked} onValueChange={setChecked} accessibilityLabel={t("consent.checkbox")} />
        <View style={{ flex: 1 }}>
          <Body>{t("consent.checkbox")}</Body>
        </View>
      </View>
      {error && <Notice>{t("scan.errors.generic")}</Notice>}
      <Button title={t("consent.accept")} onPress={accept} disabled={!checked} loading={busy} />
    </ScrollView>
  );
}
