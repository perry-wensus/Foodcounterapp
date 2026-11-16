import { I18n, type TranslateOptions } from "i18n-js";
import nl from "./nl";

// Nu alleen Nederlands. Nieuwe talen: extra bestand toevoegen en hier registreren.
const i18n = new I18n({ nl });
i18n.defaultLocale = "nl";
i18n.locale = "nl";
i18n.enableFallback = true;

/** Paden in het vertaalbestand, bv. "scan.title". Typo's worden zo een typefout. */
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Leaves<typeof nl>;

export function t(key: TKey, options?: TranslateOptions): string {
  return i18n.t(key, options);
}

export default i18n;
