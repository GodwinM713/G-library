import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLibrary, pushLibrary, getConfig, isConfigured } from '../utils/github';

// ── Sync status: 'idle' | 'syncing' | 'ok' | 'error' ─────────
export function useBooks() {
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // for header indicator
  const [syncError, setSyncError]   = useState('');
  const shaRef = useRef(null);   // current SHA of library.json on GitHub

  // ── Load ───────────────────────────────────────────────────
  const reload = useCallback(async () => {
    if (!isConfigured()) { setLoading(false); return; }
    const { token, repo } = getConfig();
    setLoading(true);
    setSyncStatus('syncing');
    setSyncError('');
    try {
      const { books: loaded, sha } = await fetchLibrary(token, repo);
      shaRef.current = sha;
      setBooks(loaded.sort((a, b) => {
        if (a.ownership !== b.ownership) return a.ownership === 'lended' ? 1 : -1;
        return (a.callnum || '').localeCompare(b.callnum || '');
      }));
      setSyncStatus('ok');
    } catch (e) {
      setSyncStatus('error');
      setSyncError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ── Push helper: mutate local list then push to GitHub ─────
  const push = useCallback(async (newBooks) => {
    if (!isConfigured()) throw new Error('GitHub not configured');
    const { token, repo } = getConfig();
    setSyncStatus('syncing');
    setSyncError('');
    try {
      const newSha = await pushLibrary(newBooks, shaRef.current, token, repo);
      shaRef.current = newSha;
      setSyncStatus('ok');
    } catch (e) {
      // SHA conflict — someone else pushed; reload and let user retry
      if (e.message.includes('409') || e.message.includes('conflict')) {
        setSyncStatus('error');
        setSyncError('Sync conflict — reloading latest version…');
        await reload();
        throw new Error('Conflict: reloaded latest. Please redo your change.');
      }
      setSyncStatus('error');
      setSyncError(e.message);
      throw e;
    }
  }, [reload]);

  // ── CRUD ───────────────────────────────────────────────────
  const addBook = useCallback(async (book) => {
    const newBook = { ...book, id: Date.now() };
    const newBooks = [...books, newBook];
    await push(newBooks);
    setBooks(newBooks);
    return newBook;
  }, [books, push]);

  const updateBook = useCallback(async (updated) => {
    const newBooks = books.map(b => b.id === updated.id ? { ...b, ...updated } : b);
    await push(newBooks);
    setBooks(newBooks);
    return updated;
  }, [books, push]);

  const deleteBook = useCallback(async (id) => {
    const newBooks = books.filter(b => b.id !== id);
    await push(newBooks);
    setBooks(newBooks);
  }, [books, push]);

  const exportExcel = useCallback(async () => {
    // Only available in Electron — pass books directly
    if (typeof window !== 'undefined' && window.library?.exportExcel) {
      return window.library.exportExcel(books);
    }
    // Web: trigger JSON download as fallback
    const json = JSON.stringify(books, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'my-library.json'; a.click();
    URL.revokeObjectURL(url);
    return { canceled: false };
  }, [books]);

  return { books, loading, syncStatus, syncError, addBook, updateBook, deleteBook, exportExcel, reload };
}
