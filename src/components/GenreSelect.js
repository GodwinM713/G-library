import React, { useState } from 'react';
import { getAllGenres, addCustomGenre } from '../utils/callnum';

// A genre dropdown that includes a "+ Add genre" option and persists custom genres
export default function GenreSelect({ value, onChange }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [err, setErr] = useState('');
  const [genres, setGenres] = useState(getAllGenres());

  const handleAdd = () => {
    const code = newCode.trim().toUpperCase().replace(/[^A-Z]/g,'').slice(0,5);
    const name = newName.trim();
    if (!code || code.length < 2) { setErr('Code must be 2–5 letters.'); return; }
    if (!name) { setErr('Name is required.'); return; }
    if (genres[code]) { setErr(`Code "${code}" already exists.`); return; }
    const updated = addCustomGenre(code, name);
    setGenres(updated);
    setShowAdd(false);
    setNewCode(''); setNewName(''); setErr('');
    onChange(code);
  };

  return (
    <>
      <select value={value} onChange={e => {
        if (e.target.value === '__add__') { setShowAdd(true); return; }
        onChange(e.target.value);
      }}>
        <option value="">Select genre…</option>
        {Object.entries(genres).map(([code, name]) => (
          <option key={code} value={code}>{code} – {name}</option>
        ))}
        <option value="__add__">＋ Add custom genre…</option>
      </select>

      {showAdd && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}
          style={{ position:'fixed', inset:0, background:'rgba(28,24,20,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:400 }}>
          <div style={{ background:'var(--paper)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', width:360, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', background:'var(--paper-2)', borderBottom:'1px solid var(--border)', fontWeight:500, fontSize:14 }}>
              Add custom genre
            </div>
            <div style={{ padding:18, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Code (2–5 letters, e.g. MYS)</label>
                <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,5))}
                  placeholder="e.g. MYS" maxLength={5} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, fontWeight:500, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Genre name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Mystery" onKeyDown={e => e.key==='Enter' && handleAdd()} />
              </div>
              {newCode && (
                <div style={{ fontSize:12, color:'var(--ink-3)' }}>
                  Preview code: <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:500, color:'var(--accent)' }}>{newCode}</span>
                </div>
              )}
              {err && <div style={{ fontSize:12, color:'#9b2020', padding:'6px 10px', background:'#fef2f2', borderRadius:'var(--radius)' }}>{err}</div>}
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={() => { setShowAdd(false); setNewCode(''); setNewName(''); setErr(''); }}>Cancel</button>
                <button className="primary" onClick={handleAdd}>Add genre</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
