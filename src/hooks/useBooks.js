import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLibrary, pushLibrary, getConfig, isConfigured, isReadable } from '../utils/github';
import { generateCallNum } from '../utils/callnum';

export function useBooks() {
  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError]   = useState('');

  const shaRef   = useRef(null);
  const booksRef = useRef([]);

  const setBooksSynced = useCallback((b) => {
    booksRef.current = b;
    setBooks(b);
  }, []);

  // ── Load — uses best available token (RW if owner, RO for viewers) ──
  const reload = useCallback(async () => {
    if (!isReadable()) { setLoading(false); return; }
    setLoading(true); setSyncStatus('syncing'); setSyncError('');
    try {
      // fetchLibrary() with no args picks the best available token automatically
      const { books: loaded, sha } = await fetchLibrary();
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
  }, [setBooksSynced]);

  useEffect(() => { reload(); }, [reload]);

  // ── Push — always uses owner's RW token explicitly ───────────
  const pushWithMerge = useCallback(async (localBooks) => {
    if (!isConfigured()) throw new Error('GitHub write access not configured');
    const { token, repo } = getConfig();
    setSyncStatus('syncing'); setSyncError('');
    try {
      const { books: remoteBooks } = await fetchLibrary(token, repo);

      const remoteMap = new Map(remoteBooks.map(b => [b.id, b]));
      const localMap  = new Map(localBooks.map(b => [b.id, b]));
      const deletedIds = new Set(
        booksRef.current.map(b => b.id).filter(id => !localMap.has(id))
      );

      const merged = [];
      for (const [id, book] of remoteMap) {
        if (deletedIds.has(id)) continue;
        merged.push(localMap.has(id) ? localMap.get(id) : book);
      }
      for (const [id, book] of localMap) {
        if (!remoteMap.has(id)) merged.push(book);
      }

      const newSha = await pushLibrary(merged, null, token, repo);
      shaRef.current = newSha;

      const sorted = [...merged].sort((a, b) => {
        if (a.ownership !== b.ownership) return a.ownership === 'lended' ? 1 : -1;
        return (a.callnum || '').localeCompare(b.callnum || '');
      });
      setBooksSynced(sorted);
      setSyncStatus('ok');
      return sorted;
    } catch (e) {
      setSyncStatus('error'); setSyncError(e.message);
      throw e;
    }
  }, [setBooksSynced]);

  // ── Add ───────────────────────────────────────────────────────
  const addBook = useCallback(async (book) => {
    const newBook = { ...book, id: Date.now() };
    await pushWithMerge([...booksRef.current, newBook]);
    return newBook;
  }, [pushWithMerge]);

  // ── Update ────────────────────────────────────────────────────
  const updateBook = useCallback(async (updated) => {
    const current      = booksRef.current;
    const existingBook = current.find(b => b.id === updated.id) || {};
    const callnumFields = ['genre', 'author', 'lang', 'ddc'];
    const needsNewCallnum =
      updated.ownership !== 'lended' &&
      callnumFields.some(f => String(updated[f] || '') !== String(existingBook[f] || ''));

    let finalBook = { ...updated };
    if (needsNewCallnum) {
      const others = current.filter(b => b.id !== updated.id && b.ownership !== 'lended');
      const { callnum, cutter } = generateCallNum(updated.genre, updated.author, updated.lang, updated.ddc, others);
      finalBook = { ...finalBook, callnum, cutter };
    }

    await pushWithMerge(current.map(b => b.id === finalBook.id ? finalBook : b));
    return finalBook;
  }, [pushWithMerge]);

  // ── Delete ────────────────────────────────────────────────────
  const deleteBook = useCallback(async (id) => {
    await pushWithMerge(booksRef.current.filter(b => b.id !== id));
  }, [pushWithMerge]);

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
