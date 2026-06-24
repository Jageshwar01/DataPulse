INSERT INTO monitors (name, url, method, expected_status, check_interval_seconds, latency_threshold_ms, error_rate_threshold_pct)
VALUES 
  ('HTTPBin GET', 'https://httpbin.org/get', 'GET', 200, 10, 1000, 50),
  ('HTTPBin 500', 'https://httpbin.org/status/500', 'GET', 200, 15, 1000, 50),
  ('HTTPBin Slow', 'https://httpbin.org/delay/2', 'GET', 200, 20, 1000, 50);
