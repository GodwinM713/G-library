import React from 'react';
import { getAllGenres, LANGUAGE_CODES } from '../utils/callnum';

export default function NumberingGuideModal({ onClose }) {
  const genres = getAllGenres();
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(28,24,20,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
      <div style={{ background:'var(--paper)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', width:580, maxWidth:'92vw', maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        <div style={{ padding:'16px 20px', background:'var(--paper-2)', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:500 }}>Numbering guide</div>
          <button className="ghost" onClick={onClose} style={{ fontSize:18 }}>×</button>
        </div>

        <div style={{ padding:'20px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Format */}
          <div style={{ background:'var(--accent-bg)', borderRadius:'var(--radius-lg)', padding:'16px 20px', textAlign:'center', fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:500, color:'var(--accent)', letterSpacing:'0.08em', border:'1px solid var(--border)' }}>
            FIC · ORW · ML · 823.914 · 001
          </div>

          {/* Breakdown blocks */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              ['FIC',     'Genre',     '3–5 letter genre code'],
              ['ORW',     'Author',    'First 3 letters of last name'],
              ['ML',      'Language',  'Language code (EN, ML, HI…)'],
              ['823.914', 'DDC',       'Dewey Decimal number (optional)'],
              ['001',     'Sequence',  'Copy number within genre+author'],
            ].map(([val, label, desc]) => (
              <div key={val} style={{ flex:'1 1 80px', background:'var(--paper-2)', borderRadius:'var(--radius)', padding:'10px 12px', display:'flex', flexDirection:'column', gap:3, alignItems:'center', textAlign:'center', minWidth:80 }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:15, fontWeight:500, color:'var(--accent)' }}>{val}</div>
                <div style={{ fontSize:11, fontWeight:500, color:'var(--ink-2)' }}>{label}</div>
                <div style={{ fontSize:10, color:'var(--ink-3)', lineHeight:1.5 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Genre codes */}
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--ink-2)', marginBottom:8 }}>Genre codes</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5 }}>
              {Object.entries(genres).map(([code, name]) => (
                <div key={code} style={{ display:'flex', gap:8, alignItems:'center', padding:'5px 8px', background:'var(--paper-2)', borderRadius:'var(--radius)', fontSize:12 }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:500, color:'var(--accent)', minWidth:36 }}>{code}</span>
                  <span style={{ color:'var(--ink-3)' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Language codes */}
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--ink-2)', marginBottom:8 }}>Language codes</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:5 }}>
              {Object.entries(LANGUAGE_CODES).filter(([c]) => c !== 'OTHER').map(([code, name]) => (
                <div key={code} style={{ display:'flex', gap:6, alignItems:'center', padding:'4px 8px', background:'var(--paper-2)', borderRadius:'var(--radius)', fontSize:12 }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontWeight:500, color:'var(--blue)', minWidth:28 }}>{code}</span>
                  <span style={{ color:'var(--ink-3)' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div style={{ background:'var(--paper-2)', borderLeft:'3px solid var(--accent-2)', borderRadius:'0 var(--radius) var(--radius) 0', padding:'12px 16px', fontSize:13, color:'var(--ink-2)', lineHeight:1.7 }}>
            <strong style={{ display:'block', marginBottom:4, color:'var(--ink)' }}>Labelling your books</strong>
            Write the call number on a spine label, 2 cm from the bottom. Sort shelves by genre → author code → sequence.
            Lended books have no call number — use Shelf + Window to record where they normally live.
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
