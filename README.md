# Voorraadkok – Starter-prototype

Mobiele app (iOS + Android, Expo) die mensen helpt gezonder te eten **zonder tellen of afwegen**:
foto van koelkast/voorraadkast → ingrediëntenlijst → recept in gekozen stijl → weekplanner met zachte weekbalans.

Dit is het **Starter-niveau**. Gevorderd en Expert komen later; het datamodel houdt daar rekening mee.

## Stand van zaken

| Stap | Onderdeel | Status |
|---|---|---|
| 0 | Repo, Expo (SDK 58, Router), Supabase, navigatie met 4 tabs | ✅ |
| 1 | Voorraadscan + correctie | ✅ gebouwd, ⏳ nog te testen op echte telefoon met echte koelkast |
| 2 | Voorraadadvies + boodschappenlijst | – |
| 3 | Recept genereren met stijlkeuze | – |
| 4 | Weekplanner | – |
| 5 | Maaltijd vastleggen | – |
| 6 | Zachte weekbalans (regelmotor) + screening | – |

Open aannames: [`docs/AANNAMES.md`](docs/AANNAMES.md).

## Architectuur

```
app (Expo)  ──JWT──▶  Supabase Postgres (RLS)        profiles, scans, recipes, meal_plan, meal_log, shopping_items
     │                Supabase Storage (privé)       scan-photos/<user>/<scan>/<n>.jpg  (na analyse verwijderd)
     └──JWT──▶  Edge Function analyze-pantry  ──▶  Claude API (vision, gestructureerde JSON, zod)
                Edge Function delete-account        (AVG: account + alle data verwijderen)
```

- De Claude API-sleutel bestaat **alleen** als Supabase-secret. De app kent alleen de publieke anon-key.
- Edge Functions gebruiken de JWT van de gebruiker, dus ook daar geldt RLS.
- Gedeelde zod-schema's en lijstlogica staan in `supabase/functions/_shared/` en worden door app én functies gebruikt.
- Alle teksten in `src/i18n/nl.ts`.

```
src/app/                Expo Router-routes (login, consent, privacy, account, (tabs)/…)
src/features/scan/      scan-API, foto-kiezer, ingrediënten-editor
src/i18n/               vertalingen
src/lib/                supabase-client, auth/consent-context
supabase/migrations/    datamodel + RLS + storage-bucket
supabase/functions/     Edge Functions + _shared (schema's, pure logica)
supabase/tests/         RLS-test (SQL)
tests/                  unit-tests (jest)
```

## Opzetten

### 1. Supabase-project
1. Maak een project op supabase.com (regio EU).
2. Koppel en push het schema:
   ```bash
   npx supabase login
   ```
   ```bash
   npx supabase link --project-ref <project-ref>
   ```
   ```bash
   npx supabase db push
   ```
3. Zet de Claude API-sleutel als secret (nooit in `.env` van de app):
   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=<sleutel>
   ```
4. Deploy de functies:
   ```bash
   npx supabase functions deploy analyze-pantry
   ```
   ```bash
   npx supabase functions deploy delete-account
   ```
5. Auth: e-mail/wachtwoord aan. Voor snel testen kun je "Confirm email" tijdelijk uitzetten.

### 2. App
```bash
cp .env.example .env.local
```
Vul `EXPO_PUBLIC_SUPABASE_URL` en `EXPO_PUBLIC_SUPABASE_ANON_KEY` in, dan:
```bash
npm install
```
```bash
npx expo start
```
Scan de QR-code met **Expo Go** (versie voor SDK 58) op je telefoon.

## Testen

```bash
npm test                  # unit-tests (lijstlogica, schema's)
```
```bash
npm run typecheck
```
```bash
npm run check:secrets     # bouwt een bundel en controleert dat er geen API-sleutel in zit
```
RLS-test tegen lokale database (vereist Docker):
```bash
npx supabase db start
```
```bash
npm run test:rls
```

## Veiligheidsprincipes (gelden voor alle stappen)
- Nooit calorieën of "tekort/overschot" tonen in Starter; geen schuld- of straftaal. Een uitschieter is een gewone dag.
- Waarden uit foto's zijn schattingen en worden zo benoemd.
- Geen medische claims.
- Foto's niet langer bewaren dan nodig; account + alle data zelf te verwijderen.
