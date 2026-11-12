import { collectorUrl } from './config.js';

if (collectorUrl && window.location.origin === 'https://www.kangminhyuk.co.kr') {
  const isDrumUp = /^\/drumup\/(?:index\.html)?$/.test(window.location.pathname);
  const news = document.querySelector('[data-kmh-news]');
  window.addEventListener('pageshow', () => {
    record(isDrumUp ? 'drumup' : 'page');
    if (news && 'IntersectionObserver' in window) observeNews(news);
  });

  for (const link of document.querySelectorAll('a[data-kmh-event], a[data-kmh-apply]')) {
    const eventName = link.dataset.kmhEvent || 'apply';
    link.addEventListener('click', () => record(eventName));
    link.addEventListener('auxclick', event => {
      if (event.button === 1) record(eventName);
    });
  }
}

function observeNews(heading) {
  let inView = false;
  const observer = new IntersectionObserver(entries => {
    const entry = entries[entries.length - 1];
    inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
    countWhenVisible();
  }, { threshold: 0.5 });

  function countWhenVisible() {
    if (!inView || document.hidden) return;
    stopObserving();
    record('news');
  }

  function stopObserving() {
    observer.disconnect();
    observer.takeRecords();
    document.removeEventListener('visibilitychange', countWhenVisible);
    window.removeEventListener('pagehide', stopObserving);
  }

  document.addEventListener('visibilitychange', countWhenVisible);
  window.addEventListener('pagehide', stopObserving);
  observer.observe(heading);
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
