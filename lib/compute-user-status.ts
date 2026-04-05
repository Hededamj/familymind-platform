/**
 * Shared user status computation — used in both the user table and user detail header.
 *
 * Status logic:
 *   - trial: no entitlements at all
 *   - churned: has at least one entitlement, but none currently active
 *   - active: has an active entitlement AND was active in the last 14 days
 *   - inactive: has an active entitlement but was NOT active recently
 */

export const INACTIVE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000

type StatusUser = {
  lastActiveAt: Date | string | null
  entitlements: Array<{
    status: string
    expiresAt?: Date | string | null
  }>
  /** Total entitlement count (including expired). Used by the list view where
   *  only active entitlements are included in the `entitlements` array. When
   *  provided, it allows distinguishing "trial" (never had entitlements) from
   *  "churned" (had entitlements but none active). */
  _count?: { entitlements?: number; [key: string]: number | undefined }
}

export function computeUserStatus(
  user: StatusUser
): 'trial' | 'active' | 'inactive' | 'churned' {
  const hasActiveEntitlement = user.entitlements.some(
    (e) =>
      e.status === 'ACTIVE' &&
      (!e.expiresAt || new Date(e.expiresAt as string) > new Date())
  )

  if (!hasActiveEntitlement) {
    // Determine whether the user ever had an entitlement.
    // When _count.entitlements is available (list view), use that.
    // Otherwise fall back to checking the entitlements array length (detail view
    // which includes ALL entitlements, not just active ones).
    const totalEntitlements = user._count?.entitlements ?? user.entitlements.length
    return totalEntitlements > 0 ? 'churned' : 'trial'
  }

  const fourteenDaysAgo = new Date(Date.now() - INACTIVE_THRESHOLD_MS)
  const lastActive = user.lastActiveAt
    ? new Date(user.lastActiveAt as string)
    : null

  if (lastActive && lastActive >= fourteenDaysAgo) {
    return 'active'
  }

  return 'inactive'
}
