import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/services/settings.service'

export const metadata: Metadata = {
  title: 'Privatlivspolitik — FamilyMind',
}

export default async function PrivatlivspolitikPage() {
  const company = await getSiteSettings(['company_name', 'company_cvr', 'company_address', 'company_email'])

  return (
    <div className="px-4 py-16 sm:px-8">
      <div className="prose prose-sm mx-auto max-w-3xl">
        <h1 className="font-serif">Privatlivspolitik</h1>
        <p className="text-sm text-muted-foreground">Sidst opdateret: Februar 2026</p>

        <h2>1. Dataansvarlig</h2>
        <p>
          {company.company_name || '[INDSÆT FIRMANAVN]'}<br />
          CVR: {company.company_cvr || '[INDSÆT CVR]'}<br />
          {company.company_address || '[INDSÆT ADRESSE]'}<br />
          E-mail: <a href={`mailto:${company.company_email || ''}`}>{company.company_email || '[INDSÆT EMAIL]'}</a>
        </p>

        <h2>2. Hvilke personoplysninger indsamler vi?</h2>
        <p>Vi indsamler følgende oplysninger om dig:</p>
        <ul>
          <li><strong>Kontaktoplysninger:</strong> Navn og e-mailadresse (ved oprettelse af konto)</li>
          <li><strong>Profildata:</strong> Onboarding-svar, barnets alder, udfordringer</li>
          <li><strong>Brugsdata:</strong> Kursusfremdrift, gennemførte lektioner, journey check-ins</li>
          <li><strong>Betalingsdata:</strong> Behandles af Stripe — vi gemmer ikke kortoplysninger</li>
          <li><strong>Tekniske data:</strong> IP-adresse (hashed), fejlrapporter via Sentry</li>
          <li><strong>Cookies:</strong> Se vores <a href="/cookiepolitik">cookiepolitik</a></li>
        </ul>

        <h2>3. Formål og retsgrundlag</h2>
        <table>
          <thead>
            <tr><th>Formål</th><th>Retsgrundlag</th></tr>
          </thead>
          <tbody>
            <tr><td>Levering af tjenesten (konto, indhold, kurser)</td><td>Kontraktopfyldelse (art. 6.1.b)</td></tr>
            <tr><td>Betalingshåndtering via Stripe</td><td>Kontraktopfyldelse (art. 6.1.b)</td></tr>
            <tr><td>E-mailnotifikationer (forløb, milestones)</td><td>Legitim interesse (art. 6.1.f)</td></tr>
            <tr><td>Fejlovervågning via Sentry</td><td>Legitim interesse (art. 6.1.f)</td></tr>
            <tr><td>Statistik via Google Analytics</td><td>Samtykke (art. 6.1.a)</td></tr>
            <tr><td>Markedsføring via Meta pixel</td><td>Samtykke (art. 6.1.a)</td></tr>
          </tbody>
        </table>

        <h2>4. Databehandlere</h2>
        <ul>
          <li><strong>Supabase</strong> (EU) — database og autentificering</li>
          <li><strong>Stripe</strong> (USA, EU SCC) — betalingshåndtering</li>
          <li><strong>Resend</strong> (USA, EU SCC) — transaktionelle e-mails</li>
          <li><strong>Bunny.net</strong> (EU) — videohosting</li>
          <li><strong>Sentry</strong> (USA, EU SCC) — fejlovervågning</li>
          <li><strong>Vercel</strong> (USA, EU SCC) — hosting</li>
          <li><strong>Google</strong> (USA, EU SCC) — Analytics (kun med samtykke)</li>
          <li><strong>Meta</strong> (USA, EU SCC) — pixel tracking (kun med samtykke)</li>
        </ul>

        <h2>5. Opbevaringsperiode</h2>
        <ul>
          <li>Kontodata: Så længe kontoen er aktiv + 30 dage efter sletning</li>
          <li>Betalingsdata: 5 år (bogføringsloven)</li>
          <li>Samtykke-log: 2 år efter seneste samtykke</li>
          <li>Sentry-fejldata: 90 dage</li>
        </ul>

        <h2>6. Dine rettigheder</h2>
        <p>Du har ret til:</p>
        <ul>
          <li><strong>Indsigt</strong> — se hvilke data vi har om dig</li>
          <li><strong>Berigtigelse</strong> — rette forkerte oplysninger</li>
          <li><strong>Sletning</strong> — få dine data slettet</li>
          <li><strong>Dataportabilitet</strong> — modtage dine data i maskinlæsbart format</li>
          <li><strong>Tilbagetrækning af samtykke</strong> — via <a href="/cookiepolitik">cookieindstillinger</a></li>
          <li><strong>Klage</strong> — til Datatilsynet (datatilsynet.dk)</li>
        </ul>
        <p>Kontakt os på <a href={`mailto:${company.company_email || ''}`}>{company.company_email || '[INDSÆT EMAIL]'}</a> for at udøve dine rettigheder.</p>

        <h2>7. Sikkerhed</h2>
        <p>
          Vi anvender kryptering (HTTPS/TLS), adgangskontrol og EU-baseret infrastruktur
          for at beskytte dine data. Betalingsoplysninger håndteres udelukkende af Stripe
          (PCI DSS-certificeret).
        </p>
      </div>
    </div>
  )
}
