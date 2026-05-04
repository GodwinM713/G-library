import React from 'react';
import { getAllGenres, getGenreColor } from '../utils/callnum';

const STATUS_STYLE = {
  read:    { bg:'#e8f5e0', color:'#2a5c1a', label:'Read' },
  reading: { bg:'#faecd8', color:'#7a4010', label:'Reading' },
  unread:  { bg:'#f0ede8', color:'#4a3820', label:'Unread' },
};

export default function BookCard({ book, onClick, onCycleStatus }) {
  const genres = getAllGenres();
  const gc = getGenreColor(book.genre);
  const ss = STATUS_STYLE[book.status] || STATUS_STYLE.unread;
  const isLended = book.ownership === 'lended';

  return (
    <div
      onClick={onClick}
      style={{
        display:'grid',
        gridTemplateColumns: isLended ? '1fr auto' : '110px 1fr auto',
        gap:14, alignItems:'center',
        padding:'10px 14px',
        background: isLended ? '#f7f4fd' : 'var(--paper)',
        border:`1px solid ${isLended ? '#c9bfef' : 'var(--border)'}`,
        borderLeft: isLended ? '3px solid #4a3580' : '1px solid var(--border)',
        borderRadius:'var(--radius)',
        cursor:'pointer',
        transition:'border-color .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Cover or call number */}
      {!isLended && (
        book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt="Cover"
            style={{ width:56, height:80, objectFit:'cover', borderRadius:3, border:'1px solid var(--border)', boxShadow:'1px 1px 4px rgba(0,0,0,0.1)', display:'block', margin:'0 auto' }}
          />
        ) : (
          <div style={{
            fontFamily:"'DM Mono', monospace", fontSize:11, fontWeight:500,
            color:'var(--accent)', background:'var(--accent-bg)',
            borderRadius:6, padding:'6px 8px', textAlign:'center',
            letterSpacing:'0.04em', lineHeight:1.5, wordBreak:'break-all',
          }}>
            {book.callnum}
          </div>
        )
      )}

      {/* Book info */}
      <div style={{ minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
          {isLended && (
            <span style={{ fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:20, background:'#4a3580', color:'#fff', letterSpacing:'0.04em' }}>LENDED</span>
          )}
          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:15, fontWeight:500, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {book.title}
          </div>
        </div>
        <div style={{ fontSize:13, color:'var(--ink-3)', marginBottom:6 }}>
          {isLended
            ? (book.lended_to ? `Lended to: ${book.lended_to}` : 'Lended out')
            : (book.author || 'Unknown author')}
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {!isLended && book.genre && (
            <span style={{ fontSize:11, fontWeight:500, background:gc.bg, color:gc.text, borderRadius:20, padding:'2px 8px' }}>
              {genres[book.genre] || book.genre}
            </span>
          )}
          {!isLended && book.sub && (
            <span style={{ fontSize:11, background:'var(--paper-2)', color:'var(--ink-3)', borderRadius:20, padding:'2px 8px' }}>{book.sub}</span>
          )}
          {(book.shelf || book.window_loc) && (
            <span style={{ fontSize:11, background:'var(--paper-2)', color:'var(--ink-3)', borderRadius:20, padding:'2px 8px' }}>
              {[book.shelf, book.window_loc].filter(Boolean).join(' / ')}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
        {!isLended && (
          <>
            <span style={{ fontSize:11, fontWeight:500, background:ss.bg, color:ss.color, borderRadius:20, padding:'3px 10px', whiteSpace:'nowrap' }}>
              {ss.label}
            </span>
            {onCycleStatus && (
              <button className="ghost" title="Cycle reading status"
                onClick={e => { e.stopPropagation(); onCycleStatus(book); }}
                style={{ fontSize:12, padding:'2px 8px', color:'var(--ink-3)' }}>↻</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
