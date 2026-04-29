import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLibrary, pushLibrary, getConfig, isConfigured } from '../utils/github';
import { generateCallNum } from '../utils/callnum';

export function useBooks() {
  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError]   = useState('');

  const shaRef   = useRef(null);
  const booksRef = useRef([]);   // always up-to-date, avoids stale closure

  // Keep ref in sync whenever books state changes
  const setBooksSynced = (b) => {
    booksRef.current = b;
    setBooks(b);
  };

  // ── Load ─────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    if (!isConfigured()) { setLoading(false); return; }
    const { token, repo } = getConfig();
    setLoading(true); setSyncStatus('syncing'); setSyncError('');
    try {
      const { books: loaded, sha } = await fetchLibrary(token, repo);
      shaRef.current = sha;
      const sorted = [...loaded].sort((a, b) => {
        if (a.ownership !== b.ownership) return a.ownership === 'lended' ? 1 : -1;
        return (a.callnum || '').localeCompare(b.callnum || '');
      });
      setBooksSynced(sorted);
      setSyncStatus('ok');
    } catch (e) {
      setSyncStatus('error'); setSyncError(e.message);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { reload(); }, [reload]);

  // ── Push — always reads booksRef, never stale ─────────────────
  const push = useCallback(async (newBooks) => {
    if (!isConfigured()) throw new Error('GitHub not configured');
    const { token, repo } = getConfig();
    setSyncStatus('syncing'); setSyncError('');
    try {
      const newSha = await pushLibrary(newBooks, shaRef.current, token, repo);
      shaRef.current = newSha;
      setSyncStatus('ok');
    } catch (e) {
      if (e.message.includes('409') || e.message.includes('conflict')) {
        setSyncStatus('error');
        setSyncError('Sync conflict — reloading...');
        await reload();
        throw new Error('Conflict: reloaded latest. Please redo your change.');
      }
      setSyncStatus('error'); setSyncError(e.message);
      throw e;
    }
  }, [reload]);

  // ── Add ───────────────────────────────────────────────────────
  const addBook = useCallback(async (book) => {
    const current  = booksRef.current;
    const newBook  = { ...book, id: Date.now() };
    const newBooks = [...current, newBook];
    await push(newBooks);
    setBooksSynced(newBooks);
    return newBook;
  }, [push]);

  // ── Update — always uses booksRef so it's never stale ─────────
  const updateBook = useCallback(async (updated) => {
    const current     = booksRef.current;
    const existingBook = current.find(b => b.id === updated.id) || {};

    // Regenerate call number if any relevant field changed
    const callnumFields = ['genre', 'author', 'lang', 'ddc'];
    const needsNewCallnum =
      updated.ownership !== 'lended' &&
      callnumFields.some(f => String(updated[f] || '') !== String(existingBook[f] || ''));

    let finalBook = { ...updated };

    if (needsNewCallnum) {
      // Exclude this book from the sibling count
      const others = current.filter(b => b.id !== updated.id && b.ownership !== 'lended');
      const { callnum, cutter } = generateCallNum(
        updated.genre,
        updated.author,
        updated.lang,
        updated.ddc,
        others
      );
      finalBook = { ...finalBook, callnum, cutter };
    }

    const newBooks = current.map(b => b.id === finalBook.id ? finalBook : b);
    await push(newBooks);
    setBooksSynced(newBooks);
    return finalBook;
  }, [push]);

  // ── Delete ────────────────────────────────────────────────────
  const deleteBook = useCallback(async (id) => {
    const current  = booksRef.current;
    const newBooks = current.filter(b => b.id !== id);
    await push(newBooks);
    setBooksSynced(newBooks);
  }, [push]);

  // ── Export ────────────────────────────────────────────────────
  const exportExcel = useCallback(async () => {
    const current = booksRef.current;
    if (typeof window !== 'undefined' && window.library?.exportExcel) {
      return window.library.exportExcel(current);
    }
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'my-library.json'; a.click();
    URL.revokeObjectURL(url);
    return { canceled: false };
  }, []);

  return { books, loading, syncStatus, syncError, addBook, updateBook, deleteBook, exportExcel, reload };
}
