import { getRecommendations } from '@/lib/services/onboarding.service'
import { RecommendationSection } from './recommendation-section'

export async function RecommendationsSectionAsync({ userId }: { userId: string }) {
  const recommendations = await getRecommendations(userId)

  if (recommendations.length === 0) return null

  return <RecommendationSection recommendations={recommendations} />
}
