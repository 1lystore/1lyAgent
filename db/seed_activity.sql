-- Seed initial activity log entries

INSERT INTO activity_log (event, data, created_at)
VALUES
  ('AGENT_ONLINE', 'System initialized | OpenClaw + Claude 4.5 | Ready for requests', NOW() - INTERVAL '2 minutes'),
  ('STORE_VERIFIED', '1ly store: 1lyagent | Status: ACTIVE | https://1ly.store/1lyagent', NOW() - INTERVAL '1 minute')
ON CONFLICT DO NOTHING;
