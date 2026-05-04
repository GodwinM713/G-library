// ── GitHub storage layer ──────────────────────────────────────

const isElectron = typeof window !== 'undefined' && !!window.library?.ghFetch;
const FILE_PATH  = 'library.json';
const GH_API     = 'https://api.github.com';

// ── Read-only public config ───────────────────────────────────
// Set these in Vercel → Project → Settings → Environment Variables.
// Use a GitHub fine-grained token with Contents: Read-only on your data repo.
// Safe to embed in built JS — it literally cannot write anything.
const RO_TOKEN = process.env.REACT_APP_RO_TOKEN || '';
const RO_REPO  = process.env.REACT_APP_RO_REPO  || '';

// ── Read-write config (owner's browser only) ──────────────────
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

// Returns true if the owner's read-write token is present
export function isConfigured() {
  const c = getConfig();
  return !!(c?.token && c?.repo);
}

// Returns true if at least read-only access is available (owner OR baked-in RO token)
export function isReadable() {
  return isConfigured() || !!(RO_TOKEN && RO_REPO);
}

// Returns the best available token+repo for READ operations:
//   owner's RW token if present, otherwise the baked-in RO token
function getReadConfig() {
  const rw = getConfig();
  if (rw?.token && rw?.repo) return { token: rw.token, repo: rw.repo };
  if (RO_TOKEN && RO_REPO)   return { token: RO_TOKEN, repo: RO_REPO };
  return null;
}

// ── Safe base64 for all Unicode ───────────────────────────────
function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}
function fromBase64(b64) {
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
  if (!res.ok) {
    const err = new Error(data.message || `GitHub error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── fetchLibrary — uses best available read token ─────────────
export async function fetchLibrary(token, repo) {
  // If called without explicit args (viewer path), use best available
  const cfg = (token && repo) ? { token, repo } : getReadConfig();
  if (!cfg) throw new Error('No read access configured');

  if (isElectron) {
    const r = await window.library.ghFetch({ token: cfg.token, repo: cfg.repo });
    return { books: r.books, sha: r.sha };
  }

  let data;
  try {
    data = await ghFetch('GET', `/repos/${cfg.repo}/contents/${FILE_PATH}`, null, cfg.token);
  } catch (e) {
    if (e.status === 404) return { books: [], sha: null };
    if (e.status === 401 || e.status === 403)
      throw new Error(`GitHub auth failed (${e.status}) — check your token in Sync settings`);
    throw new Error(`Could not read library from GitHub: ${e.message}`);
  }

  try {
    const json = fromBase64(data.content);
    const books = JSON.parse(json);
    if (!Array.isArray(books)) throw new Error('library.json is not an array');
    return { books, sha: data.sha };
  } catch (e) {
    throw new Error(`library.json on GitHub is invalid: ${e.message}`);
  }
}

// ── getLatestSha — only used for writes, requires RW token ────
async function getLatestSha(token, repo) {
  try {
    if (isElectron) {
      const r = await window.library.ghFetch({ token, repo });
      return r.sha;
    }
    const data = await ghFetch('GET', `/repos/${repo}/contents/${FILE_PATH}`, null, token);
    return data.sha;
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

// ── pushLibrary — always requires owner's RW token ────────────
export async function pushLibrary(books, _ignoredSha, token, repo) {
  // Require explicit RW token — never falls back to RO token
  if (!token || !repo) throw new Error('Write token required');

  const currentSha = await getLatestSha(token, repo);

  if (isElectron) {
    const r = await window.library.ghPush({ token, repo, books, sha: currentSha });
    return r.sha;
  }

  const content = toBase64(JSON.stringify(books, null, 2));
  const body = {
    message: `library sync ${new Date().toISOString()}`,
    content,
    ...(currentSha ? { sha: currentSha } : {}),
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
