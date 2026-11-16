// Alle Nederlandse teksten. Toon: vriendelijk, neutraal, nooit schuld of straf.
// Geen medische claims. Waarden uit foto's zijn altijd schattingen.
const nl = {
  common: {
    appName: "Voorraadkok",
    continue: "Verder",
    cancel: "Annuleren",
    save: "Opslaan",
    delete: "Verwijderen",
    retry: "Opnieuw proberen",
    loading: "Even geduld…",
    back: "Terug",
    comingSoon: "Komt in een volgende stap van het prototype.",
  },
  tabs: {
    scan: "Scan",
    recipes: "Recepten",
    week: "Week",
    shopping: "Boodschappen",
  },
  auth: {
    title: "Welkom",
    intro: "Log in of maak een account om je voorraad en weekplan te bewaren.",
    email: "E-mailadres",
    password: "Wachtwoord (minimaal 8 tekens)",
    signIn: "Inloggen",
    signUp: "Account maken",
    switchToSignUp: "Nog geen account? Maak er een",
    switchToSignIn: "Heb je al een account? Log in",
    error: "Inloggen lukte niet. Controleer je e-mailadres en wachtwoord.",
    signUpError: "Account maken lukte niet. Probeer een ander e-mailadres of een langer wachtwoord.",
    checkEmail: "Bevestig je e-mailadres via de link in je mail en log daarna in.",
  },
  consent: {
    title: "Voordat je begint",
    body:
      "Deze app helpt je met koken uit je eigen voorraad en een rustig weekplan. Daarvoor verwerken we:\n\n" +
      "• Foto's van je koelkast of voorraadkast. Die sturen we naar een AI-dienst om ingrediënten te herkennen en verwijderen we direct na de analyse.\n" +
      "• Je ingrediëntenlijsten, recepten en weekplan.\n" +
      "• Later, als je dat wilt: wat je hebt gegeten. Dat zijn gezondheidsgegevens; daarvoor vragen we je uitdrukkelijke toestemming.\n\n" +
      "Alles wat de app over eten zegt, is een schatting en geen medisch advies.",
    checkbox: "Ik geef uitdrukkelijk toestemming voor deze verwerking.",
    readPolicy: "Lees het privacybeleid",
    accept: "Akkoord en verder",
  },
  privacy: {
    title: "Privacybeleid",
    // Concepttekst: juridisch te laten toetsen.
    body:
      "Concepttekst – nog juridisch te toetsen.\n\n" +
      "Wie zijn wij\n[Naam organisatie, contactgegevens]\n\n" +
      "Welke gegevens\n• Account: e-mailadres.\n• Voorraadscans: foto's (tijdelijk) en de herkende ingrediëntenlijst.\n• Recepten, weekplan en boodschappenlijst.\n• Later: gegeten maaltijden en geschatte waarden (gezondheidsgegevens, alleen met uitdrukkelijke toestemming).\n\n" +
      "Waarom\nOm je recepten en een weekplan te geven op basis van wat je in huis hebt.\n\n" +
      "Foto's\nFoto's worden naar onze server en een AI-dienst (Anthropic) gestuurd voor herkenning en direct na de analyse verwijderd. Ze worden niet gebruikt om AI-modellen te trainen.\n\n" +
      "Bewaren\nZolang je account bestaat. Je kunt je account en alle gegevens op elk moment zelf verwijderen via Account.\n\n" +
      "Je rechten\nInzage, correctie, verwijdering en intrekken van toestemming. Neem contact op via [e-mailadres].\n\n" +
      "Geen medisch advies\nDe app geeft kook- en boodschappensuggesties. Het is geen medisch hulpmiddel.",
  },
  account: {
    title: "Account",
    signedInAs: "Ingelogd als {{email}}",
    signOut: "Uitloggen",
    privacy: "Privacybeleid",
    deleteTitle: "Account en gegevens verwijderen",
    deleteBody: "Dit verwijdert je account en al je gegevens: scans, recepten, weekplan en boodschappenlijst. Dit kan niet ongedaan worden gemaakt.",
    deleteConfirm: "Definitief verwijderen",
    deleteError: "Verwijderen lukte niet. Probeer het later opnieuw.",
  },
  scan: {
    title: "Voorraadscan",
    intro: "Maak 1 tot 6 foto's van je koelkast, vriezer of voorraadkast. Je kunt de lijst daarna zelf aanpassen.",
    takePhoto: "Foto maken",
    pickPhoto: "Kies uit fotobibliotheek",
    photosCount: "{{count}} van {{max}} foto's",
    maxReached: "Maximaal {{max}} foto's per scan.",
    removePhoto: "Foto verwijderen",
    analyze: "Herken ingrediënten",
    analyzing: "Ingrediënten herkennen…",
    analyzingHint: "Dit duurt meestal 10 tot 30 seconden.",
    uploading: "Foto's versturen…",
    cameraDenied: "Geen toegang tot de camera. Je kunt dit aanzetten in de instellingen van je telefoon.",
    libraryDenied: "Geen toegang tot je foto's. Je kunt dit aanzetten in de instellingen van je telefoon.",
    privacyNote: "Foto's worden na de analyse direct verwijderd.",
    errors: {
      ai_unavailable: "De herkenning is even niet bereikbaar. Probeer het zo opnieuw.",
      ai_unreadable: "We konden de foto's niet goed lezen. Probeer het met meer licht of van dichterbij.",
      too_many_photos: "Maximaal 6 foto's per scan.",
      no_photos: "Voeg eerst een foto toe.",
      network: "Geen verbinding. Controleer je internet en probeer het opnieuw.",
      generic: "Er ging iets mis. Probeer het opnieuw.",
    },
  },
  review: {
    title: "Klopt deze lijst?",
    intro: "Verwijder wat er niet klopt en voeg toe wat we gemist hebben. Herkenning op foto's is een schatting.",
    empty: "We hebben niets herkend. Voeg zelf ingrediënten toe of maak een nieuwe foto.",
    uncertain: "Twijfel",
    uncertainHint: "Items met 'twijfel' even nakijken.",
    addTitle: "Ingrediënt toevoegen",
    addPlaceholder: "Bijv. spinazie",
    add: "Toevoegen",
    category: "Categorie",
    amount: "Hoeveel",
    confirm: "Lijst bevestigen",
    rescan: "Opnieuw scannen",
    saving: "Opslaan…",
    saveError: "Opslaan lukte niet. Probeer het opnieuw.",
    itemCount: "{{count}} ingrediënten",
  },
  done: {
    title: "Voorraad opgeslagen",
    body: "Je lijst met {{count}} ingrediënten staat klaar. In de volgende stappen maken we hier boodschappenadvies en recepten van.",
    newScan: "Nieuwe scan",
    lastScan: "Laatste voorraad",
  },
  categories: {
    vegetables: "Groente",
    fruit: "Fruit",
    protein: "Eiwit",
    dairy: "Zuivel",
    carbs: "Koolhydraten",
    fat_sauce: "Vet / saus",
    other: "Overig",
  },
  amounts: {
    lots: "Veel",
    some: "Weinig",
    little: "Een beetje",
  },
  placeholders: {
    recipes: "Hier kies je straks een stijl (snel, uitgebreid, makkelijk, gezond, vooral lekker) en maak je een recept uit je voorraad.",
    week: "Hier plan je straks je recepten in over de week.",
    shopping: "Hier komt straks je boodschappenlijst.",
  },
} as const;

export default nl;
export type Translations = typeof nl;
