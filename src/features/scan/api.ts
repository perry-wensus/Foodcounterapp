// Scan-API: foto's verkleinen, uploaden naar privé-bucket, analyse aanroepen, bevestigde lijst opslaan.
import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  AnalyzeResponseSchema,
  MAX_PHOTOS_PER_SCAN,
  type AnalyzeResponse,
  type PantryItem,
} from "../../../supabase/functions/_shared/schemas";
import { diffCorrections } from "../../../supabase/functions/_shared/pantry";
import { supabase } from "../../lib/supabase";

const BUCKET = "scan-photos";
/** Lange zijde in px. Groter levert de vision-analyse niets op en kost uploadtijd. */
const MAX_EDGE = 1568;

export type LocalPhoto = { uri: string; width: number; height: number };

export type ScanErrorCode =
  | "ai_unavailable"
  | "ai_unreadable"
  | "too_many_photos"
  | "no_photos"
  | "network"
  | "generic";

export class ScanError extends Error {
  constructor(public code: ScanErrorCode) {
    super(code);
  }
}

/** Verkleint en hercomprimeert naar JPEG; verwijdert daarbij ook EXIF (o.a. locatie). */
async function preparePhoto(photo: LocalPhoto): Promise<string> {
  const ctx = ImageManipulator.manipulate(photo.uri);
  const longEdge = Math.max(photo.width, photo.height);
  if (longEdge > MAX_EDGE) {
    ctx.resize(photo.width >= photo.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await ctx.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return result.uri;
}

export async function uploadAndAnalyze(
  photos: LocalPhoto[],
  onPhase: (phase: "uploading" | "analyzing") => void,
): Promise<AnalyzeResponse> {
  if (photos.length === 0) throw new ScanError("no_photos");
  if (photos.length > MAX_PHOTOS_PER_SCAN) throw new ScanError("too_many_photos");

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new ScanError("generic");

  onPhase("uploading");
  const { data: scan, error: scanError } = await supabase.from("scans").insert({}).select("id").single();
  if (scanError || !scan) throw new ScanError("network");

  const paths: string[] = [];
  try {
    await Promise.all(
      photos.map(async (photo, i) => {
        const uri = await preparePhoto(photo);
        const bytes = await new File(uri).arrayBuffer();
        const path = `${userId}/${scan.id}/${i}.jpg`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: "image/jpeg" });
        if (error) throw error;
        paths.push(path);
      }),
    );
  } catch {
    // Halve upload opruimen: geen foto's laten slingeren.
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from("scans").update({ status: "failed", error: "upload" }).eq("id", scan.id);
    throw new ScanError("network");
  }

  paths.sort();
  const { error: updError } = await supabase.from("scans").update({ photo_paths: paths }).eq("id", scan.id);
  if (updError) throw new ScanError("network");

  onPhase("analyzing");
  const { data, error } = await supabase.functions.invoke("analyze-pantry", { body: { scan_id: scan.id } });
  if (error) throw await toScanError(error);

  const parsed = AnalyzeResponseSchema.safeParse(data);
  if (!parsed.success) throw new ScanError("generic");
  return parsed.data;
}

async function toScanError(error: unknown): Promise<ScanError> {
  if (error instanceof FunctionsFetchError) return new ScanError("network");
  if (error instanceof FunctionsHttpError) {
    const body = await (error.context as Response).json().catch(() => null);
    const code = body?.error;
    if (code === "ai_unavailable" || code === "ai_unreadable" || code === "too_many_photos" || code === "no_photos") {
      return new ScanError(code);
    }
  }
  return new ScanError("generic");
}

/** Slaat de door de gebruiker gecorrigeerde lijst op, met een samenvatting van de correcties. */
export async function confirmScan(scanId: string, detected: PantryItem[], items: PantryItem[]) {
  const { error } = await supabase
    .from("scans")
    .update({ status: "confirmed", items, corrections: diffCorrections(detected, items) })
    .eq("id", scanId);
  if (error) throw new ScanError("network");
}

export async function loadLatestConfirmedScan(): Promise<{ id: string; items: PantryItem[]; created_at: string } | null> {
  const { data } = await supabase
    .from("scans")
    .select("id, items, created_at")
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { id: data.id, items: (data.items ?? []) as PantryItem[], created_at: data.created_at } : null;
}
