// Pure lijstlogica voor de voorraadlijst. Geen I/O; unit-getest.
import type { Amount, Category, DetectedIngredient, PantryItem } from "./schemas.ts";

const AMOUNT_RANK: Record<Amount, number> = { little: 0, some: 1, lots: 2 };

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Voegt dubbele detecties samen (zelfde product op meerdere foto's).
 * Bewaart de grootste hoeveelheid; 'confident' als minstens één detectie zeker was.
 */
export function mergeDetections(items: DetectedIngredient[]): DetectedIngredient[] {
  const byName = new Map<string, DetectedIngredient>();
  for (const raw of items) {
    const name = normalizeName(raw.name);
    if (!name) continue;
    const existing = byName.get(name);
    if (!existing) {
      byName.set(name, { ...raw, name });
      continue;
    }
    byName.set(name, {
      ...existing,
      amount: AMOUNT_RANK[raw.amount] > AMOUNT_RANK[existing.amount] ? raw.amount : existing.amount,
      confident: existing.confident || raw.confident,
    });
  }
  return [...byName.values()];
}

let counter = 0;
export function makeId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function toPantryItems(detected: DetectedIngredient[]): PantryItem[] {
  return mergeDetections(detected).map((d) => ({ ...d, id: makeId(), source: "ai" as const }));
}

export type PantryAction =
  | { type: "add"; name: string; category: Category; amount: Amount }
  | { type: "remove"; id: string }
  | { type: "setAmount"; id: string; amount: Amount }
  | { type: "setCategory"; id: string; category: Category }
  | { type: "reset"; items: PantryItem[] };

export function pantryReducer(state: PantryItem[], action: PantryAction): PantryItem[] {
  switch (action.type) {
    case "add": {
      const name = normalizeName(action.name);
      if (!name) return state;
      const existing = state.find((i) => i.name === name);
      if (existing) {
        // Al aanwezig: niet dubbel toevoegen, wel de keuze van de gebruiker overnemen.
        return state.map((i) =>
          i.id === existing.id ? { ...i, category: action.category, amount: action.amount, confident: true } : i,
        );
      }
      return [
        ...state,
        { id: makeId(), name, category: action.category, amount: action.amount, confident: true, source: "user" },
      ];
    }
    case "remove":
      return state.filter((i) => i.id !== action.id);
    case "setAmount":
      return state.map((i) => (i.id === action.id ? { ...i, amount: action.amount, confident: true } : i));
    case "setCategory":
      return state.map((i) => (i.id === action.id ? { ...i, category: action.category, confident: true } : i));
    case "reset":
      return action.items;
  }
}

/** Samenvatting van wat de gebruiker heeft gecorrigeerd (bewaard in scans.corrections, voor kwaliteitsanalyse). */
export function diffCorrections(detected: PantryItem[], final: PantryItem[]) {
  const finalNames = new Set(final.map((i) => i.name));
  const detectedByName = new Map(detected.map((i) => [i.name, i]));
  return {
    removed: detected.filter((i) => !finalNames.has(i.name)).map((i) => i.name),
    added: final.filter((i) => !detectedByName.has(i.name)).map((i) => i.name),
    changed: final
      .filter((i) => {
        const d = detectedByName.get(i.name);
        return d && (d.amount !== i.amount || d.category !== i.category);
      })
      .map((i) => i.name),
  };
}
