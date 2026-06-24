import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pause, Play } from 'lucide-react';

export default function Monitors() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', method: 'GET', expected_status: 200, check_interval_seconds: 60 });

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = () => {
    fetch(`${import.meta.env.VITE_API_URL}/monitors`)
      .then(res => res.json())
      .then(data => setMonitors(data));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`${import.meta.env.VITE_API_URL}/monitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    }).then(() => {
      setShowForm(false);
      fetchMonitors();
    });
  };

  const handleDelete = (id: number) => {
    fetch(`${import.meta.env.VITE_API_URL}/monitors/${id}`, { method: 'DELETE' })
      .then(() => fetchMonitors());
  };

  const togglePause = (monitor: any) => {
    fetch(`${import.meta.env.VITE_API_URL}/monitors/${monitor.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...monitor, is_active: !monitor.is_active })
    }).then(() => fetchMonitors());
  };

  return (
    <div>
      <div className="header">
        <h2 style={{ margin: 0 }}>Monitors Config</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> Add Monitor
        </button>
      </div>

      {showForm && (
        <form className="glass-panel" onSubmit={handleAdd} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label>Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>URL</label>
              <input value={form.url} onChange={e => setForm({...form, url: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Interval (seconds)</label>
              <input type="number" value={form.check_interval_seconds} onChange={e => setForm({...form, check_interval_seconds: Number(e.target.value)})} required />
            </div>
            <div className="input-group">
              <label>Method</label>
              <select value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Save Monitor</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {monitors.map(m => (
          <div key={m.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>{m.name}</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {m.url} • Every {m.check_interval_seconds}s
                {!m.is_active && <span style={{ color: 'var(--warning)', marginLeft: '8px' }}>(Paused)</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn" onClick={() => togglePause(m)}>
                {m.is_active ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button className="btn" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(m.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
