import React, { useState } from 'react';
import { getAllGenres, getGenreColor, LANGUAGE_CODES } from '../utils/callnum';
import GenreSelect from './GenreSelect';

const STATUS_LABEL = { read: 'Read', reading: 'Currently reading', unread: 'Unread' };
const LBL = { fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' };
const FG  = { display: 'flex', flexDirection: 'column', gap: 5 };

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:'flex', gap:12, fontSize:13, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ color:'var(--ink-3)', minWidth:100 }}>{label}</span>
      <span style={{ color:'var(--ink)', fontWeight:500 }}>{value}</span>
    </div>
  );
}

export default function BookDetail({ book, onClose, onDelete, onUpdate, onCycleStatus }) {
  // ALL hooks must come before any conditional return
  const [mode, setMode]     = useState('view');
  const [form, setForm]     = useState(book || {});
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  // Now safe to return early
  if (!book) return null;

  const genres   = getAllGenres();
  const isLended = book.ownership === 'lended';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title?.trim()) { setErr('Title is required.'); return; }
    setSaving(true); setErr('');
    try { await onUpdate({ ...form }); setMode('view'); }
    catch (e) { setErr(e.message || 'Save failed.'); }
    setSaving(false);
  };

  const handleCancel = () => { setForm({ ...book }); setErr(''); setMode('view'); };

  // ── VIEW ─────────────────────────────────────────────────────
  if (mode === 'view') {
    const b  = form;
    const gc = getGenreColor(b.genre);
    const iL = b.ownership === 'lended';
    return (
      <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{ position:'fixed', inset:0, background:'rgba(28,24,20,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
        <div style={{ background:'var(--paper)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', boxShadow:'var(--shadow-lg)', width:500, maxWidth:'90vw', display:'flex', flexDirection:'column', overflow:'hidden', maxHeight:'90vh' }}>

          <div style={{ padding:'20px 24px 16px', background: iL ? '#f7f4fd' : 'var(--paper-2)', borderBottom:'1px solid var(--border)' }}>
            {iL
              ? <div style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20, background:'#4a3580', color:'#fff', marginBottom:10, letterSpacing:'0.04em' }}>LENDED OUT</div>
              : <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:500, color:'var(--accent)', marginBottom:6, letterSpacing:'0.04em' }}>{b.callnum}</div>
            }
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:500, color:'var(--ink)', lineHeight:1.3, marginBottom:4 }}>{b.title}</div>
            {!iL && <div style={{ fontSize:14, color:'var(--ink-3)' }}>{b.author || 'Unknown author'}</div>}
            {iL && b.lended_to && <div style={{ fontSize:14, color:'#4a3580' }}>Lended to: <strong>{b.lended_to}</strong></div>}
            {!iL && b.genre && (
              <span style={{ display:'inline-block', marginTop:10, fontSize:12, fontWeight:500, background:gc.bg, color:gc.text, borderRadius:20, padding:'3px 10px' }}>
                {genres[b.genre] || b.genre}
              </span>
            )}
          </div>

          <div style={{ padding:'12px 24px 16px', display:'flex', flexDirection:'column', overflowY:'auto' }}>
            {!iL && <Row label="Sub-genre" value={b.sub} />}
            {!iL && <Row label="Status"    value={STATUS_LABEL[b.status] || b.status} />}
            {!iL && <Row label="DDC"       value={b.ddc} />}
            <Row label="Shelf"     value={b.shelf} />
            <Row label="Window"    value={b.window_loc} />
            {iL  && <Row label="Lended to" value={b.lended_to} />}
            {!iL && <Row label="Language"  value={b.lang} />}
            <Row label="Added"     value={b.added} />
            {b.notes && (
              <div style={{ marginTop:12, padding:12, background:'var(--paper-2)', borderRadius:'var(--radius)', fontSize:13, color:'var(--ink-2)', fontStyle:'italic', lineHeight:1.6 }}>{b.notes}</div>
            )}
          </div>

          <div style={{ display:'flex', gap:8, padding:'12px 24px', borderTop:'1px solid var(--border)', justifyContent:'space-between', alignItems:'center' }}>
            <button className="danger ghost" onClick={onDelete}>Delete</button>
            <div style={{ display:'flex', gap:8 }}>
              {!iL && <button onClick={() => onCycleStatus(b)}>Status ↻</button>}
              <button onClick={() => { setForm({ ...book }); setMode('edit'); }}>✎ Edit</button>
              <button className="primary" onClick={onClose}>Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EDIT ─────────────────────────────────────────────────────
  return (
    <div onClick={e => { if (e.target === e.currentTarget) handleCancel(); }}
      style={{ position:'fixed', inset:0, background:'rgba(28,24,20,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
      <div style={{ background:'var(--paper)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', boxShadow:'var(--shadow-lg)', width:540, maxWidth:'92vw', display:'flex', flexDirection:'column', overflow:'hidden', maxHeight:'92vh' }}>

        <div style={{ padding:'16px 22px', background:'var(--paper-2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:500 }}>Edit book</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:'var(--accent)' }}>{book.callnum || (isLended ? 'Lended' : '')}</div>
        </div>

        <div style={{ padding:'18px 22px', overflowY:'auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 16px' }}>

          <div style={{ ...FG, gridColumn:'1/-1' }}>
            <label style={LBL}>Title *</label>
            <input value={form.title || ''} onChange={e => set('title', e.target.value)} />
          </div>

          {!isLended && (
            <div style={{ ...FG, gridColumn:'1/-1' }}>
              <label style={LBL}>Author (Last, First)</label>
              <input value={form.author || ''} onChange={e => set('author', e.target.value)} />
            </div>
          )}

          {!isLended && (
            <div style={FG}>
              <label style={LBL}>Genre</label>
              <GenreSelect value={form.genre || ''} onChange={v => set('genre', v)} />
            </div>
          )}

          {!isLended && (
            <div style={FG}>
              <label style={LBL}>Sub-genre</label>
              <input value={form.sub || ''} onChange={e => set('sub', e.target.value)} placeholder="e.g. Dystopia" />
            </div>
          )}

          {!isLended && (
            <div style={FG}>
              <label style={LBL}>DDC</label>
              <input value={form.ddc || ''} onChange={e => set('ddc', e.target.value)} placeholder="e.g. 823.914" />
            </div>
          )}

          {!isLended && (
            <div style={FG}>
              <label style={LBL}>Language</label>
              <select value={form.lang || 'EN'} onChange={e => set('lang', e.target.value)}>
                {Object.entries(LANGUAGE_CODES).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {!isLended && (
            <div style={{ ...FG, gridColumn:'1/-1' }}>
              <label style={LBL}>Reading status</label>
              <select value={form.status || 'unread'} onChange={e => set('status', e.target.value)}>
                <option value="unread">Unread</option>
                <option value="reading">Currently reading</option>
                <option value="read">Read</option>
              </select>
            </div>
          )}

          {isLended && (
            <div style={{ ...FG, gridColumn:'1/-1' }}>
              <label style={LBL}>Lended to</label>
              <input value={form.lended_to || ''} onChange={e => set('lended_to', e.target.value)} placeholder="Person's name" />
            </div>
          )}

          <div style={FG}>
            <label style={LBL}>Shelf</label>
            <input value={form.shelf || ''} onChange={e => set('shelf', e.target.value)} placeholder="e.g. Shelf A" />
          </div>

          <div style={FG}>
            <label style={LBL}>Window address</label>
            <input value={form.window_loc || ''} onChange={e => set('window_loc', e.target.value)} placeholder="e.g. Window 2, Row 3" />
          </div>

          <div style={{ ...FG, gridColumn:'1/-1' }}>
            <label style={LBL}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
        </div>

        {err && (
          <div style={{ margin:'0 22px 12px', fontSize:13, color:'#9b2020', padding:'8px 12px', background:'#fef2f2', borderRadius:'var(--radius)' }}>{err}</div>
        )}

        <div style={{ display:'flex', gap:8, padding:'12px 22px', borderTop:'1px solid var(--border)', justifyContent:'flex-end' }}>
          <button onClick={handleCancel}>Cancel</button>
          <button className="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}
