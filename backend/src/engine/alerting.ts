import { pool } from '../db';

export async function handleIncident(monitor: any, isFailing: boolean, incidentType: string | null, triggerValue: number | null) {
  // Check if there is an active incident
  const activeIncidentQuery = `SELECT * FROM incidents WHERE monitor_id = $1 AND resolved_at IS NULL ORDER BY opened_at DESC LIMIT 1`;
  const { rows } = await pool.query(activeIncidentQuery, [monitor.id]);
  const activeIncident = rows[0];

  if (isFailing && !activeIncident) {
    // Open new incident
    const { rows: newIncidentRows } = await pool.query(
      `INSERT INTO incidents (monitor_id, type, trigger_value) VALUES ($1, $2, $3) RETURNING *`,
      [monitor.id, incidentType, triggerValue]
    );
    const incident = newIncidentRows[0];
    
    await sendAlert(monitor, incident, 'OPEN');
    return incident;
  } else if (!isFailing && activeIncident) {
    // Resolve incident
    await pool.query(
      `UPDATE incidents SET resolved_at = NOW() WHERE id = $1`,
      [activeIncident.id]
    );
    
    await sendAlert(monitor, activeIncident, 'RESOLVED');
    return { ...activeIncident, resolved_at: new Date() };
  } else if (activeIncident) {
    return activeIncident;
  }
  return null;
}

async function sendAlert(monitor: any, incident: any, status: 'OPEN' | 'RESOLVED') {
  const webhookUrl = monitor.webhook_url || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    text: `*${status}*: Monitor ${monitor.name} (${monitor.url})\nIncident Type: ${incident.type}\nTrigger Value: ${incident.trigger_value}`
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await pool.query(
      `INSERT INTO alert_logs (incident_id, webhook_url, payload, response_status) VALUES ($1, $2, $3, $4)`,
      [incident.id, webhookUrl, payload, response.status]
    );
  } catch (error: any) {
    console.error(`Failed to send alert for monitor ${monitor.id}:`, error);
    await pool.query(
      `INSERT INTO alert_logs (incident_id, webhook_url, payload, response_status) VALUES ($1, $2, $3, $4)`,
      [incident.id, webhookUrl, payload, 0]
    );
  }
}
