import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Button, colors, H1, Notice } from "../components/ui";
import { t } from "../i18n";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    if (mode === "signIn") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setMessage(t("auth.error"));
    } else {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) setMessage(t("auth.signUpError"));
      else if (!data.session) setMessage(t("auth.checkEmail"));
    }
    setBusy(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
        <H1>{t("common.appName")}</H1>
        <Body muted>{t("auth.intro")}</Body>
        <TextInput
          style={styles.input}
          placeholder={t("auth.email")}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel={t("auth.email")}
        />
        <TextInput
          style={styles.input}
          placeholder={t("auth.password")}
          secureTextEntry
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          value={password}
          onChangeText={setPassword}
          accessibilityLabel={t("auth.password")}
        />
        {message && <Notice>{message}</Notice>}
        <Button
          title={mode === "signIn" ? t("auth.signIn") : t("auth.signUp")}
          onPress={submit}
          loading={busy}
          disabled={!email.includes("@") || password.length < 8}
        />
        <Button
          variant="secondary"
          title={mode === "signIn" ? t("auth.switchToSignUp") : t("auth.switchToSignIn")}
          onPress={() => {
            setMode(mode === "signIn" ? "signUp" : "signIn");
            setMessage(null);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, justifyContent: "center" },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
});
