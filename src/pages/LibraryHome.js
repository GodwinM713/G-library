import React, { useState, useMemo } from 'react';
import { getAllGenres, getGenreColor } from '../utils/callnum';
import BookDetail from '../components/BookDetail';

const GENRES = getAllGenres();

const STATUS_DOT = {
  read:    '#2d5a3d',
  reading: '#c46a2d',
  unread:  '#ccc3b2',
};

function CoverImage({ book, size = 120 }) {
  if (book.coverUrl) {
    return (
      <img
        src={book.coverUrl}
        alt={book.title}
        style={{ width:'100%', height:'100%', objectFit:'cover' }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }
  return null;
}

function BookTile({ book, onClick }) {
  const gc = getGenreColor(book.genre);
  const isLended = book.ownership === 'lended';
  const [imgError, setImgError] = useState(false);
  const hasCover = book.coverUrl && !imgError;

  return (
    <div
      onClick={onClick}
      title={`${book.title}${book.author ? ' — ' + book.author : ''}`}
      style={{
        position:'relative',
        width:110,
        cursor:'pointer',
        transition:'transform .18s ease, box-shadow .18s ease',
        flexShrink:0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.zIndex = 10;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.zIndex = 1;
      }}
    >
      {/* Book spine / cover */}
      <div style={{
        width:110,
        height:158,
        borderRadius:4,
        overflow:'hidden',
        boxShadow:'2px 3px 10px rgba(28,24,20,0.18), -1px 0 0 rgba(0,0,0,0.08)',
        background: hasCover ? '#eee' : (isLended ? '#3a2e5c' : gc.bg || 'var(--paper-2)'),
        border:`1px solid ${isLended ? '#4a3580' : 'var(--border)'}`,
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:hasCover ? 'flex-start' : 'center',
        padding: hasCover ? 0 : '10px 8px',
        position:'relative',
      }}>
        {hasCover ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <>
            {/* Decorative spine */}
            <div style={{
              position:'absolute', left:0, top:0, bottom:0, width:6,
              background:'rgba(0,0,0,0.12)', borderRadius:'4px 0 0 4px',
            }} />
            <div style={{
              fontSize:10, fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.08em', color: isLended ? '#c9bfef' : (gc.text || 'var(--ink-3)'),
              textAlign:'center', lineHeight:1.3, marginBottom:8, opacity:0.7,
            }}>
              {GENRES[book.genre] || book.genre || ''}
            </div>
            <div style={{
              fontFamily:"'Playfair Display', serif",
              fontSize:12, fontWeight:500,
              color: isLended ? '#fff' : 'var(--ink)',
              textAlign:'center', lineHeight:1.4,
              wordBreak:'break-word',
            }}>
              {book.title.length > 45 ? book.title.slice(0, 45) + '…' : book.title}
            </div>
            {!isLended && book.author && (
              <div style={{
                marginTop:6, fontSize:10, color:'var(--ink-3)',
                textAlign:'center', lineHeight:1.3,
              }}>
                {book.author.split(',')[0]}
              </div>
            )}
          </>
        )}

        {/* Status dot */}
        {!isLended && (
          <div style={{
            position:'absolute', bottom:6, right:6,
            width:8, height:8, borderRadius:'50%',
            background: STATUS_DOT[book.status] || STATUS_DOT.unread,
            border:'1px solid rgba(255,255,255,0.5)',
            boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
          }} />
        )}
        {isLended && (
          <div style={{
            position:'absolute', bottom:4, left:0, right:0,
            textAlign:'center', fontSize:9, fontWeight:600,
            color:'#c9bfef', letterSpacing:'0.06em',
          }}>LENDED</div>
        )}
      </div>

      {/* Title below */}
      <div style={{
        marginTop:7,
        fontSize:11, fontWeight:500,
        color:'var(--ink-2)', textAlign:'center',
        lineHeight:1.3,
        overflow:'hidden',
        display:'-webkit-box',
        WebkitLineClamp:2,
        WebkitBoxOrient:'vertical',
      }}>
        {book.title}
      </div>
      {book.author && !isLended && (
        <div style={{ fontSize:10, color:'var(--ink-3)', textAlign:'center', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {book.author.split(',')[0]}
        </div>
      )}
    </div>
  );
}

function GenreShelf({ genreName, books, onSelect }) {
  const gc = getGenreColor(genreName);
  const scrollRef = React.useRef();

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div style={{ marginBottom:32 }}>
      {/* Genre header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:14, paddingBottom:8,
        borderBottom:`2px solid ${gc.bg || 'var(--border)'}`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{
            display:'inline-block', width:12, height:12, borderRadius:'50%',
            background: gc.text || 'var(--accent)',
          }} />
          <h2 style={{
            fontFamily:"'Playfair Display', serif",
            fontSize:16, fontWeight:500, color:'var(--ink)',
            margin:0,
          }}>
            {GENRES[genreName] || genreName}
          </h2>
          <span style={{
            fontSize:11, color:'var(--ink-3)',
            background:'var(--paper-2)', borderRadius:20, padding:'1px 8px',
          }}>
            {books.length}
          </span>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          <button className="ghost" onClick={() => scroll(-1)} style={{ padding:'4px 10px', fontSize:14 }}>‹</button>
          <button className="ghost" onClick={() => scroll(1)} style={{ padding:'4px 10px', fontSize:14 }}>›</button>
        </div>
      </div>

      {/* Horizontal scroll shelf */}
      <div
        ref={scrollRef}
        style={{
          display:'flex', gap:14,
          overflowX:'auto', paddingBottom:12,
          scrollbarWidth:'thin',
        }}
      >
        {books.map(book => (
          <BookTile key={book.id} book={book} onClick={() => onSelect(book)} />
        ))}
      </div>
    </div>
  );
}

export default function LibraryHome({ books, onUpdate, onDelete, viewerMode, onNav }) {
  const [selected, setSelected] = useState(null);

  // Group books by genre, sorted alphabetically within each genre
  const byGenre = useMemo(() => {
    const groups = {};
    const lended = [];
    books.forEach(book => {
      if (book.ownership === 'lended') { lended.push(book); return; }
      const g = book.genre || '__none__';
      if (!groups[g]) groups[g] = [];
      groups[g].push(book);
    });
    // Sort books within each genre by call number
    Object.keys(groups).forEach(g => groups[g].sort((a, b) => (a.callnum||'').localeCompare(b.callnum||'')));
    // Sort genres alphabetically by display name
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const na = GENRES[a] || a;
      const nb = GENRES[b] || b;
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      return na.localeCompare(nb);
    });
    const result = sortedKeys.map(k => ({ key: k, label: GENRES[k] || (k === '__none__' ? 'Uncategorized' : k), books: groups[k] }));
    if (lended.length > 0) result.push({ key:'__lended__', label:'Lended Out', books: lended });
    return result;
  }, [books]);

  const handleUpdate = async (updated) => {
    if (!onUpdate) return updated;
    const u = await onUpdate(updated);
    setSelected(u || updated);
    return u;
  };

  const handleDelete = async () => {
    if (!onDelete || !selected) return;
    if (!window.confirm('Remove this book from your library?')) return;
    await onDelete(selected.id);
    setSelected(null);
  };

  const cycleStatus = async (book) => {
    if (!onUpdate) return;
    const cycle = { unread:'reading', reading:'read', read:'unread' };
    const updated = await onUpdate({ ...book, status: cycle[book.status] });
    if (selected?.id === book.id) setSelected(updated);
  };

  if (books.length === 0) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'var(--ink-3)' }}>
        <div style={{ fontSize:48, fontFamily:"'Playfair Display', serif", color:'var(--border-2)' }}>◈</div>
        <div style={{ fontSize:15 }}>Your library is empty.</div>
        {!viewerMode && (
          <button className="primary" onClick={() => onNav('add')}>Add your first book</button>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
      {/* Summary bar */}
      <div style={{
        display:'flex', gap:20, marginBottom:28, flexWrap:'wrap',
        padding:'12px 16px', background:'var(--paper-2)',
        borderRadius:'var(--radius)', border:'1px solid var(--border)',
      }}>
        {[
          ['Total', books.length, 'var(--ink)'],
          ['Read', books.filter(b=>b.status==='read').length, '#2d5a3d'],
          ['Reading', books.filter(b=>b.status==='reading').length, '#c46a2d'],
          ['Unread', books.filter(b=>b.status==='unread').length, 'var(--ink-3)'],
          ['Genres', byGenre.filter(g=>g.key!=='__lended__'&&g.key!=='__none__').length, 'var(--accent)'],
        ].map(([label, count, color]) => (
          <div key={label} style={{ textAlign:'center', minWidth:60 }}>
            <div style={{ fontFamily:"'DM Mono', monospace", fontSize:20, fontWeight:500, color }}>{count}</div>
            <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:2 }}>{label}</div>
          </div>
        ))}
        {!viewerMode && (
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center' }}>
            <button onClick={() => onNav('search')} style={{ fontSize:12 }}>🔍 Search all</button>
          </div>
        )}
        {viewerMode && (
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center' }}>
            <button onClick={() => onNav('search')} style={{ fontSize:12 }}>🔍 Search</button>
          </div>
        )}
      </div>

      {/* Genre shelves */}
      {byGenre.map(({ key, label, books: genreBooks }) => (
        <GenreShelf
          key={key}
          genreName={key === '__lended__' ? '__lended__' : key}
          books={genreBooks}
          onSelect={setSelected}
        />
      ))}

      {selected && (
        <BookDetail
          book={selected}
          onClose={() => setSelected(null)}
          onDelete={viewerMode ? null : handleDelete}
          onUpdate={viewerMode ? null : handleUpdate}
          onCycleStatus={viewerMode ? null : cycleStatus}
          viewerMode={viewerMode}
          onUploadCover={viewerMode ? null : async (bookId, dataUrl) => {
            const updated = { ...selected, coverUrl: dataUrl };
            await handleUpdate(updated);
          }}
        />
      )}
    </div>
  );
}
