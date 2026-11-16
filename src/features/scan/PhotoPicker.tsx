import * as ImagePicker from "expo-image-picker";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MAX_PHOTOS_PER_SCAN } from "../../../supabase/functions/_shared/schemas";
import { Body, Button, colors, Notice } from "../../components/ui";
import { t } from "../../i18n";
import type { LocalPhoto } from "./api";
import { useState } from "react";

type Props = { photos: LocalPhoto[]; onChange: (photos: LocalPhoto[]) => void };

export function PhotoPicker({ photos, onChange }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const remaining = MAX_PHOTOS_PER_SCAN - photos.length;

  function addAssets(assets: ImagePicker.ImagePickerAsset[]) {
    const next = [...photos, ...assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }))];
    if (next.length > MAX_PHOTOS_PER_SCAN) setNotice(t("scan.maxReached", { max: MAX_PHOTOS_PER_SCAN }));
    onChange(next.slice(0, MAX_PHOTOS_PER_SCAN));
  }

  async function takePhoto() {
    setNotice(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return setNotice(t("scan.cameraDenied"));
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, exif: false });
    if (!res.canceled) addAssets(res.assets);
  }

  async function pickPhotos() {
    setNotice(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setNotice(t("scan.libraryDenied"));
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
      exif: false,
    });
    if (!res.canceled) addAssets(res.assets);
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.grid}>
        {photos.map((p, i) => (
          <View key={p.uri + i} style={styles.thumbWrap}>
            <Image source={{ uri: p.uri }} style={styles.thumb} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("scan.removePhoto")}
              onPress={() => onChange(photos.filter((_, j) => j !== i))}
              style={styles.remove}
              hitSlop={8}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <Body muted>{t("scan.photosCount", { count: photos.length, max: MAX_PHOTOS_PER_SCAN })}</Body>
      {notice && <Notice>{notice}</Notice>}
      <Button title={t("scan.takePhoto")} onPress={takePhoto} disabled={remaining <= 0} variant={photos.length ? "secondary" : "primary"} />
      <Button title={t("scan.pickPhoto")} onPress={pickPhotos} disabled={remaining <= 0} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumbWrap: { width: 100, height: 100 },
  thumb: { width: 100, height: 100, borderRadius: 8, backgroundColor: colors.border },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
