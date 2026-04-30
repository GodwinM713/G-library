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

// ── GitHub REST helper — attaches status to thrown errors ─────
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

// ── fetchLibrary ──────────────────────────────────────────────
export async function fetchLibrary(token, repo) {
  if (isElectron) {
    const r = await window.library.ghFetch({ token, repo });
    return { books: r.books, sha: r.sha };
  }

  let data;
  try {
    data = await ghFetch('GET', `/repos/${repo}/contents/${FILE_PATH}`, null, token);
  } catch (e) {
    // 404 just means the file hasn't been created yet — start with empty library
    if (e.status === 404) return { books: [], sha: null };

    // 401 / 403 = bad token or wrong repo permissions
    if (e.status === 401 || e.status === 403)
      throw new Error(`GitHub auth failed (${e.status}) — check your token in Sync settings`);

    // Anything else — re-throw with a clear message
    throw new Error(`Could not read library from GitHub: ${e.message}`);
  }

  // Parse the file content
  try {
    const json = fromBase64(data.content);
    const books = JSON.parse(json);
    if (!Array.isArray(books)) throw new Error('library.json is not an array');
    return { books, sha: data.sha };
  } catch (e) {
    throw new Error(`library.json on GitHub is invalid: ${e.message}`);
  }
}

// ── getLatestSha ──────────────────────────────────────────────
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

// ── pushLibrary ───────────────────────────────────────────────
export async function pushLibrary(books, _ignoredSha, token, repo) {
  // Always get a fresh SHA immediately before writing
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
