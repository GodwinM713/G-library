import React, { useState, useMemo } from 'react';
import BookCard from '../components/BookCard';
import BookDetail from '../components/BookDetail';
import { getAllGenres } from '../utils/callnum';
const GENRES = getAllGenres();

export default function SearchPage({ books, onUpdate, onDelete, viewerMode, initialShelfFilter }) {
  const [query, setQuery]           = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy]         = useState('callnum');
  const [selected, setSelected]     = useState(null);

  const genres = useMemo(() => [...new Set(books.map(b => b.genre).filter(Boolean))].sort(), [books]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return [...books]
      .filter(b => !q || (b.title + b.author + b.callnum + (b.sub || '')).toLowerCase().includes(q))
      .filter(b => !filterGenre || b.genre === filterGenre)
      .filter(b => !filterStatus || b.status === filterStatus)
      .sort((a, b) => {
        if (sortBy === 'callnum') return a.callnum.localeCompare(b.callnum);
        if (sortBy === 'title')  return a.title.localeCompare(b.title);
        if (sortBy === 'author') return (a.author || '').localeCompare(b.author || '');
        return 0;
      });
  }, [books, query, filterGenre, filterStatus, sortBy]);

  const handleUpdate = async (updated) => {
    if (!onUpdate) return updated;
    const u = await onUpdate(updated);
    setSelected(u || updated);
    return u;
  };

  const cycleStatus = async (book) => {
    if (!onUpdate) return;
    const cycle = { unread:'reading', reading:'read', read:'unread' };
    const updated = await onUpdate({ ...book, status: cycle[book.status] });
    if (selected?.id === book.id) setSelected(updated);
  };

  const handleDelete = async () => {
    if (!onDelete || !selected) return;
    if (!window.confirm('Remove this book from your library?')) return;
    await onDelete(selected.id);
    setSelected(null);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Filter bar */}
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', gap:8, background:'var(--paper)', flexShrink:0, flexWrap:'wrap' }}>
        <input
          style={{ flex:1, minWidth:160 }}
          type="text"
          placeholder="Search title, author, call number…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)} style={{ width:150 }}>
          <option value="">All genres</option>
          {genres.map(g => <option key={g} value={g}>{GENRES[g] || g}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width:130 }}>
          <option value="">All statuses</option>
          <option value="read">Read</option>
          <option value="reading">Reading</option>
          <option value="unread">Unread</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width:140 }}>
          <option value="callnum">Sort: Call number</option>
          <option value="title">Sort: Title A–Z</option>
          <option value="author">Sort: Author</option>
        </select>
      </div>

      {/* Count bar */}
      <div style={{ padding:'8px 20px', fontSize:12, color:'var(--ink-3)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {filtered.length} of {books.length} books
      </div>

      {/* Book list */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 20px', display:'flex', flexDirection:'column', gap:6 }}>
        {filtered.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--ink-3)', gap:8, padding:40, textAlign:'center' }}>
            <div style={{ fontSize:32, fontFamily:"'Playfair Display', serif", color:'var(--border-2)' }}>◈</div>
            <div style={{ fontSize:14 }}>
              {books.length === 0 ? 'Your library is empty. Add your first book!' : 'No books match your search.'}
            </div>
          </div>
        ) : (
          filtered.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => setSelected(book)}
              onCycleStatus={viewerMode ? null : cycleStatus}
            />
          ))
        )}
      </div>

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
