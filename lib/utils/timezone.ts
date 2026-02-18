/**
 * Get the current time in Danish timezone (Europe/Copenhagen).
 * Handles CET (UTC+1) and CEST (UTC+2) automatically.
 */
export function getDanishTime(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('da-DK', {
    timeZone: 'Europe/Copenhagen',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00'
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? ''

  // Map Danish weekday name to JS day number (0=Sunday)
  const dayMap: Record<string, number> = {
    søndag: 0,
    mandag: 1,
    tirsdag: 2,
    onsdag: 3,
    torsdag: 4,
    fredag: 5,
    lørdag: 6,
  }

  const dayNumber = dayMap[weekday.toLowerCase()]
  if (dayNumber === undefined) {
    console.warn(`[timezone] Unknown Danish weekday: "${weekday}", falling back to UTC`)
  }

  return {
    dayOfWeek: dayNumber ?? date.getDay(),
    hour: parseInt(hour, 10),
    timeStr: `${hour}:00`,
  }
}
