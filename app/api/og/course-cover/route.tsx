import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

const THEMES: Record<string, { bg: string; accent: string; pattern: string }> = {
  sleep: {
    bg: 'linear-gradient(135deg, #1a2a3a 0%, #2d4a5a 50%, #86A0A6 100%)',
    accent: '#E8E4DF',
    pattern: '🌙',
  },
  emotions: {
    bg: 'linear-gradient(135deg, #3a2a1a 0%, #5a4030 50%, #E8715A 100%)',
    accent: '#F5F0EB',
    pattern: '💛',
  },
  communication: {
    bg: 'linear-gradient(135deg, #1a3a2a 0%, #2A6B5A 50%, #86A0A6 100%)',
    accent: '#F5F0EB',
    pattern: '💬',
  },
  boundaries: {
    bg: 'linear-gradient(135deg, #2a1a3a 0%, #4a3060 50%, #8B6EBF 100%)',
    accent: '#F5F0EB',
    pattern: '🛡️',
  },
  selfcare: {
    bg: 'linear-gradient(135deg, #3a2a20 0%, #5a4a30 50%, #D4A853 100%)',
    accent: '#F5F0EB',
    pattern: '🌿',
  },
  default: {
    bg: 'linear-gradient(135deg, #1A1A1A 0%, #3a4a50 50%, #86A0A6 100%)',
    accent: '#F5F0EB',
    pattern: '📖',
  },
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get('title') || 'Kursus'
  const subtitle = searchParams.get('subtitle') || ''
  const theme = searchParams.get('theme') || 'default'
  const lessons = searchParams.get('lessons') || ''
  const modules = searchParams.get('modules') || ''

  const t = THEMES[theme] || THEMES.default

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: t.bg,
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-120px',
            left: '-60px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            right: '60px',
            fontSize: '120px',
            opacity: 0.15,
            display: 'flex',
          }}
        >
          {t.pattern}
        </div>

        {/* Top: brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              display: 'flex',
            }}
          >
            FamilyMind
          </div>
        </div>

        {/* Middle: title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '85%',
          }}
        >
          <div
            style={{
              fontSize: title.length > 30 ? '42px' : '52px',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.15,
              display: 'flex',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: '22px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.4,
                display: 'flex',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom: meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {modules && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '16px',
                color: 'rgba(255,255,255,0.7)',
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
              }}
            >
              {modules} moduler
            </div>
          )}
          {lessons && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '16px',
                color: 'rgba(255,255,255,0.7)',
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
              }}
            >
              {lessons} lektioner
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
