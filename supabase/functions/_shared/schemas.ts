// Gedeelde zod-schema's: gebruikt door zowel de app (Metro) als de Edge Functions (Deno).
// Alleen pure TypeScript + zod importeren, zodat beide runtimes dit bestand kunnen laden.
import { z } from "zod";

/** Eetcategorieën. Sleutels zijn stabiel (opslag); labels staan in i18n. */
export const CATEGORIES = [
  "vegetables",
  "fruit",
  "protein",
  "dairy",
  "carbs",
  "fat_sauce",
  "other",
] as const;
export const CategorySchema = z.enum(CATEGORIES);
export type Category = z.infer<typeof CategorySchema>;

/** Hoeveelheid: bewust grof. Nooit grammen in Starter. */
export const AMOUNTS = ["lots", "some", "little"] as const;
export const AmountSchema = z.enum(AMOUNTS);
export type Amount = z.infer<typeof AmountSchema>;

export const MAX_PHOTOS_PER_SCAN = 6;

/** Eén ingrediënt zoals de AI het teruggeeft. */
export const DetectedIngredientSchema = z.object({
  name: z.string().describe("Naam van het ingrediënt in het Nederlands, enkelvoud, kleine letters, bv. 'paprika'"),
  category: CategorySchema,
  amount: AmountSchema.describe("Grove inschatting: lots = veel, some = weinig, little = een beetje"),
  confident: z.boolean().describe("false als het product op de foto niet goed te herkennen is"),
});
export type DetectedIngredient = z.infer<typeof DetectedIngredientSchema>;

/** Antwoord van de vision-call (structured output). */
export const PantryAnalysisSchema = z.object({
  ingredients: z.array(DetectedIngredientSchema),
  photo_quality_note: z
    .string()
    .nullable()
    .describe("Korte Nederlandse opmerking als foto's te donker/wazig zijn, anders null"),
});
export type PantryAnalysis = z.infer<typeof PantryAnalysisSchema>;

/** Ingrediënt zoals het in de gecorrigeerde lijst staat (bron erbij voor analyse van correcties). */
export const PantryItemSchema = DetectedIngredientSchema.extend({
  id: z.string(),
  source: z.enum(["ai", "user"]),
});
export type PantryItem = z.infer<typeof PantryItemSchema>;

/** Request/response van de Edge Function analyze-pantry. */
export const AnalyzeRequestSchema = z.object({
  scan_id: z.string().uuid(),
});
export const AnalyzeResponseSchema = z.object({
  scan_id: z.string(),
  ingredients: z.array(DetectedIngredientSchema),
  photo_quality_note: z.string().nullable(),
});
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
