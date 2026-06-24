import express from 'express';
import { pool } from '../db';
import { scheduleMonitor, stopMonitor } from '../engine/poller';

export const apiRouter = express.Router();

apiRouter.get('/monitors', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM monitors ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

apiRouter.post('/monitors', async (req, res) => {
  try {
    const { name, url, method, expected_status, check_interval_seconds, latency_threshold_ms, error_rate_threshold_pct, webhook_url } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO monitors (name, url, method, expected_status, check_interval_seconds, latency_threshold_ms, error_rate_threshold_pct, webhook_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, url, method || 'GET', expected_status || 200, check_interval_seconds || 60, latency_threshold_ms || 1000, error_rate_threshold_pct || 50, webhook_url]
    );
    scheduleMonitor(rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

apiRouter.put('/monitors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, method, expected_status, check_interval_seconds, latency_threshold_ms, error_rate_threshold_pct, webhook_url, is_active } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE monitors 
       SET name = $1, url = $2, method = $3, expected_status = $4, check_interval_seconds = $5, 
           latency_threshold_ms = $6, error_rate_threshold_pct = $7, webhook_url = $8, is_active = $9
       WHERE id = $10 RETURNING *`,
      [name, url, method, expected_status, check_interval_seconds, latency_threshold_ms, error_rate_threshold_pct, webhook_url, is_active, id]
    );
    
    const monitor = rows[0];
    if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

    if (monitor.is_active) {
      scheduleMonitor(monitor);
    } else {
      stopMonitor(monitor.id);
    }
    
    res.json(monitor);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

apiRouter.delete('/monitors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    stopMonitor(Number(id));
    await pool.query('DELETE FROM monitors WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

apiRouter.get('/monitors/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM check_results 
       WHERE monitor_id = $1 AND checked_at >= NOW() - INTERVAL '1 hour' * $2
       ORDER BY checked_at ASC`,
      [id, Number(hours)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

apiRouter.get('/incidents', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM incidents ORDER BY opened_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
