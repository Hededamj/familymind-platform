/**
 * Return the canonical absolute base URL for this deployment.
 *
 * Throws at build/request time if `NEXT_PUBLIC_APP_URL` is not configured, so we
 * never emit sitemap/JSON-LD/breadcrumb URLs pointing at a domain we do not own.
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL is not set. Configure the deployment URL before emitting canonical URLs.'
    )
  }
  return url.replace(/\/$/, '')
}
