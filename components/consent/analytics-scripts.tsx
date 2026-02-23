'use client'

import Script from 'next/script'
import { useConsent } from './consent-provider'

const GA4_PATTERN = /^G-[A-Z0-9]{6,12}$/
const META_PIXEL_PATTERN = /^\d{10,20}$/

type Props = {
  ga4Id?: string
  metaPixelId?: string
}

export function AnalyticsScripts({ ga4Id, metaPixelId }: Props) {
  const { consent } = useConsent()

  const safeGa4Id = ga4Id && GA4_PATTERN.test(ga4Id) ? ga4Id : null
  const safeMetaPixelId = metaPixelId && META_PIXEL_PATTERN.test(metaPixelId) ? metaPixelId : null

  return (
    <>
      {/* GA4 — only if statistics consent */}
      {consent?.statistics && safeGa4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${safeGa4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${safeGa4Id}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel — only if marketing consent */}
      {consent?.marketing && safeMetaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${safeMetaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  )
}
