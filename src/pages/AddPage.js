import React, { useState, useMemo } from 'react';
import { getAllGenres, generateCallNum, LANGUAGE_CODES, getLangCode } from '../utils/callnum';
import DDCFetcher from '../components/DDCFetcher';
import GenreSelect from '../components/GenreSelect';

// ── Client-side normalizer (no AI / no Electron needed) ─────
const LOWERCASE_WORDS = new Set([
  'a','an','the','and','but','or','nor','for','so','yet',
  'at','by','in','of','off','on','per','to','up','via',
]);
function toTitleCase(str) {
  if (!str) return str;
  const words = str.trim().split(/\s+/);
  return words.map((word, i) => {
    if (word.length > 1 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)) return word;
    const lower = word.toLowerCase();
    if (i === 0 || i === words.length - 1 || !LOWERCASE_WORDS.has(lower))
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    return lower;
  }).join(' ');
}
const CORRECTIONS = {
  'teh':'the','hte':'the','adn':'and','nad':'and','recieve':'receive',
  'beleive':'believe','wierd':'weird','occured':'occurred','seperate':'separate',
  'definately':'definitely','untill':'until','goverment':'government',
  'persausion':'persuasion','persuation':'persuasion',
  'litterature':'literature','litarature':'literature',
  'philosphy':'philosophy','philoshopy':'philosophy',
  'biograpy':'biography','biograhpy':'biography',
  'scince':'science','sience':'science',
  'historey':'history','histroy':'history',
  'ficton':'fiction','fictoin':'fiction',
};
function spellCorrect(str) {
  if (!str) return str;
  return str.split(/\s+/).map(word => {
    const lower = word.toLowerCase();
    if (CORRECTIONS[lower]) {
      const fixed = CORRECTIONS[lower];
      return word[0] === word[0].toUpperCase()
        ? fixed.charAt(0).toUpperCase() + fixed.slice(1) : fixed;
    }
    return word;
  }).join(' ');
}
function normalizeAuthor(str) {
  if (!str) return str;
  str = str.trim();
  if (str.includes(',')) {
    return str.split(',').map(p => toTitleCase(p.trim())).join(', ');
  }
  const parts = str.split(/\s+/);
  if (parts.length >= 2) {
    const last  = toTitleCase(parts[parts.length - 1]);
    const first = parts.slice(0, -1).map(p => toTitleCase(p)).join(' ');
    return `${last}, ${first}`;
  }
  return toTitleCase(str);
}
function clientNormalize(title, author) {
  return {
    title:  title  ? toTitleCase(spellCorrect(title))   : undefined,
    author: author ? normalizeAuthor(spellCorrect(author)) : undefined,
  };
}

const EMPTY = {
  title:'', author:'', genre:'', sub:'', ddc:'',
  ownership:'owned', status:'unread',
  shelf:'', window_loc:'', lended_to:'',
  lang:'EN', notes:'',
};

