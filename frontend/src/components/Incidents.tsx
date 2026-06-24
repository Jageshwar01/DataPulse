import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface Incident {
  id: number;
  monitor_id: number;
  type: string;
  opened_at: string;
  resolved_at: string | null;
  trigger_value: number;
  request_trace: any;
}

interface Monitor {
  id: number;
  name: string;
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [monitors, setMonitors] = useState<Record<number, Monitor>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, monRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/incidents`),
          fetch(`${import.meta.env.VITE_API_URL}/monitors`)
        ]);
        const incData = await incRes.json();
        const monData = await monRes.json();

        const monMap: Record<number, Monitor> = {};
        monData.forEach((m: Monitor) => {
          monMap[m.id] = m;
        });

        setIncidents(incData);
        setMonitors(monMap);
      } catch (err) {
        console.error('Failed to fetch incidents', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>Loading incidents...</div>;
  }

  return (
    <div className="incidents-container">
      <h2 style={{ marginBottom: '20px' }}>Incident History</h2>
      
      {incidents.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <CheckCircle2 color="var(--success)" size={64} style={{ margin: '0 auto 16px', opacity: 0.8 }} />
          <h3>All Systems Operational</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No incidents have been recorded.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {incidents.map(inc => (
            <div key={inc.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px' }}>
              <div style={{ flexShrink: 0 }}>
                {inc.resolved_at ? (
                  <CheckCircle2 color="var(--success)" size={32} />
                ) : (
                  <AlertTriangle color="var(--danger)" size={32} />
                )}
              </div>
              <div style={{ flexGrow: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {monitors[inc.monitor_id]?.name || 'Unknown Monitor'}
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '4px 12px', 
                    borderRadius: '12px',
                    background: inc.resolved_at ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                    color: inc.resolved_at ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${inc.resolved_at ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`
                  }}>
                    {inc.resolved_at ? 'RESOLVED' : 'ACTIVE'}
                  </span>
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Type: <strong style={{ color: 'var(--text-primary)' }}>{inc.type.toUpperCase()}</strong> | 
                  Triggered at: <strong style={{ color: 'var(--text-primary)' }}>{inc.trigger_value}</strong>
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <Clock size={14} /> Opened: {new Date(inc.opened_at).toLocaleString()}
                </div>
                {inc.resolved_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                    <CheckCircle2 size={14} /> Resolved: {new Date(inc.resolved_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
