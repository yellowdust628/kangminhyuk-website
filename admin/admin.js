import { collectorUrl, signInUrl } from '../analytics/config.js';

const signIn = document.querySelector('#sign-in');
const status = document.querySelector('#status');
const proofKey = 'kmh-admin-proof';
const tokenPattern = /^[a-f0-9]{64}$/;
const totalIds = ['total-pages', 'total-drumup', 'total-apply', 'total-news', 'total-youtube', 'total-instagram', 'total-book'];

if (!collectorUrl || !signInUrl) {
  signIn.disabled = true;
  status.textContent = '방문 통계가 아직 연결되지 않았습니다.';
} else {
  signIn.addEventListener('click', openGoogleSignIn);
  const code = new URLSearchParams(window.location.hash.slice(1)).get('code');
  if (code) {
    history.replaceState(null, '', window.location.pathname);
    loadAnalytics(code);
  }
}

async function openGoogleSignIn() {
  signIn.disabled = true;
  try {
    const proof = toHex(crypto.getRandomValues(new Uint8Array(32)));
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(proof));
    const url = new URL(signInUrl);
    url.searchParams.set('challenge', toHex(new Uint8Array(digest)));
    sessionStorage.setItem(proofKey, proof);
    window.location.assign(url.href);
  } catch {
    signIn.disabled = false;
    status.textContent = 'Google 로그인 창을 열지 못했습니다. 브라우저에서 다시 시도해 주세요.';
  }
}

async function loadAnalytics(code) {
  signIn.disabled = true;
  status.textContent = '통계를 불러오는 중입니다.';
  try {
    const proof = sessionStorage.getItem(proofKey);
    sessionStorage.removeItem(proofKey);
    if (!tokenPattern.test(code) || !tokenPattern.test(proof || '')) {
      status.textContent = '로그인이 만료되었습니다. 이 탭에서 Google 계정으로 다시 열어 주세요.';
      return;
    }

    const response = await fetch(collectorUrl, {
      method: 'POST',
      body: new URLSearchParams({ event: 'read', code, proof, detail: '1' }),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer'
    });
    if (!response.ok) throw new Error('Analytics request failed');
    const result = await response.json();
    if (result.error === 'login') {
      status.textContent = '로그인이 만료되었습니다. Google 계정으로 다시 열어 주세요.';
      return;
    }
    if (!result.ok) throw new Error('Analytics request rejected');
    showAnalytics(result);
  } catch {
    status.textContent = '통계를 불러오지 못했습니다. 잠시 후 Google 계정으로 다시 열어 주세요.';
  } finally {
    signIn.disabled = false;
  }
}

function showAnalytics({ totals, days }) {
  const format = new Intl.NumberFormat('ko-KR');
  const formatCount = count => count == null ? '—' : format.format(count);
  totalIds.forEach((id, index) => {
    document.getElementById(id).textContent = formatCount(totals[index]);
  });
  const table = document.querySelector('#days');
  days.forEach(([date, ...counts]) => {
    const row = table.insertRow();
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = date;
    row.append(heading);
    totalIds.forEach((_, index) => { row.insertCell().textContent = formatCount(counts[index]); });
  });
  if (days.length === 0) {
    const cell = table.insertRow().insertCell();
    cell.colSpan = totalIds.length + 1;
    cell.textContent = '최근 30일에 집계된 기록이 없습니다.';
  }

  document.querySelector('#dashboard').hidden = false;
  document.querySelector('#login').hidden = true;
  status.textContent = '';
}

function toHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
