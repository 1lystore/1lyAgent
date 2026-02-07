-- Add real-time auto-buy status fields to credit_state table
-- For live UI feedback showing agent's autonomous behavior

ALTER TABLE credit_state
ADD COLUMN IF NOT EXISTS auto_buy_in_progress BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_auto_buy_status TEXT, -- 'success', 'failed', or NULL
ADD COLUMN IF NOT EXISTS last_auto_buy_message TEXT,
ADD COLUMN IF NOT EXISTS last_auto_buy_error TEXT;

-- Update existing row to have default values
UPDATE credit_state
SET
  auto_buy_in_progress = false,
  last_auto_buy_status = NULL,
  last_auto_buy_message = NULL,
  last_auto_buy_error = NULL
WHERE auto_buy_in_progress IS NULL;

-- Add comment
COMMENT ON COLUMN credit_state.auto_buy_in_progress IS 'True when purchase is actively happening (for live UI)';
COMMENT ON COLUMN credit_state.last_auto_buy_status IS 'Last purchase result: success or failed';
COMMENT ON COLUMN credit_state.last_auto_buy_message IS 'Human-readable message for UI display';
COMMENT ON COLUMN credit_state.last_auto_buy_error IS 'Technical error details if failed';
