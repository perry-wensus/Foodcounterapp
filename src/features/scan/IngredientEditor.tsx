// Bewerkbare ingrediëntenlijst, gegroepeerd per categorie.
import { useState, type Dispatch } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  AMOUNTS,
  CATEGORIES,
  type Amount,
  type Category,
  type PantryItem,
} from "../../../supabase/functions/_shared/schemas";
import type { PantryAction } from "../../../supabase/functions/_shared/pantry";
import { Body, Button, Chip, colors } from "../../components/ui";
import { t } from "../../i18n";

type Props = { items: PantryItem[]; dispatch: Dispatch<PantryAction> };

export function IngredientEditor({ items, dispatch }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <View style={{ gap: 16 }}>
      {CATEGORIES.map((cat) => {
        const inCat = items.filter((i) => i.category === cat);
        if (inCat.length === 0) return null;
        return (
          <View key={cat} style={{ gap: 6 }}>
            <Text style={styles.catTitle}>{t(`categories.${cat}`)}</Text>
            {inCat.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.row}>
                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => setExpanded(expanded === item.id ? null : item.id)}
                    accessibilityRole="button"
                    accessibilityHint={t("review.category")}
                  >
                    <Text style={styles.name}>
                      {item.name}
                      {!item.confident && <Text style={styles.uncertain}>  {t("review.uncertain")}</Text>}
                    </Text>
                    <Text style={styles.meta}>{t(`amounts.${item.amount}`)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => dispatch({ type: "remove", id: item.id })}
                    accessibilityRole="button"
                    accessibilityLabel={`${t("common.delete")}: ${item.name}`}
                    hitSlop={10}
                    style={styles.removeBtn}
                  >
                    <Text style={{ fontSize: 18, color: colors.muted }}>×</Text>
                  </Pressable>
                </View>
                {expanded === item.id && (
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <ChipRow
                      label={t("review.amount")}
                      options={AMOUNTS}
                      value={item.amount}
                      render={(a) => t(`amounts.${a}`)}
                      onSelect={(amount) => dispatch({ type: "setAmount", id: item.id, amount })}
                    />
                    <ChipRow
                      label={t("review.category")}
                      options={CATEGORIES}
                      value={item.category}
                      render={(c) => t(`categories.${c}`)}
                      onSelect={(category) => dispatch({ type: "setCategory", id: item.id, category })}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      })}
      <AddIngredient onAdd={(name, category, amount) => dispatch({ type: "add", name, category, amount })} />
    </View>
  );
}

function ChipRow<T extends string>(props: {
  label: string;
  options: readonly T[];
  value: T;
  render: (v: T) => string;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.meta}>{props.label}</Text>
      <View style={styles.chips}>
        {props.options.map((o) => (
          <Chip key={o} label={props.render(o)} selected={o === props.value} onPress={() => props.onSelect(o)} />
        ))}
      </View>
    </View>
  );
}

function AddIngredient({ onAdd }: { onAdd: (name: string, category: Category, amount: Amount) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("vegetables");
  const [amount, setAmount] = useState<Amount>("some");

  return (
    <View style={[styles.card, { gap: 8 }]}>
      <Body>{t("review.addTitle")}</Body>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t("review.addPlaceholder")}
        style={styles.input}
        accessibilityLabel={t("review.addTitle")}
        returnKeyType="done"
      />
      <ChipRow label={t("review.category")} options={CATEGORIES} value={category} render={(c) => t(`categories.${c}`)} onSelect={setCategory} />
      <ChipRow label={t("review.amount")} options={AMOUNTS} value={amount} render={(a) => t(`amounts.${a}`)} onSelect={setAmount} />
      <Button
        variant="secondary"
        title={t("review.add")}
        disabled={!name.trim()}
        onPress={() => {
          onAdd(name, category, amount);
          setName("");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  catTitle: { fontSize: 14, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 16, color: colors.text },
  uncertain: { fontSize: 13, color: colors.warnText },
  meta: { fontSize: 13, color: colors.muted },
  removeBtn: { padding: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 16 },
});
