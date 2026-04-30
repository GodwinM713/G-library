import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLibrary, pushLibrary, getConfig, isConfigured } from '../utils/github';
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
  }, [setBooksSynced]);

  useEffect(() => { reload(); }, [reload]);

  // ── Push with merge — pulls latest first, merges by id ───────
  // This means adding on PC while phone is open never wipes phone's books
  const pushWithMerge = useCallback(async (localBooks) => {
    if (!isConfigured()) throw new Error('GitHub not configured');
    const { token, repo } = getConfig();
    setSyncStatus('syncing'); setSyncError('');
    try {
      // 1. Pull what's currently on GitHub
      const { books: remoteBooks } = await fetchLibrary(token, repo);

      // 2. Merge: remote is the base, local changes win for same id
      //    Books only in remote (added by another device) are kept
      //    Books only in local (just added/deleted here) win
      const remoteMap = new Map(remoteBooks.map(b => [b.id, b]));
      const localMap  = new Map(localBooks.map(b => [b.id, b]));

      // Deleted locally — find ids that were in our previous booksRef but not in localBooks
      const deletedIds = new Set(
        booksRef.current
          .map(b => b.id)
          .filter(id => !localMap.has(id))
      );

      // Start from remote, apply local changes on top
      const merged = [];
      // Add all remote books that weren't deleted locally
      for (const [id, book] of remoteMap) {
        if (deletedIds.has(id)) continue;      // deleted on this device
        if (localMap.has(id)) {
          merged.push(localMap.get(id));        // updated on this device
        } else {
          merged.push(book);                    // only on remote (other device added it)
        }
      }
      // Add books that are only local (newly added on this device)
      for (const [id, book] of localMap) {
        if (!remoteMap.has(id)) merged.push(book);
      }

      // 3. Push merged result
      const newSha = await pushLibrary(merged, null, token, repo);
      shaRef.current = newSha;

      // 4. Update local state with merged result
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
    const newBook     = { ...book, id: Date.now() };
    const withNew     = [...booksRef.current, newBook];
    await pushWithMerge(withNew);
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
      const { callnum, cutter } = generateCallNum(
        updated.genre, updated.author, updated.lang, updated.ddc, others
      );
      finalBook = { ...finalBook, callnum, cutter };
    }

    const updated_list = current.map(b => b.id === finalBook.id ? finalBook : b);
    await pushWithMerge(updated_list);
    return finalBook;
  }, [pushWithMerge]);

  // ── Delete ────────────────────────────────────────────────────
  const deleteBook = useCallback(async (id) => {
    const without = booksRef.current.filter(b => b.id !== id);
    await pushWithMerge(without);
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
