import React from 'react';
import { getAllGenres } from '../utils/callnum';
const GENRES = getAllGenres();

function Block({ label, value, desc }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--paper-2)', borderRadius: 'var(--radius)',
      padding: '12px 16px', gap: 4, flex: 1,
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500,
        color: 'var(--accent)', letterSpacing: '0.06em',
      }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

export default function NumberingPage() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>
          Call number format
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7 }}>
          Every book in your library gets a unique call number that encodes genre, author, and copy order. Inspired by the Cutter classification used in real libraries, simplified for home use.
        </div>
      </div>

      {/* Visual breakdown */}
      <div style={{
        background: 'var(--accent-bg)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        textAlign: 'center',
        fontFamily: "'DM Mono', monospace",
        fontSize: 26,
        fontWeight: 500,
        color: 'var(--accent)',
        letterSpacing: '0.06em',
        border: '1px solid var(--border)',
      }}>
        FIC - ORW - 001
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Block label="Genre code" value="FIC" desc="3-letter genre identifier" />
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-3)', fontSize: 18 }}>-</div>
        <Block label="Author code" value="ORW" desc="First 3 letters of last name (Cutter code)" />
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-3)', fontSize: 18 }}>-</div>
        <Block label="Copy number" value="001" desc="Sequential within genre + author" />
      </div>

      {/* Genre table */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 10 }}>Genre codes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {Object.entries(GENRES).map(([code, name]) => (
            <div key={code} style={{
              display: 'flex', gap: 8, alignItems: 'center',
              padding: '6px 10px',
              background: 'var(--paper-2)',
              borderRadius: 'var(--radius)',
              fontSize: 13,
            }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, color: 'var(--accent)', minWidth: 30 }}>{code}</span>
              <span style={{ color: 'var(--ink-3)' }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Physical label tip */}
      <div style={{
        background: 'var(--paper-2)',
        borderLeft: '3px solid var(--accent-2)',
        borderRadius: '0 var(--radius) var(--radius) 0',
        padding: '12px 16px',
        fontSize: 13,
        color: 'var(--ink-2)',
        lineHeight: 1.7,
      }}>
        <strong style={{ display: 'block', marginBottom: 4, color: 'var(--ink)' }}>Labelling your books</strong>
        Write the call number on a small adhesive label and stick it on the spine, about 2 cm from the bottom.
        Arrange books on shelves in alphabetical order of genre code, then Cutter code, then copy number.
      </div>
    </div>
  );
}
