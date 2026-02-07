-- Activity Log Table
-- Stores all agent activity for public dashboard feed

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event VARCHAR(50) NOT NULL,
  data TEXT NOT NULL,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_request_id ON activity_log(request_id);

-- Enable RLS (Row Level Security)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read activity logs (public feed)
CREATE POLICY "Activity logs are publicly readable"
  ON activity_log FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Only service role can insert
CREATE POLICY "Only service role can insert activity"
  ON activity_log FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMENT ON TABLE activity_log IS 'Public activity feed showing all agent actions in real-time';
COMMENT ON COLUMN activity_log.event IS 'Event type: AGENT_ONLINE, REQUEST_RECEIVED, CLASSIFICATION, LINK_CREATED, PAYMENT_CONFIRMED, FULFILLED, COFFEE_TIP, COFFEE_EXECUTED, ERROR';
COMMENT ON COLUMN activity_log.data IS 'Event details (may contain truncated prompt for privacy)';
