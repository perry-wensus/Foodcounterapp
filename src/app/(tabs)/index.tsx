// Scan-tab: foto's kiezen -> herkennen -> lijst corrigeren -> bevestigen.
import { useEffect, useReducer, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { pantryReducer, toPantryItems } from "../../../supabase/functions/_shared/pantry";
import type { PantryItem } from "../../../supabase/functions/_shared/schemas";
import { Body, Button, colors, H1, Notice } from "../../components/ui";
import { IngredientEditor } from "../../features/scan/IngredientEditor";
import { PhotoPicker } from "../../features/scan/PhotoPicker";
import {
  confirmScan,
  loadLatestConfirmedScan,
  ScanError,
  uploadAndAnalyze,
  type LocalPhoto,
  type ScanErrorCode,
} from "../../features/scan/api";
import { t } from "../../i18n";

type Phase =
  | { kind: "pick" }
  | { kind: "busy"; step: "uploading" | "analyzing" }
  | { kind: "review"; scanId: string; detected: PantryItem[]; qualityNote: string | null }
  | { kind: "done"; count: number };

export default function ScanScreen() {
  const [phase, setPhase] = useState<Phase>({ kind: "pick" });
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [items, dispatch] = useReducer(pantryReducer, []);
  const [error, setError] = useState<ScanErrorCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [latest, setLatest] = useState<{ items: PantryItem[] } | null>(null);

  useEffect(() => {
    loadLatestConfirmedScan().then(setLatest).catch(() => setLatest(null));
  }, [phase.kind]);

  async function analyze() {
    setError(null);
    setPhase({ kind: "busy", step: "uploading" });
    try {
      const res = await uploadAndAnalyze(photos, (step) => setPhase({ kind: "busy", step }));
      const detected = toPantryItems(res.ingredients);
      dispatch({ type: "reset", items: detected });
      setPhotos([]); // lokale verwijzingen loslaten; de server heeft ze al verwijderd
      setPhase({ kind: "review", scanId: res.scan_id, detected, qualityNote: res.photo_quality_note });
    } catch (e) {
      setError(e instanceof ScanError ? e.code : "generic");
      setPhase({ kind: "pick" });
    }
  }

  async function confirm() {
    if (phase.kind !== "review") return;
    setSaving(true);
    setSaveError(false);
    try {
      await confirmScan(phase.scanId, phase.detected, items);
      setPhase({ kind: "done", count: items.length });
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function restart() {
    dispatch({ type: "reset", items: [] });
    setPhotos([]);
    setError(null);
    setPhase({ kind: "pick" });
  }

  if (phase.kind === "busy") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Body>{phase.step === "uploading" ? t("scan.uploading") : t("scan.analyzing")}</Body>
        {phase.step === "analyzing" && <Body muted>{t("scan.analyzingHint")}</Body>}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      {phase.kind === "pick" && (
        <>
          <H1>{t("scan.title")}</H1>
          <Body muted>{t("scan.intro")}</Body>
          {error && <Notice>{t(`scan.errors.${error}`)}</Notice>}
          <PhotoPicker photos={photos} onChange={setPhotos} />
          <Button title={t("scan.analyze")} onPress={analyze} disabled={photos.length === 0} />
          <Body muted>{t("scan.privacyNote")}</Body>
          {latest && latest.items.length > 0 && (
            <View style={{ marginTop: 16, gap: 4 }}>
              <Body>{t("done.lastScan")}</Body>
              <Body muted>{latest.items.map((i) => i.name).join(", ")}</Body>
            </View>
          )}
        </>
      )}

      {phase.kind === "review" && (
        <>
          <H1>{t("review.title")}</H1>
          <Body muted>{t("review.intro")}</Body>
          {phase.qualityNote && <Notice>{phase.qualityNote}</Notice>}
          {items.some((i) => !i.confident) && <Notice>{t("review.uncertainHint")}</Notice>}
          {items.length === 0 && <Notice>{t("review.empty")}</Notice>}
          <Body muted>{t("review.itemCount", { count: items.length })}</Body>
          <IngredientEditor items={items} dispatch={dispatch} />
          {saveError && <Notice>{t("review.saveError")}</Notice>}
          <Button title={t("review.confirm")} onPress={confirm} loading={saving} disabled={items.length === 0} />
          <Button variant="secondary" title={t("review.rescan")} onPress={restart} />
        </>
      )}

      {phase.kind === "done" && (
        <>
          <H1>{t("done.title")}</H1>
          <Body>{t("done.body", { count: phase.count })}</Body>
          <Button variant="secondary" title={t("done.newScan")} onPress={restart} />
        </>
      )}
    </ScrollView>
  );
}
