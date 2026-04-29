import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SearchPage from './pages/SearchPage';
import AddPage from './pages/AddPage';
import ShelvesPage from './pages/ShelvesPage';
import SettingsPage from './pages/SettingsPage';
import NumberingGuideModal from './components/NumberingGuideModal';
import { useBooks } from './hooks/useBooks';
import { isConfigured } from './utils/github';

function HeaderMenu({ onExport, onGuide, onSync }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const item = (label, icon, action) => (
    <button onClick={() => { setOpen(false); action(); }} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '8px 14px', background: 'transparent', border: 'none',
      borderRadius: 'var(--radius)', fontSize: 13,
      color: 'var(--ink-2)', cursor: 'pointer', textAlign: 'left',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <span style={{ width: 16, textAlign: 'center', fontSize: 14 }}>{icon}</span> {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, padding: '7px 14px',
        background: open ? 'var(--paper-2)' : 'transparent',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      }}>
        ☰ Menu
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--paper)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
          minWidth: 210, padding: 6, zIndex: 500,
        }}>
          <div style={{ padding: '4px 14px 6px', fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>File</div>
          {item('Export to Excel / JSON', '⬇', onExport)}
          {item('Sync now', '⟳', onSync)}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
          <div style={{ padding: '4px 14px 6px', fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Help</div>
          {item('Numbering guide', '#', onGuide)}
        </div>
      )}
    </div>
  );
}

const PAGE_TITLE = { search: 'Library', add: 'Add a new book', shelves: 'Shelves', settings: 'GitHub sync' };

export default function App() {
  const [page, setPage] = useState(() => isConfigured() ? 'search' : 'settings');
  const [shelfFilter, setShelfFilter] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const { books, loading, syncStatus, syncError, addBook, updateBook, deleteBook, exportExcel, reload } = useBooks();

  const stats = {
    total:   books.length,
    read:    books.filter(b => b.status === 'read').length,
    reading: books.filter(b => b.status === 'reading').length,
    unread:  books.filter(b => b.status === 'unread').length,
    lended:  books.filter(b => b.ownership === 'lended').length,
  };

  const handleShelfFilter = name => {
    setShelfFilter(name === '(No shelf)' ? '' : name);
    setPage('search');
  };

  const handleExport = async () => {
    const result = await exportExcel();
    if (result && !result.canceled && result.filePath) {
      alert(`Exported to:\n${result.filePath}`);
    }
  };

  const handleSettingsSaved = () => {
    reload();
    setPage('search');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        active={page}
        onNav={setPage}
        stats={stats}
        syncStatus={syncStatus}
        configured={isConfigured()}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--paper)' }}>
        {/* Header */}
        <header style={{
          padding: '11px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: 'var(--paper)',
        }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>
            {PAGE_TITLE[page] || 'Library'}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {syncError && (
              <span style={{ fontSize: 11, color: '#9b2020', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {syncError}
              </span>
            )}
            {page !== 'add' && page !== 'settings' && (
              <button className="primary" onClick={() => setPage('add')} style={{ fontSize: 12 }}>
                + Add book
              </button>
            )}
            <HeaderMenu onExport={handleExport} onGuide={() => setShowGuide(true)} onSync={reload} />
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {page === 'settings' ? (
            <SettingsPage onSaved={handleSettingsSaved} />
          ) : !isConfigured() ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--ink-3)' }}>
              <div style={{ fontSize: 32, color: 'var(--border-2)' }}>⟳</div>
              <div style={{ fontSize: 14 }}>GitHub sync not configured.</div>
              <button className="primary" onClick={() => setPage('settings')}>Set up GitHub sync</button>
            </div>
          ) : loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
              Loading library…
            </div>
          ) : (
            <>
              {page === 'search'  && <SearchPage books={books} initialShelfFilter={shelfFilter} onUpdate={updateBook} onDelete={deleteBook} />}
              {page === 'add'     && <AddPage books={books} onAdd={addBook} onNav={setPage} />}
              {page === 'shelves' && <ShelvesPage books={books} onFilterShelf={handleShelfFilter} />}
            </>
          )}
        </div>
      </main>

      {showGuide && <NumberingGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
