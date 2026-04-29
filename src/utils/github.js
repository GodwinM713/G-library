// ── GitHub storage layer ──────────────────────────────────────
// Works in both Electron (uses IPC proxy in main.js) and browser (direct fetch).
// In Electron, window.library.gh* are exposed via preload.js.

const isElectron = typeof window !== 'undefined' && !!window.library?.ghFetch;
const FILE_PATH = 'library.json';
const GH_API = 'https://api.github.com';

// ── Config (localStorage) ─────────────────────────────────────
export function getConfig() {
  try { return JSON.parse(localStorage.getItem('plm_gh_config') || 'null'); }
  catch { return null; }
}
export function saveConfig(token, repo) {
  localStorage.setItem('plm_gh_config', JSON.stringify({ token, repo }));
}
export function clearConfig() {
  localStorage.removeItem('plm_gh_config');
}
export function isConfigured() {
  const c = getConfig();
  return !!(c?.token && c?.repo);
}

// ── Web fetch helper ──────────────────────────────────────────
async function webFetch(method, path, body, token) {
  const res = await fetch(`${GH_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `GitHub error ${res.status}`);
  return data;
}

// ── fetchLibrary ──────────────────────────────────────────────
export async function fetchLibrary(token, repo) {
  try {
    let books, sha;
    if (isElectron) {
      const r = await window.library.ghFetch({ token, repo });
      books = r.books; sha = r.sha;
    } else {
      const data = await webFetch('GET', `/repos/${repo}/contents/${FILE_PATH}`, null, token);
      const json = atob(data.content.replace(/\n/g, ''));
      books = JSON.parse(json); sha = data.sha;
    }
    return { books, sha };
  } catch (e) {
    if (e.message?.includes('Not Found') || e.message?.includes('404')) return { books: [], sha: null };
    throw e;
  }
}

// ── pushLibrary ───────────────────────────────────────────────
export async function pushLibrary(books, sha, token, repo) {
  if (isElectron) {
    const r = await window.library.ghPush({ token, repo, books, sha });
    return r.sha;
  }
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(books, null, 2))));
  const body = {
    message: `library sync ${new Date().toISOString()}`,
    content,
    ...(sha ? { sha } : {}),
  };
  const data = await webFetch('PUT', `/repos/${repo}/contents/${FILE_PATH}`, body, token);
  return data.content.sha;
}

// ── verifyConfig ──────────────────────────────────────────────
export async function verifyConfig(token, repo) {
  if (isElectron) return window.library.ghVerify({ token, repo });
  const data = await webFetch('GET', `/repos/${repo}`, null, token);
  return { name: data.full_name, private: data.private };
}