const LBL = { fontSize:12, fontWeight:500, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' };
const FG  = { display:'flex', flexDirection:'column', gap:5 };

export default function AddPage({ books, onAdd, onNav }) {
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [showDDC, setShowDDC]   = useState(false);
  const [normMsg, setNormMsg]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isLended = form.ownership === 'lended';

  const ownedBooks = useMemo(() => books.filter(b => b.ownership !== 'lended'), [books]);

  const preview = useMemo(() => {
    if (isLended || !form.genre || !form.author) return null;
    return generateCallNum(form.genre, form.author, form.lang, form.ddc, ownedBooks);
  }, [form.genre, form.author, form.lang, form.ddc, ownedBooks, isLended]);

  // Client-side normalizer — title-case + basic spell corrections
  const handleNormalize = () => {
    if (!form.title.trim() && !form.author.trim()) {
      setNormMsg('Enter a title or author first.');
      setTimeout(() => setNormMsg(''), 3000);
      return;
    }
    const res = clientNormalize(form.title, form.author);
    setForm(f => ({
      ...f,
      ...(res.title  ? { title:  res.title  } : {}),
      ...(res.author ? { author: res.author } : {}),
    }));
    setNormMsg('ok');
    setTimeout(() => setNormMsg(''), 3000);
  };

  const handleAdd = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!isLended && !form.genre) { setError('Genre is required for owned books.'); return; }
    if (!isLended && !form.author.trim()) { setError('Author is required for owned books.'); return; }
    setError(''); setSaving(true);

    let callnum = '', cutter = '';
    if (!isLended) {
      const cn = generateCallNum(form.genre, form.author, form.lang, form.ddc, ownedBooks);
      callnum = cn.callnum; cutter = cn.cutter;
    }
    await onAdd({ ...form, callnum, cutter, added: new Date().toISOString().slice(0,10) });
    setForm({ ...EMPTY }); setSaving(false); onNav('search');
  };

  // Single setForm call so all DDC fields update atomically
  const applyDDC = r => {
    setForm(f => ({
      ...f,
      ...(r.title      ? { title:  r.title      } : {}),
      ...(r.author     ? { author: r.author     } : {}),
      ...(r.ddc        ? { ddc:    r.ddc        } : {}),
      ...(r.genre_code ? { genre:  r.genre_code } : {}),
      ...(r.sub        ? { sub:    r.sub        } : {}),
    }));
  };

  const genres = getAllGenres();

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 28px', maxWidth:680 }}>

      {/* Ownership toggle */}
      <div style={{ display:'flex', gap:0, marginBottom:20, border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', width:'fit-content' }}>
        {[['owned','◈  Owned book'],['lended','⇥  Lended-out book']].map(([val,label]) => (
          <button key={val} onClick={() => set('ownership', val)} style={{
            borderRadius:0, border:'none',
            background: form.ownership===val ? (val==='lended' ? '#4a3580' : 'var(--accent)') : 'transparent',
            color: form.ownership===val ? '#fff' : 'var(--ink-3)',
            padding:'8px 20px', fontSize:13, fontWeight:500,
            borderRight: val==='owned' ? '1px solid var(--border)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {/* Lended banner */}
      {isLended && (
        <div style={{ background:'#ede8f7', border:'1px solid #c9bfef', borderLeft:'3px solid #4a3580', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:18, fontSize:13, color:'#4a3580', lineHeight:1.6 }}>
          Lended-out books don't receive a call number. Just record the title, who has it, and where it lives.
        </div>
      )}

      {/* Call-number preview (owned) */}
      {!isLended && (
        <div style={{ background:'var(--paper-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:500, color: preview ? 'var(--accent)' : 'var(--ink-3)', minWidth:160 }}>
            {preview ? preview.callnum : '- - -'}
          </div>
          <div style={{ fontSize:12, color:'var(--ink-3)', lineHeight:1.6 }}>
            {preview
              ? `${genres[form.genre]||form.genre} - author - ${getLangCode(form.lang)||'lang'} - DDC - seq`
              : 'Fill genre + author to preview call number'}
          </div>
        </div>
      )}

      {/* AI tools bar */}
      {!isLended && (
        <div style={{ display:'flex', gap:8, marginBottom:18, alignItems:'center', flexWrap:'wrap' }}>
          <button
            onClick={handleNormalize}
            style={{ fontSize:12, display:'flex', alignItems:'center', gap:5 }}
          >
            ✦ Fix names & spelling
          </button>

          <button onClick={() => setShowDDC(true)} style={{ fontSize:12, display:'flex', alignItems:'center', gap:5, color:'var(--green)' }}>
            ⊞ Fetch DDC + genre
          </button>

          {normMsg === 'ok' && (
            <span style={{ fontSize:12, color:'var(--green)' }}>✓ Names corrected</span>
          )}
          {normMsg && normMsg !== 'ok' && (
            <span style={{ fontSize:12, color:'#9b2020' }}>{normMsg}</span>
          )}
        </div>
      )}

      {/* Form grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 16px' }}>

        <div style={{ ...FG, gridColumn:'1/-1' }}>
          <label style={LBL}>Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Book title" />
        </div>

        {!isLended && (
          <div style={{ ...FG, gridColumn:'1/-1' }}>
            <label style={LBL}>Author * (Last, First)</label>
            <input value={form.author} onChange={e => set('author', e.target.value)} placeholder="e.g. Orwell, George" />
          </div>
        )}

        {!isLended && (
          <div style={FG}>
            <label style={LBL}>Genre *</label>
            <GenreSelect value={form.genre} onChange={v => set('genre', v)} />
          </div>
        )}

        {!isLended && (
          <div style={FG}>
            <label style={LBL}>Sub-genre / Topic</label>
            <input value={form.sub} onChange={e => set('sub', e.target.value)} placeholder="e.g. Dystopia, Quantum" />
          </div>
        )}

        {!isLended && (
          <div style={FG}>
            <label style={LBL}>DDC number</label>
            <input value={form.ddc} onChange={e => set('ddc', e.target.value)} placeholder="e.g. 823.914" />
          </div>
        )}

        {!isLended && (
          <div style={FG}>
            <label style={LBL}>Language</label>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <select value={form.lang} onChange={e => set('lang', e.target.value)} style={{ flex:1 }}>
                {Object.entries(LANGUAGE_CODES).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:500, color:'var(--accent)', background:'var(--accent-bg)', padding:'8px 10px', borderRadius:'var(--radius)', border:'1px solid var(--border)', minWidth:40, textAlign:'center' }}>
                {form.lang || '—'}
              </div>
            </div>
          </div>
        )}

        {!isLended && (
          <div style={FG}>
            <label style={LBL}>Reading status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="unread">Unread</option>
              <option value="reading">Currently reading</option>
              <option value="read">Read</option>
            </select>
          </div>
        )}

        {isLended && (
          <div style={{ ...FG, gridColumn:'1/-1' }}>
            <label style={LBL}>Lended to (person's name)</label>
            <input value={form.lended_to} onChange={e => set('lended_to', e.target.value)} placeholder="e.g. Rahul Menon" />
          </div>
        )}

        <div style={FG}>
          <label style={LBL}>Shelf</label>
          <input value={form.shelf} onChange={e => set('shelf', e.target.value)} placeholder="e.g. Shelf A" />
        </div>

        <div style={FG}>
          <label style={LBL}>Window address</label>
          <input value={form.window_loc} onChange={e => set('window_loc', e.target.value)} placeholder="e.g. Window 2, Row 3" />
        </div>

        <div style={{ ...FG, gridColumn:'1/-1' }}>
          <label style={LBL}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Optional notes…" />
        </div>
      </div>

      {error && (
        <div style={{ marginTop:12, fontSize:13, color:'#9b2020', padding:'8px 12px', background:'#fef2f2', borderRadius:'var(--radius)' }}>{error}</div>
      )}

      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
        <button onClick={() => setForm({ ...EMPTY })}>Clear</button>
        <button className="primary" onClick={handleAdd} disabled={saving}>
          {saving ? 'Saving…' : isLended ? 'Record lended book' : 'Add to library'}
        </button>
      </div>

      {showDDC && (
        <DDCFetcher
          title={form.title}
          author={form.author}
          onApply={applyDDC}
          onClose={() => setShowDDC(false)}
        />
      )}
    </div>
  );
}
