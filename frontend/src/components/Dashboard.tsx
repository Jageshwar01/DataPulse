import React, { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, XCircle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<Record<number, any[]>>({});

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/monitors`)
      .then(res => res.json())
      .then(data => {
        setMonitors(data.filter((m: any) => m.is_active));
        const initialData: any = {};
        data.forEach((m: any) => {
          initialData[m.id] = [];
        });
        setLiveData(initialData);
      });

    const handleUpdate = (e: any) => {
      const { monitorId, checkResult } = e.detail;
      setLiveData(prev => {
        const history = prev[monitorId] || [];
        const newHistory = [...history, { time: new Date().toLocaleTimeString(), latency: checkResult.latency_ms, success: checkResult.success }];
        if (newHistory.length > 20) newHistory.shift();
        return { ...prev, [monitorId]: newHistory };
      });
    };

    window.addEventListener('monitor_update', handleUpdate);
    return () => window.removeEventListener('monitor_update', handleUpdate);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
      {monitors.map(monitor => {
        const history = liveData[monitor.id] || [];
        const latest = history[history.length - 1];
        const isUp = latest ? latest.success : true;

        return (
          <div key={monitor.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{monitor.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{monitor.url}</span>
              </div>
              {latest && (
                isUp 
                  ? <CheckCircle color="var(--success)" size={24} /> 
                  : <XCircle color="var(--danger)" size={24} />
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Latency</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  {latest ? `${latest.latency}ms` : '--'}
                </div>
              </div>
            </div>

            <div style={{ height: '100px', marginTop: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <Line 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="var(--accent)" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--panel-border)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
