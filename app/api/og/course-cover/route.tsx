import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

// Curated Unsplash photos — family/parenting themed, cropped to 1200x630
const THEMES: Record<string, { photo: string; overlay: string; tint: string }> = {
  sleep: {
    // Sleeping child with parent
    photo: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=1200&h=630&fit=crop&crop=faces',
    overlay: 'rgba(20, 30, 50, 0.7)',
    tint: '#86A0A6',
  },
  emotions: {
    // Parent hugging child
    photo: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=1200&h=630&fit=crop&crop=faces',
    overlay: 'rgba(50, 30, 20, 0.65)',
    tint: '#E8715A',
  },
  communication: {
    // Parent and child talking/reading
    photo: 'https://images.unsplash.com/photo-1476234251651-f353703a034d?w=1200&h=630&fit=crop&crop=faces',
    overlay: 'rgba(20, 40, 30, 0.65)',
    tint: '#2A6B5A',
  },
  boundaries: {
    // Parent guiding child outdoors
    photo: 'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=1200&h=630&fit=crop&crop=faces',
    overlay: 'rgba(30, 20, 40, 0.65)',
    tint: '#8B6EBF',
  },
  selfcare: {
    // Calm parent moment
    photo: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=1200&h=630&fit=crop&crop=faces',
    overlay: 'rgba(40, 35, 20, 0.65)',
    tint: '#D4A853',
  },
  family: {
    // Happy family together
    photo: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&h=630&fit=crop&crop=faces',
    overlay: 'rgba(20, 25, 30, 0.6)',
    tint: '#86A0A6',
  },
  default: {
    // Parent and child in nature
    photo: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=1200&h=630&fit=crop&crop=faces',
    overlay: 'rgba(20, 20, 20, 0.6)',
    tint: '#86A0A6',
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
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Background photo */}
        <img
          src={t.photo}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: t.overlay,
            display: 'flex',
          }}
        />

        {/* Bottom gradient for text readability */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '50px 60px',
          }}
        >
          {/* Top: brand + accent line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '3px',
                background: t.tint,
                borderRadius: '2px',
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                display: 'flex',
              }}
            >
              FamilyMind
            </div>
          </div>

          {/* Bottom section: title + meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: '80%',
              }}
            >
              <div
                style={{
                  fontSize: title.length > 35 ? '40px' : title.length > 25 ? '48px' : '56px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1.1,
                  display: 'flex',
                  textShadow: '0 2px 12px rgba(0,0,0,0.3)',
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontSize: '20px',
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: 1.4,
                    display: 'flex',
                    maxWidth: '70%',
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>

            {/* Meta pills */}
            {(modules || lessons) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {modules && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px',
                      color: '#FFFFFF',
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(8px)',
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.1)',
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
                      fontSize: '14px',
                      color: '#FFFFFF',
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(8px)',
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {lessons} lektioner
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
