import { AnalyzeResponseSchema, PantryAnalysisSchema } from "../supabase/functions/_shared/schemas";

describe("PantryAnalysisSchema", () => {
  it("accepteert een geldige AI-uitvoer", () => {
    const ok = PantryAnalysisSchema.safeParse({
      ingredients: [{ name: "paprika", category: "vegetables", amount: "lots", confident: true }],
      photo_quality_note: null,
    });
    expect(ok.success).toBe(true);
  });

  it("weigert grammen of onbekende categorieën", () => {
    expect(
      PantryAnalysisSchema.safeParse({
        ingredients: [{ name: "kaas", category: "dairy", amount: "200g", confident: true }],
        photo_quality_note: null,
      }).success,
    ).toBe(false);
    expect(
      PantryAnalysisSchema.safeParse({
        ingredients: [{ name: "kaas", category: "cheese", amount: "some", confident: true }],
        photo_quality_note: null,
      }).success,
    ).toBe(false);
  });

  it("valideert het antwoord van de Edge Function in de app", () => {
    expect(AnalyzeResponseSchema.safeParse({ scan_id: "x", ingredients: [], photo_quality_note: null }).success).toBe(true);
    expect(AnalyzeResponseSchema.safeParse({ error: "internal" }).success).toBe(false);
  });
});
