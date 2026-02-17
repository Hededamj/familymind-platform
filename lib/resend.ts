import { Resend } from 'resend'

function getResendClient() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error(
      'RESEND_API_KEY is not set. Please add it to your environment variables.'
    )
  }
  return new Resend(key)
}

// Lazy singleton: Resend client is only instantiated on first access,
// allowing builds to succeed without credentials.
let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    _resend = getResendClient()
  }
  return _resend
}
