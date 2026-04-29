// ── Built-in genres ──────────────────────────────────────────
export const DEFAULT_GENRES = {
  FIC: 'Fiction',
  SCI: 'Science',
  HIS: 'History',
  PHI: 'Philosophy',
  BIO: 'Biography',
  TEC: 'Technology',
  ART: 'Art',
  POL: 'Politics',
  PSY: 'Psychology',
  ECO: 'Economics',
  REL: 'Religion',
  LIT: 'Literature',
  MED: 'Medicine',
  PHY: 'Physics',
  MAT: 'Mathematics',
};

export const DEFAULT_GENRE_COLORS = {
  FIC: { bg:'#ede8f7', text:'#4a3580' },
  SCI: { bg:'#e0f2ee', text:'#1a5c47' },
  HIS: { bg:'#faecd8', text:'#7a4010' },
  PHI: { bg:'#e5eef8', text:'#1a3f6f' },
  BIO: { bg:'#e8f5e0', text:'#2a5c1a' },
  TEC: { bg:'#fce8e0', text:'#7a2810' },
  ART: { bg:'#fce8f2', text:'#7a1848' },
  POL: { bg:'#fce8e8', text:'#7a1818' },
  PSY: { bg:'#f0ede8', text:'#4a3820' },
  ECO: { bg:'#fef3e0', text:'#7a5010' },
  REL: { bg:'#e0f2ee', text:'#1a5c47' },
  LIT: { bg:'#ede8f7', text:'#4a3580' },
  MED: { bg:'#e5eef8', text:'#1a3f6f' },
  PHY: { bg:'#e8f5e0', text:'#2a5c1a' },
  MAT: { bg:'#fce8f2', text:'#7a1848' },
};

const CUSTOM_COLOR_PALETTE = [
  { bg:'#fef9e7', text:'#7d6608' },
  { bg:'#eaf4fb', text:'#1a5276' },
  { bg:'#f4ecf7', text:'#6c3483' },
  { bg:'#e8f8f5', text:'#0e6655' },
  { bg:'#fdedec', text:'#922b21' },
  { bg:'#fdfefe', text:'#2e4053' },
];

// ── Persistent genre store ─────────────────────────────────────
const STORAGE_KEY = 'plm_custom_genres';

function loadCustomGenres() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveCustomGenres(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getCustomGenres() { return loadCustomGenres(); }

export function addCustomGenre(code, name) {
  const map = loadCustomGenres();
  map[code] = name;
  saveCustomGenres(map);
  return map;
}

export function getAllGenres() {
  return { ...DEFAULT_GENRES, ...loadCustomGenres() };
}

export function getGenreColor(code) {
  if (DEFAULT_GENRE_COLORS[code]) return DEFAULT_GENRE_COLORS[code];
  // Deterministic colour from custom palette based on code hash
  const sum = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return CUSTOM_COLOR_PALETTE[sum % CUSTOM_COLOR_PALETTE.length];
}

// ── Language codes ─────────────────────────────────────────────
export const LANGUAGE_CODES = {
  EN: 'English',
  ML: 'Malayalam',
  HI: 'Hindi',
  AR: 'Arabic',
  FR: 'French',
  DE: 'German',
  ES: 'Spanish',
  ZH: 'Chinese',
  JA: 'Japanese',
  RU: 'Russian',
  PT: 'Portuguese',
  IT: 'Italian',
  TA: 'Tamil',
  KN: 'Kannada',
  TE: 'Telugu',
  BN: 'Bengali',
  UR: 'Urdu',
  TR: 'Turkish',
  KO: 'Korean',
  OTHER: 'Other',
};

export function getLangCode(lang) {
  if (!lang) return '';
  const upper = lang.trim().toUpperCase();
  // Direct code match
  if (LANGUAGE_CODES[upper]) return upper;
  // Name match
  for (const [code, name] of Object.entries(LANGUAGE_CODES)) {
    if (name.toLowerCase() === lang.toLowerCase()) return code;
  }
  // Return first two letters of the language as fallback
  return lang.trim().slice(0, 2).toUpperCase();
}

// ── Call number generator ──────────────────────────────────────
// Format: GENRE - CUT - LANGCODE - DDC - SEQ
// LANGCODE and DDC are optional; included when available
export function generateCallNum(genre, author, lang, ddc, existingBooks) {
  const g = genre || 'GEN';
  const parts = (author || 'Unknown').split(',');
  const last = parts[0].trim().toUpperCase().replace(/[^A-Z]/g, '');
  const cutter = last.slice(0, 3).padEnd(3, 'X');
  const langCode = getLangCode(lang);
  const ddcPart = ddc ? ddc.toString().trim() : '';
  const siblings = existingBooks.filter(b => b.genre === genre && b.cutter === cutter);
  const seq = String(siblings.length + 1).padStart(3, '0');

  const parts2 = [g, cutter];
  if (langCode) parts2.push(langCode);
  if (ddcPart)  parts2.push(ddcPart);
  parts2.push(seq);

  return { callnum: parts2.join(' - '), cutter };
}
