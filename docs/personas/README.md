# Personas (målgruppeprofiler)

Interne målgruppeanalyser skrevet af Mette Hummel. Danner grundlag for marketing-copy, landing pages, onboarding-quiz, anbefalingsregler, community-rum-tags og kommunikation på tværs af platformen.

Råkilder: `docs/personas/sources/*.docx` (Word, Mettes originale formulering).
Arbejdsversioner: denne mappe — ét markdown-dokument per profil, auto-genereret via `scripts/extract-personas.py`.

## Oversigt

| Profil | Persona | Alder | Genkendelses-sætning |
|---|---|---|---|
| [Sammenbragte familier](sammenbragte-familier.md) | Katrine, 42 | 4–16 år | *"Det føles som om vi gør alt rigtigt — og alligevel bliver det værre."* |
| [Søvn](søvn.md) | Nadia, 33 | 0–8 år | *"Jeg vil ikke have en hård metode — jeg vil have en tryg vej, der også passer på mig."* |
| [Følelsesregulering og nedsmeltninger](følelsesregulering-og-nedsmeltninger.md) | Anne, 35 | 2–10 år | *"Jeg har brug for noget, der virker i øjeblikket — ikke kun gode intentioner."* |
| [Neurodivergens](neurodivergens.md) | Signe, 40 | 4–14 år | *"Endelig en, der forstår, at det ikke handler om opdragelse — men om nervesystem og belastning."* |

Alle fire profiler har A/B-segmenter (se sektion 10 i hver).

## Mønstre på tværs

### Brandets DNA er krystalklart
Alle profiler afviser det samme: "hård metode", "konsekvens som svar", "ignorer", "fragmenterede råd fra nettet". Alle søger det samme: **tryg, konkret, nervesystem-venlig retning**. Positioneringen i én sætning:

> *Det kærlige og det tydelige — uden at du skal vælge.*

Dette er den røde tråd i al Familymind-kommunikation.

### Købsøjeblikket er identisk på tværs
Alle fire personaer køber **om aftenen, når barnet sover**, efter en svær oplevelse samme dag. Konkrete konsekvenser:

- Ads kører søn–man 19–22
- Re-engagement-cron (`app/api/cron/engagement/`) bør ramme samme tidsvindue
- Dashboard-besked ved dag-slut: *"Svær dag? Her er dét du kan se nu."*

### Aldersspændene overlapper kraftigt — personaerne er ikke gensidigt udelukkende

```
 0 ──── 5 ──── 10 ──── 16
Søvn:          [████████████]
Følelser:          [██████████████]
Neurodiv.:                 [██████████████████]
Sammenbr.:                 [████████████████████████]
```

Forældre med et 5-årigt barn kan være i **3 personas samtidig** (søvn + følelser + evt. neurodivergens). Dette validerer bundle-modellen: ét abonnement ("Familymind"), flere parallelle persona-drevne rejser indvendigt.

**Konsekvens for onboarding-quiz:** spørg ikke *"hvem er du?"* — spørg *"hvad fylder mest lige nu?"* og tillad 1–3 aktive personas pr. bruger.

### Genkendelsessætninger følger samme arketype
"Jeg vil gerne X, men Y står i vejen." Marketing-guld: direkte anvendelig som H1 på landing pages og som email-emnelinjer.

### Personaerne er alle mødre, 33–42
Middelklasse-navne, middel-urban kontekst, ressourcestærke. Fædre mangler helt som persona — værd at få afklaret om det er et bevidst valg eller et blindt punkt.

## Huller — profiler der endnu ikke er skrevet

Baseret på typiske forældre-søgninger og Mettes faglige felt:

- Trodsalder / 2–3 års grænser
- Teenager / pubertet (14–19 år)
- Søskende-konflikter
- Skilsmisse / deleordning (ikke-sammenbragt)
- Parforhold under forældrestress
- Skoleværgring (berørt i neurodivergens, men selvstændig)
- Mad, skærme, rytmer (praktiske dagligdags-smerter)

Mette har flere på vej — listen opdateres.

## Sådan tilføjer du en ny profil

1. Læg `.docx`-filen i `docs/personas/sources/` med kort slug-navn, fx `teenager.docx` (brug `-` som separator, æøå er OK).
2. Kør:
   ```bash
   python scripts/extract-personas.py
   ```
3. Filen bliver udtrukket til `docs/personas/<slug>.md`.
4. Opdatér tabellen i denne README manuelt (hook + alder + persona).

Scriptet er idempotent — sikkert at køre flere gange.

## Sådan bruges profilerne (næste skridt)

- **Atomiske marketing-assets** per profil — hooks, pain-fraser, søgeord, købsøjeblik, transformations-løfter, indvendinger → direkte input til landing pages, ads, emails.
- **Onboarding-quiz** der routing'er brugere til 1–3 aktive personas via `RecommendationRule` (`targetType` ROOM/COURSE/BUNDLE).
- **Community-rum-tags** (`CommunityRoomTag`) der spejler persona-slug.
- **Dashboard- og email-copy** der adresserer den mest akutte persona.
- **Journey-design** hvor dage spejler "hvad de har prøvet → transformation".

Hver af disse er selvstændige arbejdsspor. Start når klar.
