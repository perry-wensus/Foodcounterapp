import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { Body, Button, H1, Notice, Screen } from "../components/ui";
import { t } from "../i18n";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

export default function Account() {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function deleteAccount() {
    setBusy(true);
    setError(false);
    const { error: err } = await supabase.functions.invoke("delete-account", { method: "POST" });
    if (err) {
      setError(true);
      setBusy(false);
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
  }

  function confirmDelete() {
    Alert.alert(t("account.deleteTitle"), t("account.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("account.deleteConfirm"), style: "destructive", onPress: deleteAccount },
    ]);
  }

  return (
    <Screen>
      <Body muted>{t("account.signedInAs", { email: session?.user.email ?? "" })}</Body>
      <Button variant="secondary" title={t("account.privacy")} onPress={() => router.push("/privacy")} />
      <Button variant="secondary" title={t("account.signOut")} onPress={() => supabase.auth.signOut()} />
      <H1>{t("account.deleteTitle")}</H1>
      <Body muted>{t("account.deleteBody")}</Body>
      {error && <Notice>{t("account.deleteError")}</Notice>}
      <Button variant="danger" title={t("account.deleteConfirm")} onPress={confirmDelete} loading={busy} />
    </Screen>
  );
}
