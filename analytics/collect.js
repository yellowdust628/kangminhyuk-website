import { collectorUrl } from './config.js';

if (collectorUrl && window.location.origin === 'https://www.kangminhyuk.co.kr') {
  const isDrumUp = /^\/drumup\/(?:index\.html)?$/.test(window.location.pathname);
  window.addEventListener('pageshow', () => record(isDrumUp ? 'drumup' : 'page'));

  const apply = document.querySelector('[data-kmh-apply]');
  apply?.addEventListener('click', () => record('apply'));
  apply?.addEventListener('auxclick', event => {
    if (event.button === 1) record('apply');
  });
}

function record(event) {
  fetch(collectorUrl, {
    method: 'POST',
    body: new URLSearchParams({ event }),
    mode: 'no-cors',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    keepalive: true
  }).catch(() => {
    // A blocked or offline request must not interfere with reading or applying.
  });
}
