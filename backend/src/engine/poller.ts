import { pool } from '../db';
import { performCheck } from './checker';
import { evaluateThresholds } from './metrics';
import { broadcastMonitorUpdate } from '../ws/server';

const activeIntervals = new Map<number, NodeJS.Timeout>();

export async function startPollingEngine() {
  const result = await pool.query('SELECT * FROM monitors WHERE is_active = true');
  const monitors = result.rows;

  for (const monitor of monitors) {
    scheduleMonitor(monitor);
  }
}

export function scheduleMonitor(monitor: any) {
  if (activeIntervals.has(monitor.id)) {
    clearInterval(activeIntervals.get(monitor.id));
  }

  const intervalId = setInterval(async () => {
    try {
      const checkResult = await performCheck(monitor);
      const incident = await evaluateThresholds(monitor, checkResult);
      broadcastMonitorUpdate(monitor.id, checkResult, incident);
    } catch (err) {
      console.error(`Error polling monitor ${monitor.id}:`, err);
    }
  }, monitor.check_interval_seconds * 1000);

  activeIntervals.set(monitor.id, intervalId);
}

export function stopMonitor(monitorId: number) {
  if (activeIntervals.has(monitorId)) {
    clearInterval(activeIntervals.get(monitorId));
    activeIntervals.delete(monitorId);
  }
}
