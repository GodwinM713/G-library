import React from 'react';
import { getAllGenres, getGenreColor } from '../utils/callnum';

const STATUS_LABEL = { read:'Read', reading:'Currently reading', unread:'Unread' };

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:'flex', gap:12, fontSize:13, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ color:'var(--ink-3)', minWidth:100 }}>{label}</span>
      <span style={{ color:'var(--ink)', fontWeight:500 }}>{value}</span>
    </div>
  );
}

export default function BookDetail({ book, onClose, onDelete, onCycleStatus }) {
  if (!book) return null;
  const genres = getAllGenres();
  const gc = getGenreColor(book.genre);
  const isLended = book.ownership === 'lended';

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(28,24,20,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
      <div style={{
        background:'var(--paper)', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)',
        boxShadow:'var(--shadow-lg)', width:500, maxWidth:'90vw', display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ padding:'20px 24px 16px', background: isLended ? '#f7f4fd' : 'var(--paper-2)', borderBottom:'1px solid var(--border)' }}>
          {isLended ? (
            <div style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20, background:'#4a3580', color:'#fff', marginBottom:10, letterSpacing:'0.04em' }}>
              LENDED OUT
            </div>
          ) : (
            <div style={{ fontFamily:"'DM Mono', monospace", fontSize:13, fontWeight:500, color:'var(--accent)', marginBottom:6, letterSpacing:'0.04em' }}>
              {book.callnum}
            </div>
          )}
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:500, color:'var(--ink)', lineHeight:1.3, marginBottom:4 }}>
            {book.title}
          </div>
          {!isLended && <div style={{ fontSize:14, color:'var(--ink-3)' }}>{book.author || 'Unknown author'}</div>}
          {isLended && book.lended_to && <div style={{ fontSize:14, color:'#4a3580' }}>Lended to: <strong>{book.lended_to}</strong></div>}
          {!isLended && book.genre && (
            <span style={{ display:'inline-block', marginTop:10, fontSize:12, fontWeight:500, background:gc.bg, color:gc.text, borderRadius:20, padding:'3px 10px' }}>
              {genres[book.genre] || book.genre}
            </span>
          )}
        </div>

        {/* Details */}
        <div style={{ padding:'12px 24px 16px', display:'flex', flexDirection:'column' }}>
          {!isLended && <Row label="Sub-genre" value={book.sub} />}
          {!isLended && <Row label="Status" value={STATUS_LABEL[book.status] || book.status} />}
          {!isLended && <Row label="DDC" value={book.ddc} />}
          <Row label="Shelf" value={book.shelf} />
          <Row label="Window" value={book.window_loc} />
          {!isLended && <Row label="Language" value={book.lang} />}
          <Row label="Added" value={book.added} />
          {book.notes && (
            <div style={{ marginTop:12, padding:12, background:'var(--paper-2)', borderRadius:'var(--radius)', fontSize:13, color:'var(--ink-2)', fontStyle:'italic', lineHeight:1.6 }}>
              {book.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:8, padding:'12px 24px', borderTop:'1px solid var(--border)', justifyContent:'space-between', alignItems:'center' }}>
          <button className="danger ghost" onClick={onDelete}>Delete book</button>
          <div style={{ display:'flex', gap:8 }}>
            {!isLended && <button onClick={() => onCycleStatus(book)}>Change status ↻</button>}
            <button className="primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}
