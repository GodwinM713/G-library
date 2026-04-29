import React, { useMemo } from 'react';

const SHELF_COLORS = [
  { bg: '#ede8f7', accent: '#4a3580' },
  { bg: '#e0f2ee', accent: '#1a5c47' },
  { bg: '#faecd8', accent: '#7a4010' },
  { bg: '#e5eef8', accent: '#1a3f6f' },
  { bg: '#e8f5e0', accent: '#2a5c1a' },
  { bg: '#fce8e0', accent: '#7a2810' },
];

export default function ShelvesPage({ books, onFilterShelf }) {
  const shelves = useMemo(() => {
    const map = {};
    books.forEach(b => {
      const s = b.shelf || '(No shelf)';
      if (!map[s]) map[s] = [];
      map[s].push(b);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [books]);

  if (!books.length) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
        No books yet. Add some from the "Add Book" tab.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {shelves.map(([name, bks], i) => {
          const col = SHELF_COLORS[i % SHELF_COLORS.length];
          const read = bks.filter(b => b.status === 'read').length;
          return (
            <div
              key={name}
              onClick={() => onFilterShelf(name)}
              style={{
                background: col.bg,
                borderRadius: 'var(--radius-lg)',
                padding: '18px 16px',
                cursor: 'pointer',
                transition: 'transform .15s, box-shadow .15s',
                border: `1px solid transparent`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: col.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
                fontSize: 14,
                color: '#fff',
                fontWeight: 500,
              }}>
                ≡
              </div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 15,
                fontWeight: 500,
                color: col.accent,
                marginBottom: 4,
                lineHeight: 1.3,
              }}>
                {name}
              </div>
              <div style={{ fontSize: 12, color: col.accent, opacity: 0.7 }}>
                {bks.length} book{bks.length !== 1 ? 's' : ''} · {read} read
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
