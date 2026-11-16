import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../components/ui";
import { t } from "../i18n";
import { AuthProvider, useAuth } from "../lib/auth";

function RootStack() {
  const { ready, session, hasConsent } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg }, headerBackTitle: t("common.back") }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !hasConsent}>
        <Stack.Screen name="consent" options={{ title: t("consent.title"), headerBackVisible: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session && hasConsent}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="account" options={{ title: t("account.title") }} />
      </Stack.Protected>
      <Stack.Screen name="privacy" options={{ title: t("privacy.title") }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootStack />
    </AuthProvider>
  );
}
