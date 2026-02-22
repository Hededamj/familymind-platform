import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface EmailLayoutProps {
  preview?: string
  children: React.ReactNode
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={main}>
        <Container style={container}>
          {/* Header / Logo */}
          <Section style={header}>
            <Text style={logo}>FamilyMind</Text>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Du modtager denne e-mail, fordi du har en konto hos FamilyMind.
            </Text>
            <Text style={footerText}>
              <Link href="{{unsubscribeUrl}}" style={footerLink}>
                Afmeld notifikationer
              </Link>
              {' | '}
              <Link href="{{appUrl}}/dashboard/settings" style={footerLink}>
                Min konto
              </Link>
            </Text>
            <Text style={footerCopyright}>
              &copy; {new Date().getFullYear()} FamilyMind. Alle rettigheder forbeholdes.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const main: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header: React.CSSProperties = {
  padding: '24px 32px',
}

const logo: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#1a1a2e',
  margin: 0,
}

const content: React.CSSProperties = {
  padding: '0 32px',
}

const hr: React.CSSProperties = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const footer: React.CSSProperties = {
  padding: '0 32px',
}

const footerText: React.CSSProperties = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 8px',
}

const footerLink: React.CSSProperties = {
  color: '#8898aa',
  textDecoration: 'underline',
}

const footerCopyright: React.CSSProperties = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '16px',
}
