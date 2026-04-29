import React, { useState } from 'react';
import { saveConfig, clearConfig, getConfig, verifyConfig } from '../utils/github';

const LBL = {
  fontSize: 12, fontWeight: 500, color: 'var(--ink-3)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
};
const FG = { display: 'flex', flexDirection: 'column', gap: 6 };

export default function SettingsPage({ onSaved }) {
  const existing = getConfig();
  const [token, setToken] = useState(existing?.token || '');
  const [repo,  setRepo]  = useState(existing?.repo  || '');
  const [status, setStatus] = useState('');   // '' | 'checking' | 'ok' | 'error'
  const [msg,    setMsg]    = useState('');

  const handleSave = async () => {
    if (!token.trim() || !repo.trim()) {
      setStatus('error'); setMsg('Both fields are required.'); return;
    }
    setStatus('checking'); setMsg('Verifying…');
    try {
      const info = await verifyConfig(token.trim(), repo.trim());
      saveConfig(token.trim(), repo.trim());
      setStatus('ok');
      setMsg(`Connected to ${info.name}${info.private ? ' 🔒 private' : ''}`);
      setTimeout(() => onSaved(), 1200);
    } catch (e) {
      setStatus('error');
      setMsg(`Connection failed: ${e.message}`);
    }
  };

  const handleDisconnect = () => {
    clearConfig();
    setToken(''); setRepo('');
    setStatus(''); setMsg('');
    onSaved();
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', maxWidth: 560 }}>

      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 500, marginBottom: 6 }}>
        GitHub sync
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 28, lineHeight: 1.7 }}>
        Your library is stored as a JSON file in a private GitHub repository.
        This lets you access the same data from any device — PC, phone, tablet.
      </div>

      {/* Step guide */}
      <div style={{ background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 24, fontSize: 13, color: 'var(--ink-2)', lineHeight: 2 }}>
        <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>Setup (one time)</div>
        <div>1. Create a <strong>private</strong> repo on GitHub, e.g. <code style={{ background: 'var(--paper-3)', padding: '1px 5px', borderRadius: 4 }}>yourname/my-library</code></div>
        <div>2. Go to <strong>GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens</strong></div>
        <div>3. Create a token scoped to that repo with <strong>Contents: Read and write</strong> permission</div>
        <div>4. Paste both below and click Connect</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={FG}>
          <label style={LBL}>GitHub Personal Access Token</label>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="github_pat_…"
            spellCheck={false}
            autoComplete="off"
          />
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Stored locally on this device only. Never sent anywhere except GitHub.
          </div>
        </div>

        <div style={FG}>
          <label style={LBL}>Repository (owner/name)</label>
          <input
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="yourname/my-library"
            spellCheck={false}
          />
        </div>

        {msg && (
          <div style={{
            fontSize: 13,
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            background: status === 'ok' ? 'var(--green-bg)' : status === 'error' ? '#fef2f2' : 'var(--paper-2)',
            color: status === 'ok' ? 'var(--green)' : status === 'error' ? '#9b2020' : 'var(--ink-3)',
            border: `1px solid ${status === 'ok' ? '#b2d8be' : status === 'error' ? '#fca5a5' : 'var(--border)'}`,
          }}>
            {status === 'ok' ? '✓ ' : status === 'error' ? '✕ ' : ''}{msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          {existing?.token ? (
            <button className="danger" onClick={handleDisconnect}>Disconnect</button>
          ) : <div />}
          <button
            className="primary"
            onClick={handleSave}
            disabled={status === 'checking'}
          >
            {status === 'checking' ? 'Connecting…' : 'Connect & save'}
          </button>
        </div>
      </div>
    </div>
  );
}
