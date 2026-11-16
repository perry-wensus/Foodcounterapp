# Open aannames en beslissingen

Bijgehouden per stap. **V** = te valideren met gebruikers, **D** = door diëtist te valideren, **J** = juridisch, **T** = technisch.

## Algemeen
| # | Aanname | Type | Status |
|---|---|---|---|
| A1 | Werktitel app: "Voorraadkok" (staat alleen in `nl.ts` en `app.json`). | V | open |
| A2 | Inloggen met e-mail + wachtwoord. Magic link vraagt deep-link-config die in Expo Go omslachtig is; later heroverwegen (of anonieme accounts voor minder persoonsgegevens). | T/V | open |
| A3 | Toestemming wordt gevraagd vóór de eerste scan, voor alle verwerking tegelijk (foto's + later eetgegevens). Mogelijk moet toestemming voor gezondheidsgegevens (stap 5/6) apart en later gevraagd worden. | J | open |
| A4 | Privacybeleid is een concepttekst met placeholders (organisatie, contact). | J | open |
| A5 | Tab-iconen zijn tekstsymbolen; `@expo/vector-icons` gaf een peer-dependency-conflict (react-dom) met SDK 58. | T | open |
| A6 | Claude-model `claude-opus-5-5`, server-side fallback bij weigeringen aan (`fallbacks: "default"`). | T | open |

## Stap 1 – Voorraadscan
| # | Aanname | Type | Status |
|---|---|---|---|
| S1 | Hoeveelheden "veel / weinig / een beetje" worden intern opgeslagen als `lots / some / little`. "Weinig" en "een beetje" liggen dicht bij elkaar; mogelijk is "veel / normaal / bijna op" duidelijker. | V | open |
| S2 | Categorie-indeling door de AI: peulvruchten in blik = groente, gedroogde peulvruchten = eiwit; drinken, kruiden en snoep = overig. | D | open |
| S3 | Foto's worden in de app verkleind tot 1568 px lange zijde, JPEG 70%. Dat verwijdert ook EXIF (locatie). | T | open |
| S4 | Foto's worden direct na analyse verwijderd, ook bij een fout. Nog niet afgevangen: een scan die halverwege wordt afgebroken (app gesloten tijdens upload). Nodig: periodieke opruimtaak (bv. foto's ouder dan 1 uur). | T/J | open |
| S5 | Effort `low` voor herkenning, voor snelheid. Als herkenning op echte koelkasten tegenvalt: `medium` proberen. Wachttijd nog niet gemeten. | T | open (meten) |
| S6 | Geen rate limiting op de analysefunctie (kosten!). Nodig voor bèta: bv. max N scans per dag per gebruiker. | T | open |
| S7 | Een bevestigde scan vervangt functioneel de vorige voorraad ("laatste voorraad"). Voorraad bijhouden tussen scans (verbruik door recepten) is niet in scope. | V | open |
| S8 | Items waar de AI twijfelt krijgen het label "Twijfel"; tikken/aanpassen of toevoegen markeert ze als nagekeken. | V | open |
| S9 | Herkende namen worden genormaliseerd naar kleine letters; dubbelen over meerdere foto's samengevoegd (grootste hoeveelheid wint). | T | open |
| S10 | AI-dienst (Anthropic) is verwerker: verwerkersovereenkomst en datalocatie (EU?) nog regelen; vermelden in privacybeleid. | J | open |

## Later (alvast vastgelegd)
- `profiles.level` (`starter/gevorderd/expert`) en `recipes.est_per_portion` bestaan al, zodat Gevorderd/Expert geen schemawijziging nodig hebben voor zichtbaarheid van macro's.
- `profiles.compensation_disabled` is de schakelaar die de screening (stap 6) zet.
