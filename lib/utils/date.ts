const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000

/**
 * Danish relative time (e.g., "for 3 timer siden").
 */
export function formatDistanceToNow(date: Date): string {
  const diff = Date.now() - date.getTime()

  if (diff < MINUTE) return 'lige nu'
  if (diff < HOUR) {
    const mins = Math.floor(diff / MINUTE)
    return `${mins} min. siden`
  }
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR)
    return `${hours} ${hours === 1 ? 'time' : 'timer'} siden`
  }
  if (diff < DAY * 7) {
    const days = Math.floor(diff / DAY)
    return `${days} ${days === 1 ? 'dag' : 'dage'} siden`
  }

  return date.toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Format date for display (da-DK locale).
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
