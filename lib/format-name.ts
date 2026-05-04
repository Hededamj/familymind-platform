/**
 * Extract the first name from a full name string.
 * Splits on whitespace, takes the first token, and capitalizes it.
 * Returns empty string if name is null/empty.
 *
 * Examples:
 *   getFirstName('Mette Hummel') === 'Mette'
 *   getFirstName('mette marie hummel') === 'Mette'
 *   getFirstName(null) === ''
 */
export function getFirstName(name: string | null | undefined): string {
  if (!name) return ''
  const first = name.trim().split(/\s+/)[0]
  if (!first) return ''
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

/**
 * Best-effort greeting name when no User.name is set.
 * Falls back to the local part of the email, capitalized.
 */
export function getGreetingName(
  name: string | null | undefined,
  email: string
): string {
  const first = getFirstName(name)
  if (first) return first
  const localPart = email.split('@')[0] ?? ''
  if (!localPart) return ''
  return localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase()
}
