import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vilkår — FamilyMind',
}

export default function VilkaarPage() {
  return (
    <div className="px-4 py-16 sm:px-8">
      <div className="prose prose-sm mx-auto max-w-3xl">
        <h1 className="font-serif">Vilkår og betingelser</h1>
        <p className="text-sm text-muted-foreground">Sidst opdateret: [INDSÆT DATO]</p>

        <h2>1. Generelt</h2>
        <p>
          Disse vilkår gælder for din brug af FamilyMind-platformen (&quot;Tjenesten&quot;),
          der drives af [INDSÆT FIRMANAVN], CVR [INDSÆT CVR].
        </p>
        <p>
          Ved at oprette en konto eller bruge Tjenesten accepterer du disse vilkår.
        </p>

        <h2>2. Tjenesten</h2>
        <p>
          FamilyMind er en digital platform med kurser, guidede forløb og
          indhold om børneopdragelse og familieliv. Indholdet er vejledende
          og erstatter ikke professionel rådgivning.
        </p>

        <h2>3. Konto</h2>
        <ul>
          <li>Du skal være mindst 18 år for at oprette en konto.</li>
          <li>Du er ansvarlig for at holde dine loginoplysninger sikre.</li>
          <li>Én konto per person.</li>
        </ul>

        <h2>4. Abonnement og betaling</h2>
        <ul>
          <li>Abonnementet koster 149 DKK/md og fornys automatisk.</li>
          <li>Betaling sker via Stripe. Vi gemmer ikke dine kortoplysninger.</li>
          <li>Du kan opsige til enhver tid — adgang fortsætter til periodens udløb.</li>
          <li>Enkelt-køb af kurser giver permanent adgang.</li>
        </ul>

        <h2>5. Fortrydelsesret</h2>
        <p>
          Du har 14 dages fortrydelsesret fra købstidspunktet, medmindre du har
          påbegyndt brugen af digitalt indhold. Ved accept af straks-levering af
          digitalt indhold frafalder du fortrydelsesretten.
        </p>

        <h2>6. Intellektuel ejendomsret</h2>
        <p>
          Alt indhold på platformen (videoer, tekster, øvelser) er ophavsretligt
          beskyttet. Du må ikke kopiere, distribuere eller videresælge indholdet.
        </p>

        <h2>7. Brugeradfærd</h2>
        <p>Du må ikke:</p>
        <ul>
          <li>Dele din konto med andre</li>
          <li>Poste krænkende eller ulovligt indhold i fællesskabet</li>
          <li>Forsøge at omgå betalingssystemet</li>
        </ul>

        <h2>8. Ansvarsbegrænsning</h2>
        <p>
          FamilyMind leverer indhold til vejledende brug. Vi påtager os ikke ansvar
          for konsekvenser af at følge råd fra platformen. Søg altid professionel
          hjælp ved alvorlige udfordringer.
        </p>

        <h2>9. Ændringer</h2>
        <p>
          Vi kan ændre disse vilkår med 30 dages varsel via e-mail. Fortsat brug
          efter ændringsperioden udgør accept af de nye vilkår.
        </p>

        <h2>10. Kontakt og klager</h2>
        <p>
          Kontakt: <a href="mailto:[INDSÆT EMAIL]">[INDSÆT EMAIL]</a><br />
          Se også vores <Link href="/privatlivspolitik">privatlivspolitik</Link>.
        </p>

        <h2>11. Lovvalg</h2>
        <p>
          Disse vilkår er underlagt dansk ret. Tvister afgøres ved de danske domstole.
        </p>
      </div>
    </div>
  )
}
