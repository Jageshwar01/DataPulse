import { pool } from '../db';
import { handleIncident } from './alerting';

export async function evaluateThresholds(monitor: any, latestCheck: any) {
  // Calculate p95 latency and error rate over a rolling 5 minute window.
  const windowQuery = `
    SELECT 
      success, 
      latency_ms 
    FROM check_results 
    WHERE monitor_id = $1 
      AND checked_at >= NOW() - INTERVAL '5 minutes'
    ORDER BY checked_at ASC
  `;

  const { rows } = await pool.query(windowQuery, [monitor.id]);
  
  if (rows.length === 0) return;

  const totalChecks = rows.length;
  const failedChecks = rows.filter(r => !r.success).length;
  const errorRate = (failedChecks / totalChecks) * 100;

  // Calculate p95 latency
  const latencies = rows.map(r => r.latency_ms).sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.floor(latencies.length * 0.95) - 1);
  const p95Latency = latencies[p95Index] || 0;

  let isFailing = false;
  let incidentType = null;
  let triggerValue = null;

  if (errorRate >= monitor.error_rate_threshold_pct) {
    isFailing = true;
    incidentType = 'error_rate';
    triggerValue = errorRate;
  } else if (p95Latency >= monitor.latency_threshold_ms) {
    isFailing = true;
    incidentType = 'latency';
    triggerValue = p95Latency;
  }

  return await handleIncident(monitor, isFailing, incidentType, triggerValue);
}
