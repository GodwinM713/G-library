import React, { useState, useRef } from 'react';

const isElectron = typeof window !== 'undefined' && window.library;

export default function DDCFetcher({ title, author, onApply, onClose }) {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const resultRef = useRef(null);   // keep a ref so Apply never uses stale closure

  const run = async () => {
    if (!title && !author) { setError('Enter a title or author in the form first.'); return; }
    if (!isElectron) { setError('DDC fetching only works in the desktop app.'); return; }
    setLoading(true); setError(''); setResult(null); resultRef.current = null;
    try {
      const res = await window.library.fetchDDC({ title, author });
      if (!res || typeof res !== 'object') throw new Error('empty response');
      setResult(res);
      resultRef.current = res;
    } catch (e) {
      setError('Fetch failed: ' + (e.message || 'unknown error'));
    }
    setLoading(false);
  };

  const handleApply = () => {
    const r = resultRef.current;
    if (r) { onApply(r); }
    onClose();
  };

  const ROW = ({ label, value, mono }) => value ? (
    <div style={{ display:'flex', gap:12, fontSize:13, alignItems:'baseline' }}>
      <span style={{ color:'var(--green)', minWidth:80, fontSize:11, fontWeight:600,
        textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0 }}>{label}</span>
      <span style={{ color:'var(--ink)', fontWeight:500,
        fontFamily: mono ? "'DM Mono',monospace" : 'inherit' }}>{value}</span>
    </div>
  ) : null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(28,24,20,0.5)',
        display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}
    >
      <div style={{ background:'var(--paper)', borderRadius:'var(--radius-lg)',
        border:'1px solid var(--border)', width:480, maxWidth:'90vw', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', background:'var(--paper-2)',
          borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--green-bg)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, color:'var(--green)' }}>⊞</div>
          <div>
            <div style={{ fontWeight:500, fontSize:14, color:'var(--ink)' }}>DDC Fetcher</div>
            <div style={{ fontSize:12, color:'var(--ink-3)' }}>Dewey Decimal, genre &amp; sub-genre via Open Library + AI</div>
          </div>
        </div>

        <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>

          {/* What will be looked up */}
          <div style={{ background:'var(--paper-2)', borderRadius:'var(--radius)',
            padding:'10px 14px', fontSize:13, color:'var(--ink-2)' }}>
            <div style={{ marginBottom:4, fontSize:11, fontWeight:500, color:'var(--ink-3)',
              textTransform:'uppercase', letterSpacing:'0.06em' }}>Looking up</div>
            <div style={{ fontWeight:500 }}>
              {title || <em style={{ color:'var(--ink-3)', fontWeight:400 }}>no title entered</em>}
            </div>
            {author && <div style={{ color:'var(--ink-3)', marginTop:2 }}>{author}</div>}
          </div>

          {error && (
            <div style={{ fontSize:13, color:'#9b2020', padding:'8px 12px',
              background:'#fef2f2', borderRadius:'var(--radius)' }}>{error}</div>
          )}

          {loading && (
            <div style={{ fontSize:13, color:'var(--ink-3)', textAlign:'center',
              padding:20, background:'var(--paper-2)', borderRadius:'var(--radius)' }}>
              Querying Open Library + AI…
            </div>
          )}

          {result && (
            <div style={{ background:'var(--green-bg)', border:'1px solid #b2d8be',
              borderLeft:'3px solid var(--green)', borderRadius:'var(--radius)',
              padding:'14px 16px', display:'flex', flexDirection:'column', gap:9 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--green)',
                textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>
                Fetched — click "Apply to form" to fill all fields
              </div>
              <ROW label="Title"    value={result.title} />
              <ROW label="Author"   value={result.author} />
              <ROW label="DDC"      value={result.ddc}    mono />
              <ROW label="Genre"    value={
                result.genre_code
                  ? `${result.genre_code}${result.genre_name ? ' – ' + result.genre_name : ''}`
                  : result.genre_name
              } />
              <ROW label="Sub-genre" value={result.sub} />
              {!result.title && !result.ddc && !result.genre_code && (
                <div style={{ fontSize:12, color:'#9b2020' }}>
                  AI returned an empty result — try a more specific title or author.
                </div>
              )}
            </div>
          )}

          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={onClose}>Cancel</button>
            {!result
              ? <button className="primary" onClick={run} disabled={loading}>
                  {loading ? 'Fetching…' : 'Fetch DDC ⊞'}
                </button>
              : <>
                  <button onClick={run} disabled={loading}>Retry</button>
                  <button className="primary" onClick={handleApply}>Apply to form</button>
                </>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
