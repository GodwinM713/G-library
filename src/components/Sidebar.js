import React from 'react';

const SYNC_STYLE = {
  idle:    { color:'#6b6055', label:'' },
  syncing: { color:'#c46a2d', label:'↻ Syncing…' },
  ok:      { color:'#2d5a3d', label:'✓ Synced' },
  error:   { color:'#9b2020', label:'✕ Sync error' },
};

export default function Sidebar({ active, onNav, stats, syncStatus, configured, viewerMode }) {
  const sync = SYNC_STYLE[syncStatus] || SYNC_STYLE.idle;

  const NAV = [
    { id:'home',     label:'Library',   icon:'◈', alwaysShow:true },
    { id:'search',   label:'Search',    icon:'🔍', alwaysShow:true },
    ...(!viewerMode ? [
      { id:'add',      label:'Add Book',  icon:'+',  alwaysShow:false },
      { id:'shelves',  label:'Shelves',   icon:'≡',  alwaysShow:false },
      { id:'settings', label:'Sync',      icon:'⟳',  alwaysShow:false },
    ] : [
      { id:'shelves',  label:'Shelves',   icon:'≡',  alwaysShow:true },
    ]),
  ];

  return (
    <aside style={{
      width:200, minWidth:200,
      background:'#1c1814',
      display:'flex', flexDirection:'column',
      borderRight:'1px solid #2e2820',
    }}>
      {/* Logo */}
      <div style={{ padding:'24px 20px 16px', borderBottom:'1px solid #2e2820' }}>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:16, fontWeight:600, color:'#e8d9c0', letterSpacing:'0.02em', lineHeight:1.3 }}>
          Personal<br />Library
        </div>
        <div style={{ fontSize:11, color:'#6b6055', marginTop:4 }}>
          {stats.total} book{stats.total !== 1 ? 's' : ''}
        </div>
        {viewerMode && (
          <div style={{ marginTop:6, fontSize:10, padding:'2px 8px', borderRadius:20, background:'#2e2820', color:'#c46a2d', display:'inline-block', letterSpacing:'0.04em' }}>
            Viewer mode
          </div>
        )}
        {sync.label && (
          <div style={{ marginTop:6, fontSize:10, fontWeight:500, color:sync.color, letterSpacing:'0.04em' }}>
            {sync.label}
          </div>
        )}
        {!configured && !viewerMode && (
          <div style={{ marginTop:6, fontSize:10, color:'#9b2020' }}>⚠ GitHub not configured</div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 0' }}>
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            style={{
              display:'flex', alignItems:'center', gap:10,
              width:'100%', padding:'9px 20px',
              background: active === item.id ? '#2e2820' : 'transparent',
              border:'none',
              borderLeft: active === item.id ? '2px solid #c46a2d' : '2px solid transparent',
              borderRadius:0,
              color: active === item.id ? '#e8d9c0' : '#8a8077',
              fontSize:13, fontWeight: active === item.id ? 500 : 400,
              cursor:'pointer', textAlign:'left', transition:'all .15s',
            }}
          >
            <span style={{ fontSize:14, width:18, textAlign:'center', color: active === item.id ? '#c46a2d' : '#6b6055', fontFamily:'monospace' }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Stats */}
      <div style={{ padding:'16px 20px', borderTop:'1px solid #2e2820', display:'flex', flexDirection:'column', gap:6 }}>
        {[
          ['Read',       stats.read,    '#2d5a3d'],
          ['Reading',    stats.reading, '#8b4513'],
          ['Unread',     stats.unread,  '#6b6055'],
          ['Lended out', stats.lended,  '#4a3580'],
        ].map(([label, count, color]) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'#6b6055' }}>{label}</span>
            <span style={{ fontSize:12, fontWeight:500, color, fontFamily:"'DM Mono', monospace" }}>{count}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
