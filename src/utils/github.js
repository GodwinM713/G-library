// ── GitHub storage layer ──────────────────────────────────────

const isElectron = typeof window !== 'undefined' && !!window.library?.ghFetch;
const FILE_PATH  = 'library.json';
const GH_API     = 'https://api.github.com';

// ── Config ────────────────────────────────────────────────────
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

// ── Safe base64 encode/decode that handles ALL Unicode ────────
function toBase64(str) {
  // Encode the string to UTF-8 bytes, then to base64
  const bytes = new TextEncoder().encode(str);
  let binary  = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64(b64) {
  // Decode base64 to bytes, then interpret as UTF-8
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

// ── GitHub REST helper ────────────────────────────────────────
async function ghFetch(method, path, body, token) {
  const res = await fetch(`${GH_API}${path}`, {
    method,
    headers: {
      Authorization:          `Bearer ${token}`,
      Accept:                 'application/vnd.github+json',
      'Content-Type':         'application/json',
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
    if (isElectron) {
      const r = await window.library.ghFetch({ token, repo });
      return { books: r.books, sha: r.sha };
    }
    const data = await ghFetch('GET', `/repos/${repo}/contents/${FILE_PATH}`, null, token);
    const json = fromBase64(data.content);   // ← safe UTF-8 decode
    return { books: JSON.parse(json), sha: data.sha };
  } catch (e) {
    if (e.message?.includes('Not Found') || e.message?.includes('404'))
      return { books: [], sha: null };
    throw e;
  }
}

// ── pushLibrary ───────────────────────────────────────────────
export async function pushLibrary(books, sha, token, repo) {
  if (isElectron) {
    const r = await window.library.ghPush({ token, repo, books, sha });
    return r.sha;
  }
  // ← safe UTF-8 encode — no double-encoding of - or any Unicode
  const content = toBase64(JSON.stringify(books, null, 2));
  const body = {
    message: `library sync ${new Date().toISOString()}`,
    content,
    ...(sha ? { sha } : {}),
  };
  const data = await ghFetch('PUT', `/repos/${repo}/contents/${FILE_PATH}`, body, token);
  return data.content.sha;
}

// ── verifyConfig ──────────────────────────────────────────────
export async function verifyConfig(token, repo) {
  if (isElectron) return window.library.ghVerify({ token, repo });
  const data = await ghFetch('GET', `/repos/${repo}`, null, token);
  return { name: data.full_name, private: data.private };
}
