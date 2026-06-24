import { pool } from '../db';

export async function performCheck(monitor: any) {
  const startTime = Date.now();
  let success = false;
  let statusCode = null;
  let errorMessage = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(monitor.url, {
      method: monitor.method,
      signal: controller.signal
    });
    clearTimeout(timeout);

    statusCode = response.status;
    success = (statusCode === monitor.expected_status);
  } catch (error: any) {
    errorMessage = error.message;
    success = false;
  }

  const latencyMs = Date.now() - startTime;

  const result = await pool.query(
    `INSERT INTO check_results (monitor_id, status_code, latency_ms, success, error_message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [monitor.id, statusCode, latencyMs, success, errorMessage]
  );

  return result.rows[0];
}
