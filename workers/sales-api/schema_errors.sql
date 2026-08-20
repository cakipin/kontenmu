CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    service TEXT,
    endpoint TEXT,
    error_message TEXT,
    stack_trace TEXT,
    ai_analysis TEXT,
    status TEXT DEFAULT 'new'
);
