/**
 * Inline <script> that sets Google Consent Mode v2 defaults BEFORE gtag.js
 * loads. Must be rendered in <head> for the defaults to take effect on the
 * very first GA / AdSense beacon. If the user has already opted in we also
 * upgrade their stored choice in the same script to avoid a flash of
 * denied-state telemetry.
 */
export function ConsentInit() {
  const inline = `
    (function(){
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
        wait_for_update: 500
      });
      try {
        var raw = window.localStorage.getItem('aply_cookie_consent_v1');
        if (raw) {
          var stored = JSON.parse(raw);
          gtag('consent', 'update', {
            ad_storage: stored.advertising ? 'granted' : 'denied',
            ad_user_data: stored.advertising ? 'granted' : 'denied',
            ad_personalization: stored.advertising ? 'granted' : 'denied',
            analytics_storage: stored.analytics ? 'granted' : 'denied'
          });
        }
      } catch (_) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: inline }} />;
}
