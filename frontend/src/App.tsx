import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Activity, Bell, Settings, LayoutDashboard } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Monitors from './components/Monitors';
import Incidents from './components/Incidents';

function App() {
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setWsConnected(true);
      };
      
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connect, 2000); // Auto-reconnect
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'MONITOR_UPDATE') {
          window.dispatchEvent(new CustomEvent('monitor_update', { detail: payload.data }));
        }
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="layout">
        <aside className="sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <Activity color="var(--accent)" size={32} />
            <h2 style={{ margin: 0 }}>DataPulse</h2>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link to="/" className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            <Link to="/monitors" className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
              <Settings size={20} /> Monitors
            </Link>
            <Link to="/incidents" className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none' }}>
              <Bell size={20} /> Incidents
            </Link>
          </nav>
        </aside>

        <main className="main-content">
          <header className="header">
            <div>
              <h1 style={{ marginBottom: '8px' }}>System Overview</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Real-time monitoring and alerting.</p>
            </div>
            <div className="connection-status">
              <div className={`status-dot ${wsConnected ? 'connected' : 'disconnected'}`}></div>
              {wsConnected ? 'Connected Live' : 'Reconnecting...'}
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/monitors" element={<Monitors />} />
            <Route path="/incidents" element={<Incidents />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
