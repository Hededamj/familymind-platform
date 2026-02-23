import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cookiepolitik — FamilyMind',
}

export default function CookiepolitikPage() {
  return (
    <div className="px-4 py-16 sm:px-8">
      <div className="prose prose-sm mx-auto max-w-3xl">
        <h1 className="font-serif">Cookiepolitik</h1>
        <p className="text-sm text-muted-foreground">Sidst opdateret: [INDSÆT DATO]</p>

        <p>
          Denne side forklarer hvilke cookies vi bruger og hvorfor.
          Du kan til enhver tid ændre dine valg via linket &quot;Cookieindstillinger&quot; i sidefoden.
        </p>

        <h2>Hvad er cookies?</h2>
        <p>
          Cookies er små tekstfiler der gemmes i din browser. De bruges til at huske
          dine indstillinger, holde dig logget ind, og til at forstå hvordan vores
          side bruges.
        </p>

        <h2>Nødvendige cookies</h2>
        <p>Disse cookies er nødvendige for at siden fungerer. De kan ikke deaktiveres.</p>
        <table>
          <thead>
            <tr><th>Navn</th><th>Formål</th><th>Udløb</th><th>Udbyder</th></tr>
          </thead>
          <tbody>
            <tr><td>sb-*-auth-token</td><td>Login-session</td><td>Session</td><td>Supabase</td></tr>
            <tr><td>cookie_consent</td><td>Gemmer dine cookievalg</td><td>12 måneder</td><td>FamilyMind</td></tr>
          </tbody>
        </table>

        <h2>Statistik-cookies</h2>
        <p>Disse cookies hjælper os med at forstå hvordan besøgende bruger siden. Kræver dit samtykke.</p>
        <table>
          <thead>
            <tr><th>Navn</th><th>Formål</th><th>Udløb</th><th>Udbyder</th></tr>
          </thead>
          <tbody>
            <tr><td>_ga</td><td>Skelner mellem brugere</td><td>2 år</td><td>Google Analytics</td></tr>
            <tr><td>_ga_*</td><td>Sessionsdata</td><td>2 år</td><td>Google Analytics</td></tr>
          </tbody>
        </table>

        <h2>Marketing-cookies</h2>
        <p>Disse cookies bruges til at vise relevante annoncer. Kræver dit samtykke.</p>
        <table>
          <thead>
            <tr><th>Navn</th><th>Formål</th><th>Udløb</th><th>Udbyder</th></tr>
          </thead>
          <tbody>
            <tr><td>_fbp</td><td>Identificerer browseren for annoncering</td><td>3 måneder</td><td>Meta (Facebook)</td></tr>
            <tr><td>_fbc</td><td>Sporer klik fra Facebook-annoncer</td><td>3 måneder</td><td>Meta (Facebook)</td></tr>
          </tbody>
        </table>

        <h2>Administrer dine valg</h2>
        <p>
          Du kan til enhver tid ændre eller trække dit samtykke tilbage.
          Brug linket &quot;Cookieindstillinger&quot; i sidefoden.
        </p>
        <p>
          Du kan også slette cookies i din browsers indstillinger.
          Se vejledning for{' '}
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>,{' '}
          <a href="https://support.mozilla.org/da/kb/delete-cookies-remove-info-websites-stored" target="_blank" rel="noopener noreferrer">Firefox</a>,{' '}
          <a href="https://support.apple.com/da-dk/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>.
        </p>

        <h2>Kontakt</h2>
        <p>
          Har du spørgsmål om vores brug af cookies, kontakt os på{' '}
          <a href="mailto:[INDSÆT EMAIL]">[INDSÆT EMAIL]</a>.
        </p>
        <p>
          Se også vores <Link href="/privatlivspolitik">privatlivspolitik</Link>.
        </p>
      </div>
    </div>
  )
}
