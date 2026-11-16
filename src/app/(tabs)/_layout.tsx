import { Link, Tabs } from "expo-router";
import { Pressable, Text, type ColorValue } from "react-native";
import { colors } from "../../components/ui";
import { t } from "../../i18n";

// Eenvoudige tekstsymbolen als tab-iconen (geen extra icon-dependency in het prototype).
function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 18, color }}>{glyph}</Text>;
}

function AccountButton() {
  return (
    <Link href="/account" asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={t("account.title")} style={{ paddingHorizontal: 16 }}>
        <Text style={{ color: colors.primary, fontSize: 16 }}>{t("account.title")}</Text>
      </Pressable>
    </Link>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerRight: () => <AccountButton />,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.scan"), tabBarIcon: ({ color }) => <TabIcon glyph="◎" color={color} /> }}
      />
      <Tabs.Screen
        name="recipes"
        options={{ title: t("tabs.recipes"), tabBarIcon: ({ color }) => <TabIcon glyph="☰" color={color} /> }}
      />
      <Tabs.Screen
        name="week"
        options={{ title: t("tabs.week"), tabBarIcon: ({ color }) => <TabIcon glyph="▦" color={color} /> }}
      />
      <Tabs.Screen
        name="shopping"
        options={{ title: t("tabs.shopping"), tabBarIcon: ({ color }) => <TabIcon glyph="✓" color={color} /> }}
      />
    </Tabs>
  );
}
