/**
 * Generate a SEO-friendly post slug from body text.
 * Format: [uuid-prefix-8]-[first-8-words-slugified]
 * Example: a3f2b1c9-hvornaar-skal-barnet-sove-alene
 */
export function generatePostSlug(body: string): string {
  const uuid = crypto.randomUUID().slice(0, 8)

  const slug = body
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join('-')
    .slice(0, 80) // max length

  return `${uuid}-${slug || 'opslag'}`
}
