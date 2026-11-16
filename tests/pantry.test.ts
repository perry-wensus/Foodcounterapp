import { diffCorrections, mergeDetections, pantryReducer, toPantryItems } from "../supabase/functions/_shared/pantry";
import type { DetectedIngredient } from "../supabase/functions/_shared/schemas";

const d = (name: string, extra: Partial<DetectedIngredient> = {}): DetectedIngredient => ({
  name,
  category: "vegetables",
  amount: "some",
  confident: true,
  ...extra,
});

describe("mergeDetections", () => {
  it("voegt hetzelfde product van meerdere foto's samen (hoofdletters/spaties genegeerd)", () => {
    const out = mergeDetections([d("Paprika"), d(" paprika ", { amount: "lots", confident: false }), d("ui")]);
    expect(out).toHaveLength(2);
    const paprika = out.find((i) => i.name === "paprika")!;
    expect(paprika.amount).toBe("lots"); // grootste hoeveelheid wint
    expect(paprika.confident).toBe(true); // één zekere detectie is genoeg
  });

  it("negeert lege namen", () => {
    expect(mergeDetections([d("  ")])).toEqual([]);
  });
});

describe("pantryReducer", () => {
  const start = toPantryItems([d("paprika"), d("melk", { category: "dairy", confident: false })]);

  it("verwijdert een item", () => {
    const out = pantryReducer(start, { type: "remove", id: start[0].id });
    expect(out.map((i) => i.name)).toEqual(["melk"]);
  });

  it("voegt een nieuw item toe als gebruikersbron", () => {
    const out = pantryReducer(start, { type: "add", name: "Spinazie", category: "vegetables", amount: "little" });
    const added = out.find((i) => i.name === "spinazie")!;
    expect(added.source).toBe("user");
    expect(added.confident).toBe(true);
  });

  it("voegt geen dubbel item toe maar neemt de keuze over", () => {
    const out = pantryReducer(start, { type: "add", name: "Melk", category: "dairy", amount: "lots" });
    expect(out).toHaveLength(2);
    expect(out.find((i) => i.name === "melk")).toMatchObject({ amount: "lots", confident: true });
  });

  it("wijzigt hoeveelheid en categorie en markeert als nagekeken", () => {
    const melk = start[1];
    let out = pantryReducer(start, { type: "setAmount", id: melk.id, amount: "little" });
    out = pantryReducer(out, { type: "setCategory", id: melk.id, category: "other" });
    expect(out[1]).toMatchObject({ amount: "little", category: "other", confident: true });
  });

  it("negeert lege invoer", () => {
    expect(pantryReducer(start, { type: "add", name: "   ", category: "other", amount: "some" })).toBe(start);
  });
});

describe("diffCorrections", () => {
  it("vat toevoegingen, verwijderingen en wijzigingen samen", () => {
    const detected = toPantryItems([d("paprika"), d("melk", { category: "dairy" })]);
    let final = pantryReducer(detected, { type: "remove", id: detected[0].id });
    final = pantryReducer(final, { type: "add", name: "tofu", category: "protein", amount: "some" });
    final = pantryReducer(final, { type: "setAmount", id: detected[1].id, amount: "lots" });
    expect(diffCorrections(detected, final)).toEqual({ removed: ["paprika"], added: ["tofu"], changed: ["melk"] });
  });
});
