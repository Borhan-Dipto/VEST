import Script from 'next/script';

// IDs come from admin settings (tracking) so they can be changed without code.
export default function Tracking({ t }: { t?: { gtm?: string; ga4?: string; pixel?: string; tiktok?: string } }) {
  const ok = (s?: string) => !!s && /^[A-Z0-9-]+$/i.test(s);
  return (
    <>
      {ok(t?.gtm) && <Script id="gtm" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${t!.gtm}');`}</Script>}
      {ok(t?.ga4) && <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${t!.ga4}`} strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${t!.ga4}',{send_page_view:true});`}</Script>
      </>}
      {ok(t?.pixel) && <Script id="pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${t!.pixel}');`}</Script>}
      {ok(t?.tiktok) && <Script id="ttq" strategy="afterInteractive">{`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;var o=d.createElement("script");o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${t!.tiktok}');ttq.page();}(window,document,'ttq');`}</Script>}
    </>
  );
}
