// Werbe-Schnittstelle. Aktuell AUS – das Spiel läuft komplett ohne Werbung.
//
// Vorbereitet für die Google "Ad Placement API" (AdSense für H5-Spiele):
//   https://developers.google.com/ad-placement
// Zum Aktivieren:
//   1. AdSense-Konto + Freigabe für H5-Games beantragen
//   2. ADS_ENABLED = true und AD_CLIENT eintragen
//   3. Consent-Banner (CMP) einbinden – in der EU/DSGVO Pflicht
//
// Das Spiel ruft nur zwei Funktionen auf:
//   ads.interstitial(name)  – Pause-Werbung zwischen zwei Runden (nicht jede Runde!)
//   ads.rewarded(name)      – Werbung mit Belohnung (hier: "Glas retten"), liefert true/false

const ADS_ENABLED = false;
const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
const TEST_MODE = true; // data-adbreak-test="on" während der Entwicklung

let ready = false;

export const ads = {
  enabled: ADS_ENABLED,

  init() {
    if (!ADS_ENABLED) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
    s.crossOrigin = 'anonymous';
    if (TEST_MODE) s.dataset.adbreakTest = 'on';
    document.head.appendChild(s);
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = (o) => window.adsbygoogle.push(o);
    window.adConfig({ preloadAdBreaks: 'on', sound: 'on', onReady: () => { ready = true; } });
  },

  interstitial(name, { beforeAd, afterAd } = {}) {
    return new Promise((resolve) => {
      if (!ADS_ENABLED || !ready) return resolve();
      window.adBreak({ type: 'next', name, beforeAd, afterAd, adBreakDone: () => resolve() });
    });
  },

  rewarded(name, { beforeAd, afterAd } = {}) {
    return new Promise((resolve) => {
      // Ohne Werbung gibt es die Belohnung gratis
      if (!ADS_ENABLED) return resolve(true);
      if (!ready) return resolve(false);
      let granted = false;
      window.adBreak({
        type: 'reward', name, beforeAd, afterAd,
        beforeReward: (showAdFn) => showAdFn(),
        adViewed: () => { granted = true; },
        adDismissed: () => { granted = false; },
        adBreakDone: () => resolve(granted),
      });
    });
  },
};
